// "Global Edits" — site-wide behavior settings, admin-editable from
// Settings > Global Edits (see components/admin/global-edits-form.tsx),
// stored as extra columns on the StoreSettings singleton row (see
// prisma/schema.prisma and lib/data/settings.ts).
//
// Every value here is read live wherever it applies — never copied onto a
// Product/Page/Category — so a new product or page created after an edit
// automatically picks up the current value with zero follow-up code, and
// turning an edit back off always restores the site's original behavior.
//
// This file has no Prisma import on purpose: it's imported from both
// Server Components (which fetch the settings row) and Client Components
// (which only need the pure formatting/decision helpers below).

export type OutOfStockDisplay = "HIDE" | "SOLD_OUT" | "NORMAL";
export type ShopSort = "newest" | "price-asc" | "price-desc" | "featured";
export type HeadingStyle = "normal" | "uppercase" | "titlecase";

export type GlobalEdits = {
  showInventoryCount: boolean;
  lowStockThreshold: number;
  lowStockBadgeText: string;
  outOfStockDisplay: OutOfStockDisplay;
  newArrivalBadge: boolean;
  newArrivalWindowDays: number;
  newArrivalBadgeText: string;
  saleBadge: boolean;
  defaultShopSort: ShopSort;
  shopGridColumns: number;
  accentColor: string;
  headingStyle: HeadingStyle;
  footerCopyrightText: string;
  announcementText: string;
  announcementBgColor: string;
  whatsappOrderButton: boolean;
  maintenanceMode: boolean;
  shopFilterBar: boolean;
};

// Mirrors every @default(...) in the StoreSettings model — kept here too so
// Client Components (and the admin form before the first save) have a
// single source of truth without importing Prisma.
export const GLOBAL_EDITS_DEFAULTS: GlobalEdits = {
  showInventoryCount: true,
  lowStockThreshold: 5,
  lowStockBadgeText: "Only {n} left!",
  outOfStockDisplay: "SOLD_OUT",
  newArrivalBadge: true,
  newArrivalWindowDays: 14,
  newArrivalBadgeText: "New",
  saleBadge: true,
  defaultShopSort: "newest",
  shopGridColumns: 4,
  accentColor: "#4c100f",
  headingStyle: "normal",
  footerCopyrightText: "© {year} Your Store. All rights reserved.",
  announcementText: "",
  announcementBgColor: "#4c100f",
  whatsappOrderButton: true,
  maintenanceMode: false,
  shopFilterBar: true,
};

export function lowStockLabel(edits: Pick<GlobalEdits, "lowStockBadgeText">, stock: number) {
  return edits.lowStockBadgeText.replace("{n}", String(stock));
}

export function footerCopyright(edits: Pick<GlobalEdits, "footerCopyrightText">, year = new Date().getFullYear()) {
  return edits.footerCopyrightText.replace("{year}", String(year));
}

/** Stock-count line for a product's purchase panel — respects showInventoryCount
 * (hide the number, but still say whether it's in stock) and lowStockThreshold. */
export function stockDisplay(
  edits: Pick<GlobalEdits, "showInventoryCount" | "lowStockThreshold" | "lowStockBadgeText">,
  stock: number
): { label: string; urgent: boolean } | null {
  if (stock <= 0) return null; // "out of stock" is handled separately — always shown, never a count
  if (!edits.showInventoryCount) return { label: "In stock", urgent: false };
  if (stock <= edits.lowStockThreshold) return { label: lowStockLabel(edits, stock), urgent: true };
  return { label: `In stock (${stock} left)`, urgent: false };
}

export function totalStock(variants: { stock: number }[]) {
  return variants.reduce((sum, v) => sum + v.stock, 0);
}

/** True when a product should carry the "New" badge, purely from its age — this is why
 * a product created after the edit is switched on/off just works with no backfill. */
export function isNewArrival(createdAt: Date | string, windowDays: number) {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const ageMs = Date.now() - created.getTime();
  return ageMs <= windowDays * 24 * 60 * 60 * 1000;
}

/** Narrows the plain-`string` enum-like columns Prisma returns into the actual union
 * types, falling back to the default for anything unexpected (e.g. hand-edited DB
 * data) instead of trusting the raw string. */
export function toGlobalEdits(row: Record<string, unknown>): GlobalEdits {
  function pick<T extends string>(key: keyof GlobalEdits, allowed: readonly T[], fallback: T): T {
    const v = row[key];
    return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
  }
  return {
    ...GLOBAL_EDITS_DEFAULTS,
    ...row,
    outOfStockDisplay: pick("outOfStockDisplay", ["HIDE", "SOLD_OUT", "NORMAL"] as const, GLOBAL_EDITS_DEFAULTS.outOfStockDisplay),
    defaultShopSort: pick(
      "defaultShopSort",
      ["newest", "price-asc", "price-desc", "featured"] as const,
      GLOBAL_EDITS_DEFAULTS.defaultShopSort
    ),
    headingStyle: pick("headingStyle", ["normal", "uppercase", "titlecase"] as const, GLOBAL_EDITS_DEFAULTS.headingStyle),
  };
}

// Literal class strings (not interpolated) so Tailwind's scanner can find them.
export const SHOP_GRID_LG_COLS_CLASS: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

export const SHOP_SORT_LABELS: Record<ShopSort, string> = {
  newest: "Newest",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  featured: "Featured First",
};
