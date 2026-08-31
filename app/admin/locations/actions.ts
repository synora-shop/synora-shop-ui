"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";

function refresh() {
  revalidatePath("/admin/locations");
  revalidatePath("/");
}

/**
 * A map link we would be willing to send a customer to.
 *
 * Merchant input rendered on the merchant's own domain, so anything that is not
 * plainly http(s) is dropped rather than stored. The storefront checks again on
 * the way out, because a value can predate this rule.
 */
function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : null;
}

export async function createLocation(formData: FormData) {
  await requireRole("STAFF");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name || !address) return;

  const client = await db();
  const shopId = await currentShopId();
  const count = await client.location.count();

  await client.location.create({
    data: {
      shopId,
      name,
      address,
      city: String(formData.get("city") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      mapUrl: safeUrl(String(formData.get("mapUrl") ?? "")),
      // The first one is the main one. A shop with a single address should
      // never have to think about which is primary.
      isPrimary: count === 0,
      order: count,
    },
  });

  refresh();
}

export async function updateLocation(id: string, formData: FormData) {
  await requireRole("STAFF");

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name || !address) return;

  await (await db()).location.update({
    where: { id },
    data: {
      name,
      address,
      city: String(formData.get("city") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      mapUrl: safeUrl(String(formData.get("mapUrl") ?? "")),
    },
  });

  refresh();
}

export async function makePrimaryLocation(id: string) {
  await requireRole("STAFF");

  const client = await db();
  // Cleared first, so there is never a moment with two. The scoped client keeps
  // this to one shop.
  await client.location.updateMany({ data: { isPrimary: false } });
  await client.location.update({ where: { id }, data: { isPrimary: true } });

  refresh();
}

export async function deleteLocation(id: string) {
  await requireRole("STAFF");

  const client = await db();
  const going = await client.location.findUnique({
    where: { id },
    select: { isPrimary: true },
  });
  await client.location.delete({ where: { id } });

  // Deleting the main address must not leave a shop with none. The next one
  // takes over rather than the merchant discovering the gap on their storefront.
  if (going?.isPrimary) {
    const next = await client.location.findFirst({ orderBy: { order: "asc" } });
    if (next) await client.location.update({ where: { id: next.id }, data: { isPrimary: true } });
  }

  refresh();
}
