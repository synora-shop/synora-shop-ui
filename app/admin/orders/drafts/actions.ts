"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { canonicalUrl, currentShopId, db, shopNotificationEmail } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { invalidateShop } from "@/lib/data/cached";
import { sendDraftOrderEmail, sendOrderEmails } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { provinceForCity } from "@/lib/cities";
import { isValidEmail, isValidPakistaniPhone } from "@/lib/validation";
import { generateOrderId } from "@/lib/order-id";
import { orderLink } from "@/lib/order-access";
import { paymentLabel } from "@/lib/order-status-style";
import { whatsappNumber } from "@/lib/abandoned";
import {
  DRAFT_CHANNELS, DRAFT_PAYMENTS, draftLabel, draftSummary, draftTotals, readDraftLines, type DraftLine,
} from "@/lib/draft-orders";

/**
 * Orders made by hand (new admin, 15 October). Save a draft, send its summary
 * to the customer, make it an order, or delete it.
 */
export type DraftInput = {
  id?: string;
  channel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2: string;
  shippingCity: string;
  shippingPostalCode: string;
  lines: DraftLine[];
  shippingFee: number;
  discountAmount: number;
  paymentMethod: string;
  paid: boolean;
  notes: string;
};

const cut = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const whole = (v: unknown, max = 100_000_000) => (Number.isInteger(v) && (v as number) >= 0 ? Math.min(v as number, max) : 0);

function clean(input: DraftInput) {
  return {
    channel: (DRAFT_CHANNELS as readonly string[]).includes(input.channel) ? input.channel : "Other",
    customerName: cut(input.customerName, 120),
    customerEmail: cut(input.customerEmail, 200).toLowerCase(),
    customerPhone: cut(input.customerPhone, 30),
    shippingLine1: cut(input.shippingLine1, 200),
    shippingLine2: cut(input.shippingLine2, 200),
    shippingCity: provinceForCity(cut(input.shippingCity, 80)) ? cut(input.shippingCity, 80) : "",
    shippingPostalCode: cut(input.shippingPostalCode, 20),
    lines: readDraftLines(input.lines),
    shippingFee: whole(input.shippingFee),
    discountAmount: whole(input.discountAmount),
    paymentMethod: (DRAFT_PAYMENTS as readonly string[]).includes(input.paymentMethod) ? input.paymentMethod : "COD",
    paid: input.paid === true,
    notes: cut(input.notes, 1000),
  };
}

export async function saveDraftOrder(input: DraftInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireRole("STAFF");
  const data = clean(input);
  const scoped = await db();

  if (input.id) {
    const existing = await scoped.draftOrder.findFirst({ where: { id: input.id }, select: { status: true } });
    if (!existing) return { ok: false, error: "That draft is no longer there." };
    if (existing.status === "COMPLETED") return { ok: false, error: "This draft is already an order." };
    await scoped.draftOrder.update({ where: { id: input.id }, data });
    revalidatePath("/admin/orders/drafts");
    return { ok: true, id: input.id };
  }

  // The next number for this shop. Two drafts started at the same moment can
  // pick the same one; the unique index refuses the second and it tries again.
  const shopId = await currentShopId();
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await scoped.draftOrder.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
    try {
      const created = await scoped.draftOrder.create({ data: { ...data, shopId, number: (last?.number ?? 0) + 1 } });
      revalidatePath("/admin/orders/drafts");
      return { ok: true, id: created.id };
    } catch (err) {
      if (!(err && typeof err === "object" && "code" in err && err.code === "P2002")) throw err;
    }
  }
  return { ok: false, error: "The draft could not be numbered. Try again." };
}

