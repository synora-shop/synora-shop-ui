"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";

/**
 * Empty the Bin (new admin, 15 October): every product and order in it,
 * deleted for good. Only what is in the Bin: the filter is on deletedAt, so
 * nothing live can be caught by it. An admin's to do, not staff's, since it
 * is everything at once and cannot be undone.
 */
export async function emptyBin(): Promise<{ ok: true; products: number; orders: number } | { ok: false; error: string }> {
  await requireRole("ADMIN");
  const scoped = await db();
  const binned = await scoped.product.findMany({ where: { deletedAt: { not: null } }, select: { id: true, images: true } });

  const [products, orders] = await scoped.$transaction([
    scoped.product.deleteMany({ where: { id: { in: binned.map((p) => p.id) }, deletedAt: { not: null } } }),
    scoped.order.deleteMany({ where: { deletedAt: { not: null } } }),
  ]);

  // Uploaded pictures go with their products, after the rows, as one by one does.
  const blobs = binned.flatMap((p) => p.images).filter((url) => url.includes(".public.blob.vercel-storage.com"));
  if (blobs.length > 0) await Promise.allSettled(blobs.map((url) => del(url)));

  // Binned products were already off the storefront, but the catalogue
  // cache is dropped by every product writer, so nothing stale can outlive it.
  invalidateShop(await currentShopId(), "catalog", "filters");
  revalidatePath("/admin/bin");
  return { ok: true, products: products.count, orders: orders.count };
}
