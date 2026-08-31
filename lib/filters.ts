/**
 * Filters that combine and come apart again.
 *
 * Every list in the admin used to allow exactly one value per filter: picking
 * Draft replaced Published rather than adding to it, and the only way to drop a
 * filter was to find the "All" button that happened to clear that one group.
 * With two groups on screen there was no way to see what was actually applied
 * without reading the address bar.
 *
 * So a filter is a *set* of values held in a repeated query parameter, and the
 * three operations below are all a caller needs: toggle one value, drop one
 * value, or clear everything. Each returns a plain href, which keeps the
 * filter UI as server-rendered links — no client state, so it cannot fall out
 * of step with the list the way the lists themselves once did.
 *
 * Client-safe: pure string handling, no Prisma, no next/headers.
 */

/** What a page received for one filter, normalised to a list. */
export type ActiveFilters = Record<string, string[]>;

/**
 * Reads one filter out of Next's searchParams.
 *
 * A repeated parameter arrives as an array and a single one as a string, so
 * both shapes have to be accepted for the same filter to work with one value
 * or with five.
 */
export function readFilter(
  searchParams: Record<string, string | string[] | undefined>,
  key: string
): string[] {
  const raw = searchParams[key];
  if (raw === undefined) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  // Deduplicated because a hand-edited URL can repeat a value, and a filter
  // applied twice should not render two chips that each claim to remove it.
  return [...new Set(list.filter((v) => typeof v === "string" && v.length > 0))];
}

/** Reads several filters at once. */
export function readFilters(
  searchParams: Record<string, string | string[] | undefined>,
  keys: readonly string[]
): ActiveFilters {
  return Object.fromEntries(keys.map((k) => [k, readFilter(searchParams, k)]));
}

/** Drops values a page no longer offers, so a stale URL cannot filter by them. */
export function keepKnown(values: string[], known: readonly string[]): string[] {
  return values.filter((v) => known.includes(v));
}

function href(basePath: string, filters: ActiveFilters): string {
  const qs = new URLSearchParams();
  // Sorted so the same set of filters always produces the same URL, which
  // keeps links stable and makes them cacheable.
  for (const key of Object.keys(filters).sort()) {
    for (const value of [...filters[key]].sort()) qs.append(key, value);
  }
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** The href that adds this value if absent, or removes it if already applied. */
export function toggleHref(
  basePath: string,
  filters: ActiveFilters,
  key: string,
  value: string
): string {
  const current = filters[key] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return href(basePath, { ...filters, [key]: next });
}

/** The href that removes exactly this one value, leaving every other filter. */
export function removeHref(
  basePath: string,
  filters: ActiveFilters,
  key: string,
  value: string
): string {
  return href(basePath, { ...filters, [key]: (filters[key] ?? []).filter((v) => v !== value) });
}

/** The href that removes every value in one group. */
export function clearGroupHref(basePath: string, filters: ActiveFilters, key: string): string {
  return href(basePath, { ...filters, [key]: [] });
}

/** The href with nothing applied. */
export function clearAllHref(basePath: string): string {
  return basePath;
}

/** How many values are applied across every group. */
export function activeCount(filters: ActiveFilters): number {
  return Object.values(filters).reduce((n, values) => n + values.length, 0);
}

/**
 * A Prisma filter for a set of values.
 *
 * Nothing selected means no constraint, not "match none" — an empty filter
 * bar has to show everything.
 */
export function whereIn<T extends string>(values: T[]): { in: T[] } | undefined {
  return values.length > 0 ? { in: values } : undefined;
}