/** What the customer is sent, built from the draft as saved. */
async function summaryFor(draftId: string) {
  const scoped = await db();
  const draft = await scoped.draftOrder.findFirst({ where: { id: draftId } });
  if (!draft) return null;
  const lines = readDraftLines(draft.lines);
  const variants = await scoped.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    select: { id: true, option1: true, option2: true, size: true, color: true, product: { select: { title: true } } },
  });
  const settings = await getStoreSettings();
  const currency = resolveStoreDefaults(settings).currency;
  const shopName = settings.storeName || "our store";
  const items = lines.flatMap((l) => {
    const v = variants.find((x) => x.id === l.variantId);
    if (!v) return [];
    return [{ title: v.product.title, option: [v.option1 || v.size, v.option2 || v.color].filter(Boolean).join(" · "), quantity: l.quantity, price: l.price }];
  });
  const address = [draft.shippingLine1, draft.shippingLine2, draft.shippingCity].filter(Boolean).join(", ");
  const text = draftSummary({
    shopName,
    name: draft.customerName,
    items,
    totals: draftTotals({ lines, shippingFee: draft.shippingFee, discountAmount: draft.discountAmount }),
    address,
    payment: draft.paid ? `${paymentLabel(draft.paymentMethod)}, already paid` : paymentLabel(draft.paymentMethod),
    money: (n) => formatMoney(n, currency),
  });
  return { draft, items, text, shopName };
}

/**
 * Send the summary to confirm: a WhatsApp message written out for the
 * merchant to send when there is a phone number, and an email when there is
 * an address. Either way the draft is marked sent.
 */
export async function sendDraftOrder(
  id: string
): Promise<{ ok: true; whatsappUrl?: string; emailed: boolean } | { ok: false; error: string }> {
  await requireRole("STAFF");
  const s = await summaryFor(id);
  if (!s) return { ok: false, error: "That draft is no longer there." };
  if (s.draft.status === "COMPLETED") return { ok: false, error: "This draft is already an order." };
  if (s.items.length === 0) return { ok: false, error: "Add something to the order first." };

  const number = whatsappNumber(s.draft.customerPhone);
  const email = isValidEmail(s.draft.customerEmail) ? s.draft.customerEmail : "";
  if (!number && !email) return { ok: false, error: "Add the customer's phone number or email to send it." };

  let emailed = false;
  if (email) {
    try {
      await sendDraftOrderEmail(email, { shopName: s.shopName, text: s.text, replyTo: (await shopNotificationEmail(s.draft.shopId)) ?? undefined });
      emailed = true;
    } catch (error) {
      console.error("[drafts] email failed", error);
      if (!number) return { ok: false, error: "The email could not be sent. Try again in a minute." };
    }
  }
  await (await db()).draftOrder.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
  revalidatePath("/admin/orders/drafts");
  revalidatePath(`/admin/orders/drafts/${id}`);
  return { ok: true, emailed, whatsappUrl: number ? `https://wa.me/${number}?text=${encodeURIComponent(s.text)}` : undefined };
}

/**
 * Make the draft an ordinary order: the same order a checkout makes, with
 * the stock taken, the cost of each piece kept for profit, and the customer
 * filed. All in one transaction, which begins by claiming the draft, so a
 * second click cannot make a second order.
 */
