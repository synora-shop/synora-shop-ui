/**
 * A page's address, and what may be typed into it.
 *
 * Shared by the server action that writes it and the form that suggests it, so
 * the address a merchant is shown while typing is the address they get. Two
 * copies of a slug rule is one rule and one bug.
 *
 * Client-safe: pure strings.
 */

/**
 * The addresses the storefront owns.
 *
 * A custom page lives at /p/<slug>, so it can never actually collide with one
 * of these — but a merchant who types "checkout" means the checkout, and a
 * page at /p/checkout that is not the checkout is a trap they set for
 * themselves.
 */
export const RESERVED_PAGE_SLUGS = new Set([
  "admin",
  "account",
  "cart",
  "checkout",
  "collections",
  "contact",
  "maintenance",
  "order-confirmation",
  "p",
  "product",
  "shop",
]);

/** The most a slug may be. Long enough for a sentence, short enough to read. */
export const MAX_SLUG_LENGTH = 80;

/** A title, as an address. The same rule everywhere it is applied. */
export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    // Accents become the letter underneath rather than disappearing: "Café"
    // should be "cafe", not "caf".
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

/** Where a page with this slug is read. Home is the site's own front door. */
export function pageAddress(slug: string, systemKey: string | null): string {
  if (systemKey === "home") return "/";
  return `/p/${slug}`;
}

/**
 * Why this address cannot be used, or null when it can.
 *
 * Said in the merchant's terms — an address is not "invalid", it is taken, or
 * it belongs to the shop itself.
 */
export function addressProblem(slug: string): string | null {
  if (slug === "") return "An address cannot be empty.";
  if (RESERVED_PAGE_SLUGS.has(slug)) return `Your store already uses “${slug}” for something else.`;
  return null;
}
