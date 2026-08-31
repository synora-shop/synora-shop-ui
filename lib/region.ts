/**
 * Which region a visitor is in, and how much that is allowed to change.
 *
 * WHERE THE COUNTRY COMES FROM
 * ----------------------------
 * Exactly one place: the `x-vercel-ip-country` header. Vercel resolves it at
 * the edge from the connecting socket and *overwrites* whatever arrived with
 * the request, so a client cannot inject it.
 *
 * Deliberately NOT from `x-forwarded-for`. That header is a list each hop
 * appends to, and the left-most entry — the one that would name the client — is
 * whatever the client sent. Anyone can put any address there. lib/rate-limit.ts
 * reads it because a rate limit that degrades under spoofing is still better
 * than none; a region must not be decided by something the visitor writes.
 *
 * No IP address is read, stored or logged here. A two-letter country code is
 * the whole of what this feature learns about anyone.
 *
 * WHAT A REGION MAY CHANGE
 * ------------------------
 * Presentation, and nothing else: which menus show, and the announcement bar.
 * Not prices, not tax, not stock, not shipping, not whether an order may be
 * placed, and nothing about signing in.
 *
 * That boundary is what makes the override below safe. A visitor can ask for
 * another region with a query parameter — useful as a region switcher, and the
 * only practical way for a merchant to preview one — and because the answer
 * only decides which links and banner render, choosing a different one gains
 * nothing. Hang a price on this and that stops being true, which is why
 * scripts/check-regions.ts fails the build if the checkout or the auth layer
 * ever imports it.
 *
 * Client-safe: pure string handling, no Prisma, no next/headers.
 */

/** The header Vercel sets from the connecting address. */
export const GEO_COUNTRY_HEADER = "x-vercel-ip-country";

/** Query parameter that asks for a specific region, by handle. */
export const REGION_PARAM = "__region";

/** ISO 3166-1 alpha-2: two letters, nothing else. */
const COUNTRY_CODE = /^[A-Z]{2}$/;

/**
 * A country code, or null if the header is missing or malformed.
 *
 * Validated rather than trusted even though the edge sets it: this value goes
 * on to be compared against stored data, and "reject anything that is not two
 * letters" costs one regex and removes a whole class of question.
 */
export function normaliseCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return COUNTRY_CODE.test(code) ? code : null;
}

/** The shape resolution needs. The real rows carry more. */
export type RegionLike = {
  id: string;
  handle: string;
  countries: string[];
  isDefault: boolean;
  isActive: boolean;
};

/**
 * The region to render for a visitor.
 *
 * In order: the one they explicitly asked for, then the one covering their
 * country, then the shop's default. Inactive regions are skipped entirely —
 * that is what the switch is for, so a merchant can build one before it goes
 * live — except when asked for by handle, which is how they preview it.
 *
 * Undefined means "no region applies", and the storefront then renders the
 * shop's own settings. A shop that has defined no regions is the normal case,
 * not an error.
 */
export function resolveRegion<T extends RegionLike>(
  regions: T[],
  country: string | null,
  requestedHandle?: string | null
): T | undefined {
  if (requestedHandle) {
    const asked = regions.find((r) => r.handle === requestedHandle);
    if (asked) return asked;
  }

  const live = regions.filter((r) => r.isActive);

  if (country) {
    const covering = live.find((r) => r.countries.includes(country));
    if (covering) return covering;
  }

  return live.find((r) => r.isDefault);
}

/**
 * Country codes claimed by more than one region.
 *
 * Two regions covering the same country is not illegal — resolution simply
 * takes the first — but it means one of them will never be chosen for that
 * country, which is almost always a mistake worth pointing at rather than
 * silently honouring.
 */
export function overlappingCountries(regions: RegionLike[]): string[] {
  const seen = new Set<string>();
  const clashes = new Set<string>();
  for (const region of regions) {
    for (const country of region.countries) {
      if (seen.has(country)) clashes.add(country);
      seen.add(country);
    }
  }
  return [...clashes].sort();
}

/** Parses a pasted or typed list of country codes into clean, unique codes. */
export function parseCountryList(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((part) => part.trim().toUpperCase())
        .filter((code) => COUNTRY_CODE.test(code))
    ),
  ].sort();
}
