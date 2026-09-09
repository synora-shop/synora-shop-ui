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
export async function saveThemeTokens(tokens: Partial<ThemeTokens & ThemeLayout>) {
  await requireRole("STAFF");

  // Re-resolved against the defaults so an unknown or missing key can never
  // land a malformed token blob in the database.
  const clean = resolveThemeTokens(tokens) as unknown as Prisma.InputJsonValue;

  /**
   * The panel carries one object; the database keeps two columns.
   *
   * The Theme panel edits colour, type and arrangement in one list, because
   * that is one decision to a merchant. Underneath they are different things —
   * a token is a CSS value, a layout choice picks a component — so each is
   * resolved by its own validator and stored in its own column, and a key
   * belonging to neither is dropped by both.
   *
   * Only the merchant's *differences* are stored. Writing the whole resolved
   * layout would freeze today's theme defaults into the row, so switching
   * theme later would change the colours and silently keep the old header.
   */
  const layout = layoutChanges(resolveThemeLayout(tokens)) as unknown as Prisma.InputJsonValue;

  // Keyed on the pair, because these settings belong to one business type
  // rather than to the shop. The scoped client supplies the type on create.
  const shop = await requireShop();
  await (await db()).themeSettings.upsert({
    where: { shopId_businessType: { shopId: shop.id, businessType: shop.businessType } },
    update: { tokens: clean, layout },
    create: { shopId: shop.id, businessType: shop.businessType, tokens: clean, layout },
  });

  invalidateShop(await currentShopId(), "theme");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");
  // Both halves back, so the panel's state after a save is exactly what the
  // storefront will render — including any value the validators corrected.
  return { ...resolveThemeTokens(tokens), ...resolveThemeLayout(tokens) };
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
export async function resetThemeTokens() {
  await requireRole("STAFF");

  const shop = await requireShop();
  const row = await (await db()).themeSettings.findFirst({
    where: { businessType: shop.businessType },
    select: { themeKey: true },
  });

  await (await db()).themeSettings.updateMany({
    where: { businessType: shop.businessType },
    data: { tokens: {}, layout: {} },
  });

  invalidateShop(await currentShopId(), "theme");
  revalidatePath("/admin/theme");
  revalidatePath("/", "layout");

  // The theme's starting point, not the platform's — which is what the screen
  // said it would be, and what a merchant who picked Atlas expects to see.
  return { ...themeTokens(row?.themeKey), ...themeLayout(row?.themeKey) };
}
