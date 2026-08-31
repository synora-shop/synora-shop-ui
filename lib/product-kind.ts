// How a product is sold, and everything that follows from that.
//
// One rule drives the whole feature: a product that isn't NORMAL cannot be
// bought from the site. Its price is agreed, not published, so the buyer sends
// an enquiry instead. Every surface — the card, the product page, the cart, the
// order API — asks `isPurchasable()` rather than re-deriving that from a
// scattering of fields, so there is no path where a bulk item quietly lands in
// somebody's basket at a price nobody agreed to.
//
// Client-safe: pure data and arithmetic, no Prisma, no next/headers.

export const PRODUCT_KINDS = ["NORMAL", "BULK", "CUSTOM"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const BULK_PRICING_MODES = ["HIDDEN", "RANGE", "TIERED"] as const;
export type BulkPricing = (typeof BULK_PRICING_MODES)[number];

export const PRODUCT_KIND_META: Record<
  ProductKind,
  { label: string; badge: string; blurb: string; purchasable: boolean }
> = {
  NORMAL: {
    label: "Standard",
    badge: "",
    blurb: "Priced, stocked and added straight to the cart. The ordinary case.",
    purchasable: true,
  },
  BULK: {
    label: "Bulk order",
    badge: "Bulk",
    blurb:
      "Sold by arrangement in larger quantities. Customers send an enquiry rather than checking out, because the price depends on how many they want.",
    purchasable: false,
  },
  CUSTOM: {
    label: "Made to order",
    badge: "Made to order",
    blurb:
      "Made to the customer's measurements or specification. Customers send an enquiry with their details, and you quote per commission.",
    purchasable: false,
  },
};

/** Whether this product can be added to a cart and checked out. */
export function isPurchasable(kind: string | null | undefined): boolean {
  return (PRODUCT_KIND_META[(kind ?? "NORMAL") as ProductKind] ?? PRODUCT_KIND_META.NORMAL)
    .purchasable;
}

/** Whether this product is sold through an enquiry rather than the cart. */
export function isEnquiryOnly(kind: string | null | undefined): boolean {
  return !isPurchasable(kind);
}

// ---------------------------------------------------------------------------
// Bulk pricing tiers
// ---------------------------------------------------------------------------

export type BulkTier = {
  /** Smallest quantity this price applies to. */
  minQty: number;
  /** Price per unit at that quantity, in PKR. */
  unitPrice: number;
};

/**
 * Reads stored tiers into a usable, ordered list.
 *
 * Tiers arrive as untyped JSON, so anything malformed is dropped rather than
 * trusted: a tier with no quantity or a negative price would otherwise render
 * as a nonsense row on the product page.
 */
export function parseTiers(raw: unknown): BulkTier[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => {
      const tier = t as Partial<BulkTier>;
      const minQty = Number(tier?.minQty);
      const unitPrice = Number(tier?.unitPrice);
      if (!Number.isFinite(minQty) || !Number.isFinite(unitPrice)) return null;
      if (minQty < 1 || unitPrice < 0) return null;
      return { minQty: Math.round(minQty), unitPrice: Math.round(unitPrice) };
    })
    .filter((t): t is BulkTier => t !== null)
    .sort((a, b) => a.minQty - b.minQty);
}

/** The tier that applies at a given quantity, or null below the first break. */
export function tierFor(tiers: BulkTier[], quantity: number): BulkTier | null {
  let match: BulkTier | null = null;
  for (const tier of tiers) {
    if (quantity >= tier.minQty) match = tier;
    else break;
  }
  return match;
}

/**
 * Problems that would make a tier table confusing to a buyer.
 *
 * Returned as messages rather than thrown, because these are shown next to the
 * inputs while the seller is still typing — the point is to explain, not to
 * stop. Duplicate quantities are the one that actually misleads: two rows
 * claiming different prices for the same quantity have no correct reading.
 */
