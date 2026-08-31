import { revalidateTag, unstable_cache } from "next/cache";
import { forShop } from "@/lib/tenant";
import { CACHE_TTL_SECONDS, shopTag, type CacheKind } from "@/lib/cache-tags";

// The one place a shop's presentation data is wrapped in Next's data cache.
//
// The constraint that shapes this: a cached function may not read `headers()`
// or `cookies()`. Every reader in lib/data resolves its shop from the request
// headers, so the shop has to be resolved *outside* the cache and handed in as
// the key — which is also exactly what makes the cache per-shop rather than
// global.
//
// `unstable_cache` rather than the `use cache` directive: the latter needs
// Cache Components enabled, which changes rendering behaviour across the whole
// app. This is a contained change to six reads, and can be migrated later.

/**
 * Caches one read of one shop's data, keyed and tagged by shop.
 *
 * The callback is given a client already locked to that shop, so it cannot
 * reach another's rows even though nothing about the request is in scope by
 * the time it runs.
 */
export function cachedForShop<T>(
  shopId: string,
  kind: CacheKind,
  read: (t: ReturnType<typeof forShop>) => Promise<T>
): Promise<T> {
  return unstable_cache(
    () => read(forShop(shopId)),
    // The shop is in the key as well as the tag: the key decides what is
    // stored, the tag decides what a save throws away.
    [kind, shopId],
    { tags: [shopTag(shopId, kind)], revalidate: CACHE_TTL_SECONDS }
  )();
}

/**
 * Throws away a shop's cached reads after a merchant changes them.
 *
 * `{ expire: 0 }` rather than the recommended `"max"` profile on purpose.
 * `"max"` is stale-while-revalidate: the next reader is served the old value
 * while the new one loads in the background. For a blog that is right. Here
 * the next reader is usually the merchant who just pressed Save, reloading the
 * page to check — and showing them the value they just replaced is precisely
 * the "I have to keep refreshing" bug this admin has been through before.
 * Expiring immediately costs one uncached read and is worth it.
 *
 * Takes several kinds because a single save often crosses them: assigning a
 * menu to a slot writes both the menu and the settings that point at it.
 */
export function invalidateShop(shopId: string, ...kinds: CacheKind[]): void {
  for (const kind of kinds) {
    revalidateTag(shopTag(shopId, kind), { expire: 0 });
  }
}
