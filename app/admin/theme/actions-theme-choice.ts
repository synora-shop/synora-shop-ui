"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, requireShop } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { THEMES } from "@/lib/themes/registry";
import type { Prisma } from "@/lib/generated/prisma/client";

export type ThemeResult = { ok: true; message: string } | { ok: false; error: string };

/**
 * Adds a theme to this shop's library.
 *
 * Nothing is copied and nothing is downloaded — every theme ships with the
 * platform. What this records is a merchant saying *this one is mine now*, and
 * the reason that is worth a row of its own is what it makes possible: a design
 * you can preview and customise for a week without a single customer seeing it.
 *
 * Before this, the picker had one button and it changed the live storefront.
 */
export async function installTheme(themeKey: string): Promise<ThemeResult> {
  await requireRole("ADMIN");
  if (!(themeKey in THEMES)) return { ok: false, error: "That theme no longer exists." };

  const shop = await requireShop();
  const theme = THEMES[themeKey];

  // A theme built for a blog on a shop's Themes screen would render sections
  // the shop has no content for. The picker only offers the right ones, so
  // reaching here means a stale tab or a hand-made request.
  const type = shop.businessType.toLowerCase();
  if (!theme.businessTypes.includes(type as never)) {
    return { ok: false, error: `${theme.name} is not made for this kind of store.` };
  }

  await (await db()).installedTheme.upsert({
    where: { shopId_themeKey: { shopId: shop.id, themeKey } },
    // Already there. Re-adding is not an error and must not reset the date —
    // "Added 3 weeks ago" is how a merchant tells two half-tried designs apart.
    update: {},
    create: { shopId: shop.id, themeKey },
  });

  revalidatePath("/admin/theme");
  return { ok: true, message: `${theme.name} was added to your themes.` };
}

/**
 * Removes a theme from the library.
 *
 * Never the live one. Removing the design a storefront is currently wearing
 * would leave the shop rendering a theme it does not have, which is a state
 * with no honest screen to show for it.
 */
export async function removeTheme(themeKey: string): Promise<ThemeResult> {
  await requireRole("ADMIN");

  const shop = await requireShop();
  const settings = await (await db()).themeSettings.findFirst({
    where: { businessType: shop.businessType },
    select: { themeKey: true },
  });

  if ((settings?.themeKey ?? "aurora") === themeKey) {
    return {
      ok: false,
      error: "This is the theme your store is using. Publish another one first.",
    };
  }

  await (await db()).installedTheme.deleteMany({ where: { themeKey } });
  revalidatePath("/admin/theme");
  return { ok: true, message: `${THEMES[themeKey]?.name ?? "That theme"} was removed.` };
}

/**
 * Switches which design this storefront wears.
 *
 * The row is keyed by shop and business type, so a merchant who switches to a
 * blog, picks a blog design, and switches back finds their shop's design still
 * chosen. Their colour edits live in the same row and travel with it.
 *
 * Only a theme in the library may be published. That is the whole point of
 * there being a library: publishing is the second act, and it cannot be the
 * first one by accident.
 */
export async function chooseTheme(themeKey: string): Promise<ThemeResult> {
  await requireRole("ADMIN");

  // An unknown key would be stored and then silently fall back on every read,
  // which looks like the choice not sticking.
  if (!(themeKey in THEMES)) return { ok: false, error: "That theme no longer exists." };

  const shop = await requireShop();

  const installed = await (await db()).installedTheme.findFirst({ where: { themeKey } });
  if (!installed) {
    return { ok: false, error: "Add this theme to your store before publishing it." };
  }

  const key = { shopId: shop.id, businessType: shop.businessType };

  await (await db()).themeSettings.upsert({
    where: { shopId_businessType: key },
    update: { themeKey },
    create: { ...key, themeKey, tokens: {} as Prisma.InputJsonValue },
  });

  invalidateShop(shop.id, "theme");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");
  return { ok: true, message: `${THEMES[themeKey].name} is now live.` };
}
