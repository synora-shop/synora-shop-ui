// The vocabulary shared by everything that caches a shop's presentation data.
//
// Every storefront page reads the same handful of rows — settings, menus,
// microcopy, theme tokens, fonts, sticky buttons — and none of them change
// between one visitor and the next. Read uncached, that is eight database
// round trips per page view, on a plan measured in compute-hours.
//
// So they are cached per shop and invalidated by tag when a merchant saves.
// The tag is the contract between the two halves, and the danger is that they
// drift: a writer that forgets its tag leaves merchants editing a page that
// will not change, which is the single worst bug this admin has had. Naming
// the tags in one place, and asserting the pairing in scripts/check-cache.ts,
// is what stops that being a matter of memory.
//
// Client-safe: pure strings, no Prisma, no next/headers.

/** The kinds of shop data that are cached, one tag each. */
export const CACHE_KINDS = [
  "settings",
  "menus",
  "site-text",
  "theme",
  "fonts",
  "buttons",
] as const;

export type CacheKind = (typeof CACHE_KINDS)[number];

/**
 * The tag for one kind of one shop's data.
 *
 * Scoped by shop deliberately: a global tag would mean one merchant saving a
 * menu discarded every other merchant's cached pages, which at a few hundred
 * stores is most of the benefit gone.
 */
export function shopTag(shopId: string, kind: CacheKind): string {
  return `shop:${shopId}:${kind}`;
}

/**
 * How long a cached read survives without being invalidated.
 *
 * A safety net, not the mechanism — a save invalidates immediately by tag, and
 * this only decides how long a *missed* invalidation could go unnoticed. Five
 * minutes is short enough that a mistake is survivable and long enough that a
 * quiet storefront costs almost nothing.
 */
export const CACHE_TTL_SECONDS = 300;
