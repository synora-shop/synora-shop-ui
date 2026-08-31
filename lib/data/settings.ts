import { cache } from "react";
import { currentShop } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";
import { GLOBAL_EDITS_DEFAULTS } from "@/lib/global-edits";
import { STORE_DEFAULTS } from "@/lib/store-defaults";

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
