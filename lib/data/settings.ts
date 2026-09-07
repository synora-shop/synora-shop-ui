import { cache } from "react";
import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import { GLOBAL_EDITS_DEFAULTS } from "@/lib/global-edits";
import { VISIBILITY_DEFAULTS } from "@/lib/visibility";
import { HOLDING_PAGE_COLUMN_DEFAULTS } from "@/lib/holding-page";
import { STORE_DEFAULTS, resolveStoreDefaults } from "@/lib/store-defaults";

const DEFAULTS = {
  id: "settings",
  // No assignment yet: the storefront falls back to the shop's first menu.
  headerMenuId: null as string | null,
  footerMenuId: null as string | null,
  whatsappNumber: "923218408190",
  contactEmail: null as string | null,
  bankAccountDetails: null as string | null,
  jazzcashAccountDetails: null as string | null,
  easypaisaAccountDetails: null as string | null,
  shippingFee: 250,
  freeShippingThreshold: null as number | null,
  ...GLOBAL_EDITS_DEFAULTS,
  ...VISIBILITY_DEFAULTS,
  ...HOLDING_PAGE_COLUMN_DEFAULTS,
  ...STORE_DEFAULTS,
};

// cache() dedupes this within a single request — the layout and a page can
// both call it without doubling the DB round trip.
//
// A shop that has never opened Settings has no row, so the defaults stand in.
// They are never written: the first save creates the row.
export const getStoreSettings = cache(async () => {
  // Resolved here, outside the cache: a cached function may not read headers.
  const shop = await currentShop();
  if (!shop) return DEFAULTS;
  const settings = await cachedForShop(shop.id, "settings", (t) =>
    t.storeSettings.findFirst()
  );
  return settings ?? DEFAULTS;
});

/**
 * The currency this store trades in.
 *
 * Its own function because almost everything that needs it needs nothing else
 * from settings, and because `getStoreSettings` is request-cached — calling
 * this thirty times while rendering thirty product cards is thirty map lookups
 * and one query.
 */
export async function getCurrency(): Promise<string> {
  return resolveStoreDefaults(await getStoreSettings()).currency;
}
