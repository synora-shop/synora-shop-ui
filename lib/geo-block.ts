/**
 * Hiding a shop from chosen countries.
 *
 * A merchant who cannot ship to a place, or does not want to be seen there,
 * picks the countries and visitors from them get the closed-store page instead
 * of the shop.
 *
 * What this is not: security. The country comes from the visitor's IP address,
 * which a VPN changes in one click, and anyone determined to look will look. It
 * hides a shop from ordinary traffic; it does not defend it. The wording in the
 * admin says so, because a merchant who believes otherwise will rely on it for
 * something it cannot do.
 *
 * Free, and stays free: Vercel resolves the country at the edge into a header
 * before any of our code runs, so there is no lookup service, no API key and no
 * per-request cost. A visitor whose country cannot be determined is served
 * normally — refusing everyone unidentifiable would shut out anyone behind a
 * corporate proxy to block a handful.
 *
 * Client-safe: pure, no imports.
 */

/** Vercel resolves this at the edge. Empty in local development. */
export const GEO_COUNTRY_HEADER = "x-vercel-ip-country";

const COUNTRY_CODE = /^[A-Z]{2}$/;

/** An ISO 3166-1 alpha-2 code, or null if it is not one. */
export function normaliseCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return COUNTRY_CODE.test(code) ? code : null;
}

/**
 * Whether this visitor should be turned away.
 *
 * Unknown country means served. That is the safe direction here: the cost of
 * letting one blocked visitor through is that they see a shop they were not
 * meant to, while the cost of turning away every unidentifiable visitor is
 * losing real customers behind proxies to block a few.
 */
export function isBlocked(country: string | null | undefined, blocked: readonly string[]): boolean {
  if (blocked.length === 0) return false;
  const code = normaliseCountry(country);
  if (!code) return false;
  return blocked.includes(code);
}

/**
 * Cleans what the admin form submits.
 *
 * Uppercased, de-duplicated, anything that is not a country code dropped, and
 * ordered — so the same selection always stores the same array and a save with
 * no real change does not read as a change.
 */
export function cleanBlockedList(raw: readonly string[]): string[] {
  const codes = new Set<string>();
  for (const entry of raw) {
    const code = normaliseCountry(entry);
    if (code) codes.add(code);
  }
  return [...codes].sort();
}
