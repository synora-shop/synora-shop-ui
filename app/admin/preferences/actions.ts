"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { cleanBlockedList } from "@/lib/geo-block";
import type { Visibility } from "@/lib/visibility";

/**
 * Saves who can see the shop.
 *
 * Its own action rather than a corner of the Global Edits save, and that is the
 * point of the split: taking a store offline and changing a badge colour were
 * one form and one write, so a merchant editing typography was rewriting
 * maintenance mode every time they pressed save.
 *
 * The country list is re-cleaned here rather than trusted. It reaches the edge
 * and decides whether a visitor sees the shop at all, so a hand-edited value
 * must not be able to store something that is not a country.
 */
export async function saveVisibility(input: Visibility): Promise<{ error?: string }> {
  await requireRole("ADMIN");

  // maintenanceMode is deliberately absent: it belongs to Your App →
  // Maintenance now, and writing it from here would undo that screen every
  // time somebody saved this one.
  const data = {
    blockedCountries: cleanBlockedList(input.blockedCountries ?? []),
    searchIndexing: input.searchIndexing !== false,
    spamProtection: input.spamProtection !== false,
  };

  const shopId = await currentShopId();
  await (await db()).storeSettings.upsert({
    where: { shopId },
    update: data,
    create: { shopId, ...data },
  });

  invalidateShop(shopId, "settings");
  revalidatePath("/admin/preferences");
  // The storefront reads all four on every request, and robots.txt reads one of
  // them, so the whole public tree has to be let go of — not just this screen.
  revalidatePath("/", "layout");
  return {};
}
