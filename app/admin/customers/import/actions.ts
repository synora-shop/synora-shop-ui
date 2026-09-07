"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db } from "@/lib/data/shop";
import { readShopifyCustomers, type ImportedCustomer } from "@/lib/csv/customers";
import type { ImportPlan, ImportResult } from "@/lib/csv/plan";

/**
 * Loading a Shopify customer CSV.
 *
 * The same two steps as the product import, for the same reason: the first
 * reads the file and says what it would do, the second does it. A customer
 * list is the most personal thing this platform holds, and overwriting one by
 * accident is not something a merchant can put right from memory.
 *
 * People are matched by email address, which is Shopify's rule and this
 * platform's own unique index.
 */

const MAX_CUSTOMERS = 5000;
const MAX_BYTES = 8 * 1024 * 1024;

function read(csv: string): { error: string } | { reading: ReturnType<typeof readShopifyCustomers> } {
  if (csv.length > MAX_BYTES) {
    return { error: "That file is larger than 8MB. Split it and import the parts." };
  }
  const reading = readShopifyCustomers(csv);
  if (reading.customers.length > MAX_CUSTOMERS) {
    return {
      error: `That file has ${reading.customers.length} people. Import at most ${MAX_CUSTOMERS} at a time.`,
    };
  }
  return { reading };
}

/** What the file says, and what it would do to this shop. Writes nothing. */
export async function planCustomerImport(csv: string): Promise<ImportPlan | { error: string }> {
  await requireRole("STAFF");

  const result = read(csv);
  if ("error" in result) return { error: result.error };
  const { reading } = result;

  const client = await db();
  const existing = await client.customer.findMany({
    where: { email: { in: reading.customers.map((c) => c.email) } },
    select: { email: true },
  });
  const known = new Set(existing.map((c) => c.email.toLowerCase()));

  const rows: ImportPlan["rows"] = reading.customers.map((c) => ({
    key: c.email,
    title: c.name,
    action: known.has(c.email) ? "update" : "create",
    detail: c.address ? "with an address" : "no address",
  }));

  return {
    rows,
    creating: rows.filter((r) => r.action === "create").length,
    updating: rows.filter((r) => r.action === "update").length,
    problems: reading.problems,
    unknownColumns: reading.unknownColumns,
  };
}

/**
 * Writes the file.
 *
 * In batches rather than one person at a time. A customer is a single row with
 * no children to reconcile, so a list of five thousand is one insert and a
 * handful of updates — where a loop would be fifteen thousand round trips to a
 * database in another continent, and a merchant watching a spinner for two
 * minutes wondering whether it had hung.
 *
 * Only the rows that actually differ are updated, so re-importing an unchanged
 * export writes nothing at all.
 */
export async function applyCustomerImport(csv: string): Promise<ImportResult | { error: string }> {
  await requireRole("STAFF");

  const result = read(csv);
  if ("error" in result) return { error: result.error };
  const { reading } = result;
  if (reading.customers.length === 0) return { error: "Nothing in that file to import." };

  const client = await db();
  const shopId = await currentShopId();
  const failed: ImportResult["failed"] = [];

  const emails = reading.customers.map((c) => c.email);
  const existing = await client.customer.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, name: true, phone: true },
  });
  const byEmail = new Map(existing.map((c) => [c.email.toLowerCase(), c]));

  const fresh = reading.customers.filter((c) => !byEmail.has(c.email));
  const { count: created } = await client.customer.createMany({
    data: fresh.map((c) => ({ shopId, email: c.email, name: c.name, phone: c.phone })),
    skipDuplicates: true,
  });

  // The password is never touched. A customer's login is theirs, and a file
  // must not be able to change it or clear it.
  let updated = 0;
  for (const person of reading.customers) {
    const was = byEmail.get(person.email);
    if (!was) continue;
    if (was.name === person.name && was.phone === person.phone) continue;
    try {
      await client.customer.update({
        where: { id: was.id },
        data: { name: person.name, phone: person.phone },
      });
      updated++;
    } catch (error) {
      failed.push({
        key: person.email,
        message: error instanceof Error ? error.message : "Could not be saved.",
      });
    }
  }

  await writeAddresses(client, shopId, reading.customers, failed);

  revalidatePath("/admin/customers");
  return { created, updated, failed };
}

type Client = Awaited<ReturnType<typeof db>>;

/**
 * The address the file gave, for everyone who gave one.
 *
 * Labelled "Imported" and rewritten on every import, so a merchant re-loading
 * a corrected file gets a corrected address rather than a second one. Any
 * address a customer added themselves carries a different label and is never
 * touched.
 */
async function writeAddresses(
  client: Client,
  shopId: string,
  people: ImportedCustomer[],
  failed: ImportResult["failed"]
) {
  const withAddress = people.filter((p) => p.address !== null);
  if (withAddress.length === 0) return;

  const rows = await client.customer.findMany({
    where: { email: { in: withAddress.map((p) => p.email) } },
    select: { id: true, email: true },
  });
  const idFor = new Map(rows.map((r) => [r.email.toLowerCase(), r.id]));

  const mine = await client.address.findMany({
    where: { customerId: { in: [...idFor.values()] }, label: "Imported" },
    select: { id: true, customerId: true },
  });
  const existingFor = new Map(mine.map((a) => [a.customerId, a.id]));

  const toCreate: {
    shopId: string;
    customerId: string;
    label: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postalCode: string | null;
    phone: string;
    isDefault: boolean;
  }[] = [];

  for (const person of withAddress) {
    const customerId = idFor.get(person.email);
    if (!customerId || !person.address) continue;
    const data = {
      line1: person.address.line1,
      line2: person.address.line2,
      city: person.address.city,
      province: person.address.province,
      postalCode: person.address.postalCode,
      phone: person.address.phone || person.phone || "",
      isDefault: true,
    };
    const already = existingFor.get(customerId);
    if (already) {
      try {
        await client.address.update({ where: { id: already }, data });
      } catch (error) {
        failed.push({
          key: person.email,
          message: error instanceof Error ? error.message : "Their address could not be saved.",
        });
      }
    } else {
      toCreate.push({ ...data, shopId, customerId, label: "Imported" });
    }
  }

  if (toCreate.length > 0) await client.address.createMany({ data: toCreate });
}
