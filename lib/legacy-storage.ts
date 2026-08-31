/**
 * Carries local storage forward when a key is renamed.
 *
 * A localStorage key is a name nobody sees and everybody depends on. Renaming
 * one is free in the source and expensive in the browser: the old entry is
 * still sitting there, and nothing reads it any more. For the basket that means
 * a shopper's items vanish; for draft recovery it means unsaved work stops
 * being offered back while still occupying the disk.
 *
 * So a rename moves the data with it, once, on the next page load. After that
 * the old key is gone and this does nothing — which is the point: it is a
 * migration, not a permanent alias, and it can be deleted once no browser
 * plausibly still holds the old name.
 *
 * Both helpers are no-ops on the server and swallow storage errors. Private
 * browsing, a full quota or storage disabled altogether must not turn a
 * best-effort carry-over into a blank page.
 */

/** Moves one entry from `from` to `to`, leaving an existing `to` untouched. */
export function adoptLegacyKey(from: string, to: string): void {
  if (typeof window === "undefined") return;
  try {
    const legacy = window.localStorage.getItem(from);
    if (legacy === null) return;
    // Anything already written under the new name is newer than the old entry
    // and wins — this must never overwrite live data with a stale copy.
    if (window.localStorage.getItem(to) === null) {
      window.localStorage.setItem(to, legacy);
    }
    window.localStorage.removeItem(from);
  } catch {
    /* storage unavailable — the carry-over is best effort */
  }
}

/** Moves every entry whose key starts with `from` to the same suffix under `to`. */
export function adoptLegacyPrefix(from: string, to: string): void {
  if (typeof window === "undefined") return;
  try {
    // Collected before mutating: removing entries mid-loop reindexes
    // localStorage and skips keys.
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(from)) keys.push(key);
    }
    for (const key of keys) adoptLegacyKey(key, `${to}${key.slice(from.length)}`);
  } catch {
    /* storage unavailable — the carry-over is best effort */
  }
}