export async function completeDraftOrder(id: string): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const me = await requireRole("STAFF");
  const shopId = await currentShopId();
  const draft = await (await db()).draftOrder.findFirst({ where: { id } });
  if (!draft) return { ok: false, error: "That draft is no longer there." };
  if (draft.status === "COMPLETED") return { ok: false, error: "This draft is already an order." };

  const lines = readDraftLines(draft.lines);
  const province = provinceForCity(draft.shippingCity);
  if (lines.length === 0) return { ok: false, error: "Add something to the order first." };
  if (!draft.customerName) return { ok: false, error: "Add the customer's name." };
  if (!isValidPakistaniPhone(draft.customerPhone)) return { ok: false, error: "Add a phone number the courier can call." };
  if (!draft.shippingLine1 || !province) return { ok: false, error: "Add the delivery address and city." };
  if (draft.customerEmail && !isValidEmail(draft.customerEmail)) return { ok: false, error: "That email address does not look right." };

  const totals = draftTotals({ lines, shippingFee: draft.shippingFee, discountAmount: draft.discountAmount });

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const claimed = await tx.draftOrder.updateMany({
        where: { id, shopId, status: { not: "COMPLETED" } },
        data: { status: "COMPLETED", completedAt: new Date() },
      });
      if (claimed.count === 0) throw new Error("This draft is already an order.");

      const variants = await tx.productVariant.findMany({
        where: { id: { in: lines.map((l) => l.variantId) }, shopId, product: { deletedAt: null } },
        include: { product: { select: { title: true, costPrice: true } } },
      });
      // One line per size: two lines of the same size are counted together
      // against its stock.
      const wanted = new Map<string, number>();
      for (const l of lines) wanted.set(l.variantId, (wanted.get(l.variantId) ?? 0) + l.quantity);
      for (const [variantId, quantity] of wanted) {
        const v = variants.find((x) => x.id === variantId);
        if (!v) throw new Error("Something in this order is no longer in your catalogue. Remove it and try again.");
        if (v.trackInventory && !v.continueSellingWhenOutOfStock && v.stock < quantity) {
          throw new Error(`Only ${Math.max(0, v.stock)} of "${v.product.title}" (${[v.size, v.color].filter(Boolean).join("/")}) left.`);
        }
      }

      const customer = draft.customerEmail
        ? await tx.customer.upsert({
            where: { shopId_email: { shopId, email: draft.customerEmail } },
            update: { name: draft.customerName, phone: draft.customerPhone },
            create: { shopId, email: draft.customerEmail, name: draft.customerName, phone: draft.customerPhone },
          })
        : null;

      let created;
      for (let attempt = 1; ; attempt++) {
        try {
          created = await tx.order.create({
            data: {
              id: generateOrderId(),
              shopId,
              customerId: customer?.id ?? null,
              customerName: draft.customerName,
              customerEmail: draft.customerEmail,
              customerPhone: draft.customerPhone,
              shippingLine1: draft.shippingLine1,
              shippingLine2: draft.shippingLine2 || null,
              shippingCity: draft.shippingCity,
              shippingProvince: province,
              shippingPostalCode: draft.shippingPostalCode || null,
              paymentMethod: draft.paymentMethod as (typeof DRAFT_PAYMENTS)[number],
              // The merchant's own word, from an admin session: "Already paid".
              paymentStatus: draft.paid ? "CONFIRMED" : "PENDING",
              // The customer has said yes already: that is what the draft was for.
              orderStatus: "CONFIRMED",
              notes: draft.notes || null,
              discountAmount: totals.discount,
              subtotal: totals.subtotal,
              shippingFee: totals.shipping,
              total: totals.total,
              items: {
                create: lines.map((l) => {
                  const v = variants.find((x) => x.id === l.variantId)!;
                  return {
                    shopId,
                    productId: v.productId,
                    variantId: v.id,
                    title: v.product.title,
                    size: v.size,
                    color: v.color,
                    price: l.price,
                    costPrice: v.product.costPrice,
                    quantity: l.quantity,
                  };
                }),
              },
            },
            include: { items: true },
          });
          break;
        } catch (err) {
          const collision = err && typeof err === "object" && "code" in err && err.code === "P2002";
          if (!collision || attempt >= 5) throw err;
        }
      }

      for (const [variantId, quantity] of wanted) {
        await tx.productVariant.updateMany({ where: { id: variantId, shopId, trackInventory: true }, data: { stock: { decrement: quantity } } });
      }
      await tx.draftOrder.updateMany({ where: { id, shopId }, data: { orderId: created.id } });
      await tx.orderEvent.create({
        data: { shopId, orderId: created.id, kind: "stage", text: `Made by hand from draft ${draftLabel(draft.number)} (${draft.channel}).`, by: me.email },
      });
      return created;
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "The order could not be made." };
  }

  // The customer's confirmation, with the link to their order. Not the
  // merchant's new-order notice: they made it.
  if (order.customerEmail) {
    await sendOrderEmails({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      paymentMethod: order.paymentMethod,
      shopName: (await getStoreSettings()).storeName || "our store",
      notifyEmail: null,
      orderUrl: orderLink(await canonicalUrl(shopId), order.id, order.accessKey),
    }).catch((err) => console.error("[drafts] confirmation email failed", err));
  }

  invalidateShop(shopId, "catalog", "filters");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/orders/drafts");
  revalidatePath("/admin");
  return { ok: true, orderId: order.id };
}

export async function deleteDraftOrder(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole("STAFF");
  const scoped = await db();
  const draft = await scoped.draftOrder.findFirst({ where: { id }, select: { status: true } });
  if (!draft) return { ok: true };
  if (draft.status === "COMPLETED") return { ok: false, error: "This draft is an order now. Delete the order instead." };
  await scoped.draftOrder.delete({ where: { id } });
  revalidatePath("/admin/orders/drafts");
  return { ok: true };
}
