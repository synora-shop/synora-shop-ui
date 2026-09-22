"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, requireShop } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { THEMES } from "@/lib/themes/registry";
import type { Prisma } from "@/lib/generated/prisma/client";

export type ThemeResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; error: string };

/**
 * Adds a copy of a theme to this shop's library.
 *
 * **A copy, every time.** Press Add twice on KITE and the library holds two
 * KITEs, each with its own edits, its own version and its own Added date, and
 * either can be activated. That is the point of the library and it is what the
 * Themes screen was drawn showing: a design being worked on, beside the one
 * serving customers, with neither standing in the other's way.
 *
 * It used to upsert on (shop, theme), so the second Add found the first row,
 * updated nothing, and reported success. A merchant asking for a second copy
 * got a toast saying they had one.
 *
 * Nothing is downloaded — every theme ships with the platform. What a row
 * records is a merchant saying *this one is mine now*, and what makes it worth
 * having is that it can be previewed and customised for a week without a
 * single customer seeing it.
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

  // Sealed at the version that ships today. A copy added in August stays at
  // the version it was added at — that is what makes Update mean something,
  // and what lets two copies of one theme sit at two versions.
  const copy = await (await db()).installedTheme.create({
    data: { shopId: shop.id, themeKey, version: theme.version },
  });

  // How many this shop now has, so the message can say which one this is
  // rather than implying there is only ever one.
  const count = await (await db()).installedTheme.count({ where: { themeKey } });

  revalidatePath("/admin/theme");
  return {
    ok: true,
    message:
      count > 1
        ? `Another copy of ${theme.name} was added. You now have ${count}.`
        : `${theme.name} was added to your themes.`,
    id: copy.id,
  };
}

/**
 * Moves a theme the shop already has onto the version that ships now.
 *
 * What changes is which set of defaults the merchant's edits sit on top of —
 * and that is the whole reason this is safe. Their row holds only their
 * *differences*; the theme's own values stay in the registry. So an update
 * changes everything they did not choose and nothing they did, and it cannot
 * quietly overwrite a colour they picked in August.
 *
 * That property is load-bearing. If a resolved copy were ever written to
 * InstalledTheme.tokens — which is what the 26 October migration deliberately
 * moved away from — this action would become destructive overnight and nothing
 * here would look any different.
 *
 * It does not touch the live theme's identity. Updating the theme a storefront
 * is wearing changes how it looks, immediately and on purpose: that is what the
 * merchant pressed.
 */
export async function updateTheme(copyId: string): Promise<ThemeResult> {
  await requireRole("ADMIN");

  const prisma = await db();
  // Scoped by the tenant client, so an id belonging to another shop finds
  // nothing rather than updating somebody else's design.
  const row = await prisma.installedTheme.findFirst({
    where: { id: copyId },
    select: { themeKey: true, version: true },
  });
  if (!row) return { ok: false, error: "That copy is not in your themes." };
  if (!(row.themeKey in THEMES)) return { ok: false, error: "That theme no longer exists." };

  const shop = await requireShop();
  const theme = THEMES[row.themeKey];

  // Already current. Not an error — a second tab, or two presses — but nothing
  // should be written, and the merchant should be told the truth rather than
  // shown a success for an update that did not happen.
  if (row.version === theme.version) {
    return { ok: true, message: `${theme.name} is already up to date.` };
  }

  await prisma.installedTheme.update({
    where: { id: copyId },
    data: { version: theme.version },
  });

  // The storefront only changes if this is the theme it is wearing, but the
  // cache cannot know that cheaply and dropping it is cheap.
  invalidateShop(shop.id, "theme");
  revalidatePath("/admin/theme");
  return {
    ok: true,
    message: `${theme.name} was updated to ${theme.version}. Your own changes were kept.`,
  };
}

/**
 * Removes a theme from the library.
 *
 * Never the live one. Removing the design a storefront is currently wearing
 * would leave the shop rendering a theme it does not have, which is a state
 * with no honest screen to show for it.
 */
export async function removeTheme(copyId: string): Promise<ThemeResult> {
  await requireRole("ADMIN");

  const shop = await requireShop();
  const prisma = await db();

  const row = await prisma.installedTheme.findFirst({
    where: { id: copyId },
    select: { themeKey: true },
  });
  if (!row) return { ok: false, error: "That copy is not in your themes." };

  const settings = await prisma.themeSettings.findFirst({
    where: { businessType: shop.businessType },
    select: { installedThemeId: true },
  });

  // The live *copy*, not the live theme. A shop with two copies of KITE may
  // remove the one it is not wearing, which was impossible while this asked
  // about the theme — it refused both, on the grounds that one of them was
  // live.
  if (settings?.installedThemeId === copyId) {
    return {
      ok: false,
      error: "This is the copy your store is using. Activate another one first.",
    };
  }

  await prisma.installedTheme.delete({ where: { id: copyId } });
  revalidatePath("/admin/theme");
  return { ok: true, message: `That copy of ${THEMES[row.themeKey]?.name ?? "the theme"} was removed.` };
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
export async function chooseTheme(copyId: string): Promise<ThemeResult> {
  await requireRole("ADMIN");

  const shop = await requireShop();
  const prisma = await db();

  // A copy of this shop's, or nothing. Only something in the library may go
  // live — that is the whole point of there being a library, and it is what
  // stops publishing being the first act by accident.
  const copy = await prisma.installedTheme.findFirst({
    where: { id: copyId },
    select: { id: true, themeKey: true },
  });
  if (!copy) return { ok: false, error: "Add this theme to your store before activating it." };

  // An unknown key would be stored and then silently fall back on every read,
  // which looks like the choice not sticking.
  if (!(copy.themeKey in THEMES)) return { ok: false, error: "That theme no longer exists." };

  const key = { shopId: shop.id, businessType: shop.businessType };

  // Both, and they answer different questions. themeKey is what the storefront
  // renders; installedThemeId is whose edits it renders with. Two copies of
  // KITE are both KITE, so the key alone cannot say which design is live.
  await prisma.themeSettings.upsert({
    where: { shopId_businessType: key },
    update: { themeKey: copy.themeKey, installedThemeId: copy.id },
    create: {
      ...key,
      themeKey: copy.themeKey,
      installedThemeId: copy.id,
      tokens: {} as Prisma.InputJsonValue,
    },
  });

  invalidateShop(shop.id, "theme");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");
  return { ok: true, message: `${THEMES[copy.themeKey].name} is now live.` };
}
