"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId, requireShop } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { layoutChanges, resolveThemeLayout, type ThemeLayout } from "@/lib/theme-layout";
import { themeLayout, themeTokens } from "@/lib/themes/registry";
import { resolveThemeTokens, type ThemeTokens } from "@/lib/theme-tokens";
import { validateIconFile, safeAssetUrl, MAX_LOGO_BYTES } from "@/lib/icon-validation";
import { scanBuffer, scanPolicyBlocks } from "@/lib/virus-scan";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Saves the store's theme tokens.
 */
export async function saveThemeTokens(
  tokens: Partial<ThemeTokens & ThemeLayout>,
  /**
   * Which theme these edits belong to.
   *
   * Required in practice, defaulted for safety: an omitted key means the live
   * one, which is what every caller meant before a theme could be edited
   * without being published.
   */
  themeKey?: string
) {
  await requireRole("STAFF");

  // Re-resolved against the defaults so an unknown or missing key can never
  // land a malformed token blob in the database.
  const clean = resolveThemeTokens(tokens) as unknown as Prisma.InputJsonValue;

  /**
   * The panel carries one object; the row keeps two columns.
   *
   * The Theme panel edits colour, type and arrangement in one list, because
   * that is one decision to a merchant. Underneath they are different things —
   * a token is a CSS value, a layout choice picks a component — so each is
   * resolved by its own validator, and a key belonging to neither is dropped by
   * both.
   *
   * Only the merchant's *differences* are stored. Writing the whole resolved
   * layout would freeze today's theme defaults into the row, so a later change
   * to the theme would be silently ignored.
   */
  const layout = layoutChanges(resolveThemeLayout(tokens)) as unknown as Prisma.InputJsonValue;

  const shop = await requireShop();
  const key = themeKey ?? (await liveThemeKey(shop.id, shop.businessType));

  /*
   * Written to the theme, not to the shop.
   *
   * This is the whole of what makes an unpublished theme editable. While these
   * lived on ThemeSettings there was one set of colours per shop, applied to
   * whichever theme was live — so editing a draft meant editing the storefront.
   */
  const updated = await (await db()).installedTheme.updateMany({
    where: { themeKey: key },
    data: { tokens: clean, layout },
  });

  // Nothing to write to means the theme is not in this shop's library, which a
  // customizer pointed at a theme the merchant removed in another tab can be.
  if (updated.count === 0) {
    throw new Error("That theme is not in your library. Add it again to keep editing.");
  }

  invalidateShop(await currentShopId(), "theme");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");

  // Both halves back, so the panel's state after a save is exactly what the
  // storefront will render — including any value the validators corrected.
  return { ...resolveThemeTokens(tokens), ...resolveThemeLayout(tokens) };
}

/** Which theme this shop is actually serving, for the callers that need it. */
async function liveThemeKey(shopId: string, businessType: string): Promise<string> {
  const row = await (await db()).themeSettings.findFirst({
    where: { businessType: businessType as never },
    select: { themeKey: true },
  });
  return row?.themeKey ?? "aurora";
}

/**
 * Uploads a logo, on the same hardened path as button icons.
 *
 * A logo is the one uploaded asset that appears on every page of the store, so
 * it goes through the full sequence rather than a generic image upload: format
 * confirmed from the file's own bytes (a renamed file fails), SVG sanitised of
 * anything scriptable, the original scanned before sanitising so the verdict
 * covers the file the admin actually chose, and the resulting URL re-checked
 * before it is handed back.
 */
export async function uploadLogo(formData: FormData): Promise<{ url?: string; error?: string }> {
  return storeIcon(formData, "logos", "Logos");
}

/**
 * Uploads a favicon.
 *
 * Same hardened path as the logo, and deliberately so: it is an icon a
 * merchant supplies that ends up in a `<link href>` on every page of their
 * store, which is the logo's threat model exactly. Only the folder it lands in
 * differs, so the two are told apart in storage.
 */
export async function uploadFavicon(formData: FormData): Promise<{ url?: string; error?: string }> {
  return storeIcon(formData, "favicons", "Favicons");
}

async function storeIcon(
  formData: FormData,
  folder: "logos" | "favicons",
  label: string
): Promise<{ url?: string; error?: string }> {
  await requireRole("STAFF");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "No file selected." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateIconFile(bytes, file.name, { maxBytes: MAX_LOGO_BYTES, label });
  if (!check.ok) return { error: check.error };

  const blocked = scanPolicyBlocks(await scanBuffer(bytes, file.name));
  if (blocked) return { error: blocked };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "File storage isn't configured, so images can't be uploaded on this deployment." };
  }

  try {
    const isSvg = check.format === "svg";
    const body = isSvg ? check.text : Buffer.from(check.bytes);
    // The stored name is generated rather than taken from the upload, so a
    // hostile filename can never shape the URL that ends up inside CSS.
    const blob = await put(`${folder}/${Date.now()}.${isSvg ? "svg" : "png"}`, body, {
      access: "public",
      contentType: isSvg ? "image/svg+xml" : "image/png",
    });
    const url = safeAssetUrl(blob.url);
    if (!url) return { error: "The upload succeeded but returned an address we can't use safely." };
    return { url };
  } catch {
    return { error: "Upload failed. Please try again." };
  }
}

/**
 * Back to the theme's own look, keeping the theme.
 *
 * This used to delete the row. That took `themeKey` with it, so "reset the
 * colours" quietly un-picked the merchant's theme and dropped the shop back to
 * Aurora — while the dialog promised it would go back to *the theme's* original
 * styling. Harmless while a theme was only a palette and every theme rendered
 * the same page; not harmless now that a theme decides the header and the card.
 *
 * So the overrides are cleared and the choice is kept, and what comes back is
 * the theme's own defaults rather than the platform's.
 */
export async function resetThemeTokens(themeKey?: string) {
  await requireRole("STAFF");

  const shop = await requireShop();
  const key = themeKey ?? (await liveThemeKey(shop.id, shop.businessType));

  // Clears this theme's edits and nobody else's. A merchant resetting a draft
  // must not find the colours gone from the design their customers are seeing.
  await (await db()).installedTheme.updateMany({
    where: { themeKey: key },
    data: { tokens: {}, layout: {} },
  });

  invalidateShop(await currentShopId(), "theme");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");

  // The theme's starting point, not the platform's — which is what the screen
  // said it would be, and what a merchant who picked Atlas expects to see.
  return { ...themeTokens(key), ...themeLayout(key) };
}
