/**
 * Newest first, as ranks: 0 is the newest of the list. What "Newest" sorts
 * a kit's product list by.
 *
 * Takes a Date or a string: rows read through the shop's cache
 * (storefrontCatalog) arrive with their dates as JSON strings, and calling
 * `.getTime()` on one took the Loom demo's home page down on 8 October.
 */
export function newestRanks<T extends { createdAt: Date | string }>(rows: T[]): Map<T, number> {
  const time = (d: Date | string) => new Date(d).getTime();
  const byAge = [...rows].sort((a, b) => time(b.createdAt) - time(a.createdAt));
  return new Map(byAge.map((r, i) => [r, i]));
}
