"use server";

import { revalidatePath } from "next/cache";
import { db, currentShopId } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveStoreDefaults, type StoreDefaults } from "@/lib/store-defaults";
import { GLOBAL_EDITS_DEFAULTS, type GlobalEdits } from "@/lib/global-edits";

export async function updateSettings(formData: FormData) {
  await requireRole("STAFF");

  const shippingFee = Number(formData.get("shippingFee") || 0);
  const freeShippingThresholdRaw = String(formData.get("freeShippingThreshold") || "");

  await prisma.storeSettings.upsert({
    where: { shopId: await currentShopId() },
    update: {
      whatsappNumber: String(formData.get("whatsappNumber") || ""),
      contactEmail: String(formData.get("contactEmail") || "") || null,
      bankAccountDetails: String(formData.get("bankAccountDetails") || "") || null,
      jazzcashAccountDetails: String(formData.get("jazzcashAccountDetails") || "") || null,
      easypaisaAccountDetails: String(formData.get("easypaisaAccountDetails") || "") || null,
      shippingFee,
      freeShippingThreshold: freeShippingThresholdRaw ? Number(freeShippingThresholdRaw) : null,
    },
    create: {
      shopId: await currentShopId(),
      whatsappNumber: String(formData.get("whatsappNumber") || ""),
      contactEmail: String(formData.get("contactEmail") || "") || null,
      bankAccountDetails: String(formData.get("bankAccountDetails") || "") || null,
      jazzcashAccountDetails: String(formData.get("jazzcashAccountDetails") || "") || null,
      easypaisaAccountDetails: String(formData.get("easypaisaAccountDetails") || "") || null,
      shippingFee,
      freeShippingThreshold: freeShippingThresholdRaw ? Number(freeShippingThresholdRaw) : null,
    },
  });

  invalidateShop(await currentShopId(), "settings");
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  revalidatePath("/");
}

const OUT_OF_STOCK_VALUES = new Set(["HIDE", "SOLD_OUT", "NORMAL"]);
const SHOP_SORT_VALUES = new Set(["newest", "price-asc", "price-desc", "featured"]);
const HEADING_STYLE_VALUES = new Set(["normal", "uppercase", "titlecase"]);

export async function updateGlobalEdits(formData: FormData) {
  await requireRole("STAFF");

  function bool(key: string) {
    return formData.get(key) === "on";
  }
  function int(key: string, fallback: number) {
    const raw = formData.get(key);
    const n = raw != null ? Number(raw) : NaN;
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }
  function str(key: string, fallback: string) {
    const raw = formData.get(key);
    return raw != null ? String(raw) : fallback;
  }
  function enumValue<T extends string>(key: string, allowed: Set<string>, fallback: T): T {
    const raw = String(formData.get(key) ?? "");
    return (allowed.has(raw) ? raw : fallback) as T;
  }

  const data: GlobalEdits = {
    showInventoryCount: bool("showInventoryCount"),
    lowStockThreshold: Math.max(0, int("lowStockThreshold", GLOBAL_EDITS_DEFAULTS.lowStockThreshold)),
    lowStockBadgeText: str("lowStockBadgeText", GLOBAL_EDITS_DEFAULTS.lowStockBadgeText),
    outOfStockDisplay: enumValue("outOfStockDisplay", OUT_OF_STOCK_VALUES, GLOBAL_EDITS_DEFAULTS.outOfStockDisplay),
    newArrivalBadge: bool("newArrivalBadge"),
    newArrivalWindowDays: Math.max(0, int("newArrivalWindowDays", GLOBAL_EDITS_DEFAULTS.newArrivalWindowDays)),
    newArrivalBadgeText: str("newArrivalBadgeText", GLOBAL_EDITS_DEFAULTS.newArrivalBadgeText),
    saleBadge: bool("saleBadge"),
    defaultShopSort: enumValue("defaultShopSort", SHOP_SORT_VALUES, GLOBAL_EDITS_DEFAULTS.defaultShopSort),
    shopGridColumns: [3, 4, 5].includes(int("shopGridColumns", 4)) ? int("shopGridColumns", 4) : 4,
    accentColor: str("accentColor", GLOBAL_EDITS_DEFAULTS.accentColor),
    headingStyle: enumValue("headingStyle", HEADING_STYLE_VALUES, GLOBAL_EDITS_DEFAULTS.headingStyle),
    footerCopyrightText: str("footerCopyrightText", GLOBAL_EDITS_DEFAULTS.footerCopyrightText),
    announcementText: str("announcementText", GLOBAL_EDITS_DEFAULTS.announcementText),
    announcementBgColor: str("announcementBgColor", GLOBAL_EDITS_DEFAULTS.announcementBgColor),
    whatsappOrderButton: bool("whatsappOrderButton"),
    maintenanceMode: bool("maintenanceMode"),
    shopFilterBar: bool("shopFilterBar"),
  };

  await prisma.storeSettings.upsert({
    where: { shopId: await currentShopId() },
    update: data,
    create: { shopId: await currentShopId(), ...data },
  });

  invalidateShop(await currentShopId(), "settings");
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

/**
 * Saves the store defaults.
 *
 * Everything is re-resolved through resolveStoreDefaults rather than trusted
 * from the form: these values reach price formatting and the timestamps orders
 * are recorded against, where an unrecognised entry does more damage than a
 * wrong one — a bad time zone silently moves which day a sale belongs to.
 */
export async function saveStoreDefaults(input: StoreDefaults): Promise<{ error?: string }> {
  await requireRole("STAFF");

  const clean = resolveStoreDefaults(input);

  const sid = await currentShopId();
  await (await db()).storeSettings.upsert({
    where: { shopId: sid },
    update: clean,
    create: { shopId: sid, ...clean },
  });

  invalidateShop(await currentShopId(), "settings");
  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return {};
}