export function tierProblems(tiers: BulkTier[], minOrderQuantity?: number | null): string[] {
  const problems: string[] = [];
  const seen = new Set<number>();

  for (const tier of tiers) {
    if (seen.has(tier.minQty)) {
      problems.push(`Two tiers both start at ${tier.minQty} units, only one price can apply.`);
    }
    seen.add(tier.minQty);
  }

  if (minOrderQuantity && tiers.length > 0 && tiers[0].minQty < minOrderQuantity) {
    problems.push(
      `The first tier starts at ${tiers[0].minQty} units, below your ${minOrderQuantity}-unit minimum. Customers can't order that few.`
    );
  }

  // Prices should fall as quantity rises. The opposite is legal but almost
  // always a typo, and a buyer reading it will assume it is one.
  for (let i = 1; i < tiers.length; i++) {
    if (tiers[i].unitPrice > tiers[i - 1].unitPrice) {
      problems.push(
        `The price goes up at ${tiers[i].minQty} units. Bulk prices normally fall as quantity rises, check this is what you meant.`
      );
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// Custom fields
// ---------------------------------------------------------------------------

export const CUSTOM_FIELD_KINDS = ["text", "number", "textarea", "select"] as const;
export type CustomFieldKind = (typeof CUSTOM_FIELD_KINDS)[number];

export type CustomField = {
  id: string;
  label: string;
  help: string;
  required: boolean;
  kind: CustomFieldKind;
  /** For kind "select": the choices offered. */
  options?: string[];
};

/** A starting set for a made-to-order clothing item, offered on first use. */
export const CUSTOM_FIELD_PRESETS: CustomField[] = [
  { id: "bust", label: "Bust", help: "In inches, measured at the fullest point.", required: true, kind: "number" },
  { id: "waist", label: "Waist", help: "In inches, at the natural waistline.", required: true, kind: "number" },
  { id: "hips", label: "Hips", help: "In inches, at the fullest point.", required: true, kind: "number" },
  { id: "length", label: "Shirt length", help: "In inches, from shoulder to hem.", required: false, kind: "number" },
  { id: "fabric", label: "Fabric preference", help: "Leave blank if you'd like us to suggest one.", required: false, kind: "text" },
  { id: "occasion", label: "Occasion", help: "Helps us advise on fabric and finish.", required: false, kind: "text" },
];

export function parseCustomFields(raw: unknown): CustomField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f): CustomField | null => {
      const field = f as Partial<CustomField>;
      if (typeof field?.id !== "string" || !field.id.trim()) return null;
      if (typeof field?.label !== "string" || !field.label.trim()) return null;
      const kind = (CUSTOM_FIELD_KINDS as readonly string[]).includes(field.kind as string)
        ? (field.kind as CustomFieldKind)
        : "text";
      return {
        id: field.id.trim(),
        label: field.label.trim(),
        help: typeof field.help === "string" ? field.help : "",
        required: Boolean(field.required),
        kind,
        options: Array.isArray(field.options)
          ? field.options.filter((o): o is string => typeof o === "string")
          : undefined,
      };
    })
    .filter((f): f is CustomField => f !== null);
}

// ---------------------------------------------------------------------------
// What the storefront shows where a price would go
// ---------------------------------------------------------------------------

export type PriceDisplay =
  | { mode: "price" }
  | { mode: "onRequest"; label: string }
  | { mode: "range"; min: number; max: number }
  | { mode: "from"; unitPrice: number; minQty: number };

/**
 * How to present this product's price.
 *
 * Returned as a description rather than a formatted string so the caller owns
 * currency formatting — the same decision is rendered differently on a card, a
 * product page and a search result.
 */
export function priceDisplay(product: {
  kind?: string | null;
  bulkPricing?: string | null;
  bulkPriceMin?: number | null;
  bulkPriceMax?: number | null;
  bulkTiers?: unknown;
}): PriceDisplay {
  if (isPurchasable(product.kind)) return { mode: "price" };

  if (product.kind === "BULK") {
    if (product.bulkPricing === "RANGE" && product.bulkPriceMin && product.bulkPriceMax) {
      return { mode: "range", min: product.bulkPriceMin, max: product.bulkPriceMax };
    }
    if (product.bulkPricing === "TIERED") {
      const tiers = parseTiers(product.bulkTiers);
      // The cheapest unit price is the honest "from": it is what a buyer gets
      // at the largest break, which is the number they are shopping for.
      if (tiers.length > 0) {
        const best = tiers.reduce((a, b) => (b.unitPrice < a.unitPrice ? b : a));
        return { mode: "from", unitPrice: best.unitPrice, minQty: best.minQty };
      }
    }
    return { mode: "onRequest", label: "Price on request" };
  }

  return { mode: "onRequest", label: "Priced per order" };
}
