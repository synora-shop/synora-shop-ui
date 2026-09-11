"use server";

import { revalidatePath } from "next/cache";
import { toEnabledMethods } from "@/lib/payment-methods";
import { cleanBlockedList } from "@/lib/geo-block";
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

  // The payment details are deliberately absent.
  //
  // They moved to Settings → Payments, and this form no longer renders them —
  // so `formData.get("bankAccountDetails")` is empty here, and writing it would
  // have set every merchant's account details to null the first time they saved
  // a shipping fee. The same trap the maintenance toggle and the store name
  // both had: a form that writes every field it knows about, after one of them
  // stopped being its to write.
  const fields = {
    whatsappNumber: String(formData.get("whatsappNumber") || ""),
    contactEmail: String(formData.get("contactEmail") || "") || null,
    shippingFee,
    freeShippingThreshold: freeShippingThresholdRaw ? Number(freeShippingThresholdRaw) : null,
  };

  await prisma.storeSettings.upsert({
    where: { shopId: await currentShopId() },
    update: fields,
    create: { shopId: await currentShopId(), ...fields },
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

  /**
   * Every field this form still owns — and `accentColor` is not one of them.
   *
   * The picker moved to the theme, and this is the same trap the payment
   * details and the maintenance toggle both sprang before it: a form that
   * writes every field it knows about, after one of them stopped being its to
   * write. Left in, `str("accentColor", DEFAULT)` would read an input that is
   * no longer rendered, get nothing, fall back to the default, and quietly
   * repaint the storefront of every merchant who had set a colour — the first
   * time they saved anything at all on this screen.
   *
   * Omit rather than deletion from the type: the column is still read by
   * withLegacyAccent in lib/data/theme.ts, which is what keeps those merchants
   * their colour.
   */
  const data: Omit<GlobalEdits, "accentColor"> = {
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
    headingStyle: enumValue("headingStyle", HEADING_STYLE_VALUES, GLOBAL_EDITS_DEFAULTS.headingStyle),
    footerCopyrightText: str("footerCopyrightText", GLOBAL_EDITS_DEFAULTS.footerCopyrightText),
    announcementText: str("announcementText", GLOBAL_EDITS_DEFAULTS.announcementText),
    announcementBgColor: str("announcementBgColor", GLOBAL_EDITS_DEFAULTS.announcementBgColor),
    whatsappOrderButton: bool("whatsappOrderButton"),
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

  // The store's name is Home's, and this screen no longer offers it. Writing it
  // anyway would undo a rename every time somebody saved a currency — the form
  // still carries the value it was rendered with, so "unchanged" here means
  // "whatever it was when this page loaded", which is not the same thing as
  // what it is now.
  const { storeName: _ownedByHome, ...defaults } = clean;

  const sid = await currentShopId();
  await (await db()).storeSettings.upsert({
    where: { shopId: sid },
    update: defaults,
    create: { shopId: sid, ...defaults },
  });

  invalidateShop(await currentShopId(), "settings");
  revalidatePath("/admin/store-defaults");
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return {};
}

/**
 * How this shop takes money: which methods, and what each one tells a customer.
 *
 * The list is cleaned rather than trusted — it reaches a checkout, and a value
 * this platform does not know would be an option nobody could complete. It is
 * also never allowed to be empty: a shop with no payment method cannot take an
 * order, and neither a hand-made request nor a form bug may produce one.
 */
export async function savePaymentMethods(input: {
  enabledPaymentMethods: string[];
  bankAccountDetails: string;
  jazzcashAccountDetails: string;
  easypaisaAccountDetails: string;
}): Promise<{ error?: string }> {
  await requireRole("ADMIN");

  const enabledPaymentMethods = toEnabledMethods(input.enabledPaymentMethods);
  const data = {
    enabledPaymentMethods,
    bankAccountDetails: input.bankAccountDetails.trim() || null,
    jazzcashAccountDetails: input.jazzcashAccountDetails.trim() || null,
    easypaisaAccountDetails: input.easypaisaAccountDetails.trim() || null,
  };

  const sid = await currentShopId();
  await (await db()).storeSettings.upsert({
    where: { shopId: sid },
    update: data,
    create: { shopId: sid, ...data },
  });

  invalidateShop(sid, "settings");
  revalidatePath("/admin/payments");
  // The checkout and the footer both read this, so the whole public tree goes.
  revalidatePath("/", "layout");
  return {};
}
