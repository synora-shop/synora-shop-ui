"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, requireShop } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { THEMES } from "@/lib/themes/registry";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Switches which design this storefront wears.
 *
 * The row is keyed by shop and business type, so a merchant who switches to a
 * blog, picks a blog design, and switches back finds their shop's design still
 * chosen. Their colour edits live in the same row and travel with it.
 */
export async function chooseTheme(themeKey: string) {
  await requireRole("ADMIN");

  // An unknown key would be stored and then silently fall back on every read,
  // which looks like the choice not sticking.
  if (!(themeKey in THEMES)) return;

  const shop = await requireShop();
  const key = { shopId: shop.id, businessType: shop.businessType };

  await (await db()).themeSettings.upsert({
    where: { shopId_businessType: key },
    update: { themeKey },
    create: { ...key, themeKey, tokens: {} as Prisma.InputJsonValue },
  });

  invalidateShop(shop.id, "theme");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");
}
