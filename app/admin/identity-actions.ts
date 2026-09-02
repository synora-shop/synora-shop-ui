"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, requireShop } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { prisma } from "@/lib/prisma";
import { resolveThemeTokens } from "@/lib/theme-tokens";
import { safeAssetUrl } from "@/lib/icon-validation";
import type { Prisma } from "@/lib/generated/prisma/client";

export type StoreIdentity = {
  storeName: string;
  logoUrl: string;
  address: string;
  city: string;
  phone: string;
  contactEmail: string;
};

/**
 * The four things a shop is: its name, its mark, where it is and how to reach
 * it.
 *
 * They are stored in three different places — the name and email on the shop's
 * settings, the logo in the theme's tokens, the address and phone on a Location
 * row — because each is read by something different. A merchant should not have
 * to know that, so this writes all three from one form.
 *
 * The location is upserted rather than assumed. A shop that has never opened
 * the Locations screen has no row at all, and "the address" is the first thing
 * a new merchant fills in.
 */
export async function saveStoreIdentity(values: StoreIdentity): Promise<{ ok: true }> {
  await requireRole("ADMIN");

  const shop = await requireShop();
  const shopId = await currentShopId();

  const storeName = values.storeName.trim().slice(0, 60);
  const address = values.address.trim().slice(0, 200);
  const city = values.city.trim().slice(0, 80);
  const phone = values.phone.trim().slice(0, 40);
  const contactEmail = values.contactEmail.trim().slice(0, 120);

  // The logo is a URL the upload endpoint gave us. Passed through the same
  // guard the theme editor uses rather than trusted, so a hand-edited value
  // cannot put an arbitrary scheme into every page's header.
  const logoUrl = safeAssetUrl(values.logoUrl) ?? "";

  await prisma.$transaction(async (tx) => {
    await tx.storeSettings.upsert({
      where: { shopId },
      update: { storeName, contactEmail: contactEmail || null },
      create: { shopId, storeName, contactEmail: contactEmail || null },
    });

    // The shop's own name follows the storefront's, so the store switcher and
    // the top bar do not disagree with the shop's own home page.
    if (storeName) await tx.shop.update({ where: { id: shopId }, data: { name: storeName } });

    const existingTheme = await tx.themeSettings.findUnique({
      where: { shopId_businessType: { shopId, businessType: shop.businessType } },
      select: { tokens: true },
    });
    const tokens = resolveThemeTokens({
      ...((existingTheme?.tokens as object) ?? {}),
      logoUrl,
    }) as unknown as Prisma.InputJsonValue;
    await tx.themeSettings.upsert({
      where: { shopId_businessType: { shopId, businessType: shop.businessType } },
      update: { tokens },
      create: { shopId, businessType: shop.businessType, tokens },
    });

    // One primary location, created on first save. A restaurant with several
    // manages the rest on the Locations screen; this is the one that answers
    // "where is this business".
    if (address || phone || city) {
      const primary = await tx.location.findFirst({
        where: { shopId, isPrimary: true },
        select: { id: true },
      });
      if (primary) {
        await tx.location.update({
          where: { id: primary.id },
          data: { address, city: city || null, phone: phone || null },
        });
      } else {
        await tx.location.create({
          data: {
            shopId,
            name: storeName || "Main location",
            address,
            city: city || null,
            phone: phone || null,
            isPrimary: true,
          },
        });
      }
    }
  });

  invalidateShop(shopId, "theme");
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}
