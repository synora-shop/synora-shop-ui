/**
 * Who can see the shop, and what they are allowed to do with it.
 *
 * Four settings that answer one question, which is why they are one screen and
 * one file. They used to be scattered: maintenance mode and the blocked
 * countries sat at the bottom of Global Edits between a badge colour and a
 * WhatsApp button, and the other two did not exist. A merchant taking their
 * shop offline for an afternoon should not have to find that in a list of
 * typography options.
 *
 * Client-safe: plain values and pure helpers, no Prisma, no next/headers.
 */

/**
 * Note what is *not* here: maintenanceMode.
 *
 * It was the first field on this screen, and it moved to Your App →
 * Maintenance with the words it puts on the page. Leaving a copy behind would
 * have been worse than a duplicate control — this form writes every field it
 * holds on save, so a merchant who turned the holding page on and later saved
 * a blocked country would have silently turned their store back on with it.
 */
export type Visibility = {
  /** ISO 3166-1 alpha-2 codes this shop will not serve. Empty serves everyone. */
  blockedCountries: string[];
  /** Whether robots.txt invites search engines in. */
  searchIndexing: boolean;
  /** Whether public forms carry the honeypot field. */
  spamProtection: boolean;
};

/** Mirrors the @default(...) on each column in StoreSettings. */
export const VISIBILITY_DEFAULTS: Visibility = {
  blockedCountries: [],
  searchIndexing: true,
  spamProtection: true,
};

/** Reads a settings row into the shape this screen works in. */
export function toVisibility(row: Record<string, unknown>): Visibility {
  return {
    blockedCountries: Array.isArray(row.blockedCountries)
      ? (row.blockedCountries as string[])
      : [],
    // Absent means on, not off. A shop whose row predates these columns must
    // stay findable and stay protected, which is what every existing shop is
    // doing today.
    searchIndexing: row.searchIndexing !== false,
    spamProtection: row.spamProtection !== false,
  };
}
