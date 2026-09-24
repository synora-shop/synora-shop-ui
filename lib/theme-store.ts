import { cache } from "react";
import { headers } from "next/headers";
import { DEMO_SHOP_HEADER } from "@/lib/shop-context";
import {
  THEME_STORE_ROOT,
  demoSlugForSubdomain,
  themeKeyForDemoSubdomain,
} from "@/lib/themes/demo";

/**
 * The theme store, on the reading side.
 *
 * `proxy.ts` works out from the path that this request is `/theme-store/kite`,
 * rewrites it to the storefront route it really is, and sends two facts down as
 * headers. This reads them back. See lib/themes/demo.ts for the path handling
 * and docs/THEMES.md §5b for what any of it is for.
 *
 * Server-only: it reads request headers. `cache()` makes it once per request
 * however many components ask.
 */

export type ThemeStoreContext = {
  /** The demo shop serving this request: `kite-demo`. */
  subdomain: string;
  /** The theme it wears. */
  themeKey: string;
  /** The URL slug: `kite`. */
  slug: string;
  /** What every link rendered in this request must be prefixed with. */
  base: string;
};

/** The theme store this request belongs to, or null — which is every other request. */
export const themeStoreContext = cache(async (): Promise<ThemeStoreContext | null> => {
  const h = await headers();
  const subdomain = h.get(DEMO_SHOP_HEADER);
  if (!subdomain) return null;

  // Re-derived rather than trusted. The header is set by our own proxy, but it
  // is still a header, and a request arriving with one already on it must not
  // be able to name a shop of its own choosing — the only subdomains this can
  // ever resolve are the ones the slug table already knows about.
  const themeKey = themeKeyForDemoSubdomain(subdomain);
  const slug = demoSlugForSubdomain(subdomain);
  if (!themeKey || !slug) return null;

  return {
    subdomain,
    themeKey,
    slug,
    // Derived from the slug, never taken from the header. The prefix is stamped
    // onto every link on the page, so a caller that could choose it could point
    // a demo's whole navigation somewhere else.
    base: `${THEME_STORE_ROOT}/${slug}`,
  };
});

/**
 * The prefix every storefront link carries, which is "" almost always.
 *
 * The empty string is the whole safety argument for the link prefixing: on a
 * merchant's own shop nothing is prefixed, so the storefront renders exactly
 * the HTML it rendered before the theme store existed.
 */
export async function storeBase(): Promise<string> {
  return (await themeStoreContext())?.base ?? "";
}

/**
 * Whether a shop is one of ours, standing in a theme's shop window.
 *
 * Asked of the *shop*, not of the route, and deliberately: the rules that hang
 * off it — no checkout, no recorded visits, one canonical address — must hold
 * however the shop was reached, including on its own raw subdomain.
 */
export function isDemoShop(subdomain: string | null | undefined): boolean {
  return !!subdomain && themeKeyForDemoSubdomain(subdomain) !== null;
}
