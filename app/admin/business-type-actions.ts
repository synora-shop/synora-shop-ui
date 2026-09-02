"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId } from "@/lib/data/shop";
import { prisma } from "@/lib/prisma";
import { isBusinessType, storedBusinessType } from "@/lib/themes/business-type";

/**
 * Changes what kind of business this shop is, from the top bar.
 *
 * Distinct from the identically-shaped step in the welcome flow, which then
 * sends the merchant on to name their store. This one only switches and stays
 * put, because it is used by someone who already has a shop and is standing in
 * the middle of it.
 *
 * Nothing is deleted. Pages, themes and menus are stored per business type, so
 * a shop that switches to Restaurant and back finds its old storefront exactly
 * where it left it — see PROFILE_MODELS in lib/tenant.ts. Products and orders
 * are shared across types deliberately: a restaurant's dishes are the same rows
 * as a shop's products, wearing different words.
 */
export async function switchBusinessType(value: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole("ADMIN");

  if (!isBusinessType(value)) {
    return { ok: false, error: "That is not a type this platform knows." };
  }

  await prisma.shop.update({
    where: { id: await currentShopId() },
    data: { businessType: storedBusinessType(value) },
  });

  // The sidebar, the accent colour, the words on every screen and which theme
  // is in use all follow the type, so the whole admin tree is stale.
  revalidatePath("/admin", "layout");
  return { ok: true };
}
