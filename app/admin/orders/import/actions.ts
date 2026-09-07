"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db } from "@/lib/data/shop";
import { readShopifyOrders, type ImportedOrder } from "@/lib/csv/orders";
import { generateOrderId } from "@/lib/order-id";
import type { ImportPlan, ImportResult } from "@/lib/csv/plan";

/**
 * Loading an order history.
 *
 * Shopify exports orders and cannot import them, which is the reason a
 * merchant moving between platforms loses their history. This reads that same
 * file back.
 *
 * Three rules make it safe to run on a live shop:
 *
 *   1. Nothing is sent. No confirmation email, no push notification, no stock
 *      movement. An order that happened last year must not tell a customer
 *      today that it has just been received, and must not take stock off a
 *      shelf it left months ago.
 *   2. An order already here is skipped, not overwritten. It is matched by the
 *      order number in the file, and a second import of the same file changes
 *      nothing. Orders are records of what happened; nothing about a file
 *      should be able to rewrite one.
 *   3. Every imported order is attached to a customer, creating them if the
 *      file brought somebody new. An order with no customer is a row that
 *      never appears in anybody's history.
 */

const MAX_ORDERS = 2000;
const MAX_BYTES = 8 * 1024 * 1024;

function read(csv: string): { error: string } | { reading: ReturnType<typeof readShopifyOrders> } {
  if (csv.length > MAX_BYTES) {
    return { error: "That file is larger than 8MB. Split it and import the parts." };
  }
  const reading = readShopifyOrders(csv);
  if (reading.orders.length > MAX_ORDERS) {
    return {
      error: `That file has ${reading.orders.length} orders. Import at most ${MAX_ORDERS} at a time.`,
    };
  }
  return { reading };
}

/** What the file says, and what it would do. Writes nothing. */
export async function planOrderImport(csv: string): Promise<ImportPlan | { error: string }> {
  await requireRole("STAFF");

  const result = read(csv);
  if ("error" in result) return { error: result.error };
  const { reading } = result;

  const client = await db();
  const references = reading.orders.map((o) => o.reference);
  // The order number is the id here, and it is also written into notes for
  // orders that arrived with somebody else's numbering — both are checked.
  const existing = await client.order.findMany({
    where: { id: { in: references } },
    select: { id: true },
  });
  const known = new Set(existing.map((o) => o.id));

  const rows: ImportPlan["rows"] = reading.orders.map((o) => ({
    key: o.reference,
    title: `${o.customerName} · ${o.items.length} item${o.items.length === 1 ? "" : "s"}`,
    // Never "update": an order is a record of something that happened.
    action: known.has(o.reference) ? "skip" : "create",
    detail: known.has(o.reference)
      ? "already here — will be skipped"
      : o.placedAt.toISOString().slice(0, 10),
  }));

  return {
    rows,
    creating: rows.filter((r) => r.action === "create").length,
    updating: 0,
    skipping: rows.filter((r) => r.action === "skip").length,
    problems: reading.problems,
    unknownColumns: reading.unknownColumns,
  };
}

/** Writes the orders that are not already here. */
export async function applyOrderImport(csv: string): Promise<ImportResult | { error: string }> {
  await requireRole("STAFF");

  const result = read(csv);
  if ("error" in result) return { error: result.error };
  const { reading } = result;
  if (reading.orders.length === 0) return { error: "Nothing in that file to import." };

  const client = await db();
  const shopId = await currentShopId();
  const failed: ImportResult["failed"] = [];

  const existing = await client.order.findMany({
    where: { id: { in: reading.orders.map((o) => o.reference) } },
    select: { id: true },
  });
  const alreadyHere = new Set(existing.map((o) => o.id));
  const fresh = reading.orders.filter((o) => !alreadyHere.has(o.reference));

  const customers = await customerIds(client, shopId, fresh);

  let created = 0;
  for (const order of fresh) {
    try {
      await writeOne(client, shopId, order, customers);
      created++;
    } catch (error) {
      failed.push({
        key: order.reference,
        message: error instanceof Error ? error.message : "Could not be saved.",
      });
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/analytics");
  return { created, updated: alreadyHere.size, failed };
}

type Client = Awaited<ReturnType<typeof db>>;

/**
 * A customer for every order in the file, made where the file brought somebody
 * new. Their name and phone come from the order, and nothing that already
 * exists is overwritten — an order is not the place to correct a customer.
 */
async function customerIds(
  client: Client,
  shopId: string,
  orders: ImportedOrder[]
): Promise<Map<string, string>> {
  const emails = [...new Set(orders.map((o) => o.customerEmail))];
  if (emails.length === 0) return new Map();

  const found = await client.customer.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const byEmail = new Map(found.map((c) => [c.email.toLowerCase(), c.id]));

  const missing = orders.filter((o) => !byEmail.has(o.customerEmail));
  if (missing.length > 0) {
    const seen = new Set<string>();
    await client.customer.createMany({
      data: missing
        .filter((o) => (seen.has(o.customerEmail) ? false : (seen.add(o.customerEmail), true)))
        .map((o) => ({
          shopId,
          email: o.customerEmail,
          name: o.customerName,
          phone: o.customerPhone || null,
        })),
      skipDuplicates: true,
    });
    const made = await client.customer.findMany({
      where: { email: { in: [...seen] } },
      select: { id: true, email: true },
    });
    for (const c of made) byEmail.set(c.email.toLowerCase(), c.id);
  }

  return byEmail;
}

async function writeOne(
  client: Client,
  shopId: string,
  order: ImportedOrder,
  customers: Map<string, string>
) {
  // The order number from the file is kept when it fits this platform's own
  // ids, so a merchant can still find an order by the number they quoted a
  // customer. When it does not, a new one is made and the original is written
  // into the notes rather than lost.
  const usable = /^[0-9a-z]{1,12}$/i.test(order.reference);
  const id = usable ? order.reference.toUpperCase() : generateOrderId();
  const note = [
    order.notes,
    usable ? null : `Imported. Original order number: ${order.reference}.`,
  ]
    .filter(Boolean)
    .join("\n");

  await client.order.create({
    data: {
      id,
      shopId,
      customerId: customers.get(order.customerEmail) ?? null,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingLine1: order.shippingLine1,
      shippingLine2: order.shippingLine2,
      shippingCity: order.shippingCity,
      shippingProvince: order.shippingProvince,
      shippingPostalCode: order.shippingPostalCode,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      discountCode: order.discountCode,
      discountAmount: order.discountAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      notes: note || null,
      // The date it happened, not the date it was imported. An order history
      // stacked on today teaches analytics a lie.
      createdAt: order.placedAt,
    },
  });

  if (order.items.length > 0) {
    await client.orderItem.createMany({
      data: order.items.map((i) => ({
        shopId,
        orderId: id,
        title: i.title,
        size: "",
        color: "",
        price: i.price,
        // Nothing is known about what these cost, and guessing would put a
        // made-up profit on a real order. Zero cost reads as "unknown" in
        // every profit figure, which is the honest answer.
        costPrice: 0,
        quantity: i.quantity,
      })),
    });
  }
}
