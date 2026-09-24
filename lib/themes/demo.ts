// The theme store: a theme's own demo storefront, on our servers.
//
//   app.synoradigitals.com/theme-store/kite
//
// A full, browsable storefront wearing Kite, filled with demo goods that belong
// to us rather than to any merchant — the same page for everyone on the
// internet. That is the point: a theme should be judged on its design, and a
// theme judged through somebody else's half-filled catalogue is not being
// judged at all. See docs/THEMES.md §5b.
//
// Pure string handling: no Prisma, no next/headers, no registry import. It has
// to stay that way because `proxy.ts` uses it, and that file runs on every
// request for every page — pulling the theme registry in would drag the token
// validators, the colour maths and the font rules onto the edge with it.
//
// The slug table below is therefore written out rather than derived from
// THEME_NAMES, and that turns out to be the right shape anyway: **a slug is a
// published, indexed URL.** Deriving it from the theme's display name would
// mean the next rename silently moved an address search engines had already
// crawled. `check:theme-store` holds the table to the registry, so a theme
// added without a slug fails the build rather than 404ing quietly.

/** The path every theme demo hangs off. */
export const THEME_STORE_ROOT = "/theme-store";

/**
 * URL slug to theme key.
 *
 * The key is what a storefront stores and never changes; the slug is what the
 * world links to and must never change either. They are separate for the same
 * reason `ThemeDefinition.key` is separate from `name`.
 */
export const THEME_STORE_SLUGS: Readonly<Record<string, string>> = {
  kite: "atlas",
  loom: "aurora",
};

/** Theme key to URL slug — the reverse of the table above. */
const KEY_TO_SLUG: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(THEME_STORE_SLUGS).map(([slug, key]) => [key, slug])
);

/** Every slug the store serves, in a stable order. */
export const DEMO_SLUGS: readonly string[] = Object.keys(THEME_STORE_SLUGS);

/** The demo shop behind a slug. `kite` is served by the shop `kite-demo`. */
export function demoSubdomain(slug: string): string {
  return `${slug}-demo`;
}

/**
 * The theme a demo subdomain belongs to, or null.
 *
 * This is what tells a resolved shop apart from a merchant's: a shop whose
 * subdomain answers here is ours, and the rules that follow from that — no
 * checkout, no recorded visits, one canonical address — are applied to the
 * *shop*, never to the route, so none of them can be reached round the side.
 */
export function themeKeyForDemoSubdomain(subdomain: string): string | null {
  const slug = subdomain.toLowerCase().replace(/-demo$/, "");
  if (slug === subdomain.toLowerCase()) return null;
  return THEME_STORE_SLUGS[slug] ?? null;
}

/** The slug a demo subdomain serves, or null. */
export function demoSlugForSubdomain(subdomain: string): string | null {
  const slug = subdomain.toLowerCase().replace(/-demo$/, "");
  if (slug === subdomain.toLowerCase()) return null;
  return slug in THEME_STORE_SLUGS ? slug : null;
}

/** Where a theme's demo lives, as a path. */
export function themeStorePath(themeKey: string): string | null {
  const slug = KEY_TO_SLUG[themeKey];
  return slug ? `${THEME_STORE_ROOT}/${slug}` : null;
}

/** The URL slug a theme is published under, or null. */
export function demoSlugForTheme(themeKey: string): string | null {
  return KEY_TO_SLUG[themeKey] ?? null;
}

/** The demo shop a theme is demoed by, or null. */
export function demoSubdomainForTheme(themeKey: string): string | null {
  const slug = KEY_TO_SLUG[themeKey];
  return slug ? demoSubdomain(slug) : null;
}

export type ThemeStoreRoute = {
  /** The slug exactly as it should be spelled. */
  slug: string;
  /** Which theme this demo wears. */
  themeKey: string;
  /** The demo shop's subdomain. */
  subdomain: string;
  /** What every link rendered inside this request must be prefixed with. */
  base: string;
  /** The storefront path being asked for: `/`, `/shop`, `/product/x`. */
  rest: string;
  /**
   * True when the address used was spelled differently — `/theme-store/KITE`,
   * or a trailing slash. The caller redirects rather than serving, so one page
   * never has two addresses.
   */
  redirect: boolean;
};

/**
 * Reads a `/theme-store/...` request, or returns null for anything else.
 *
 * Case-insensitive on the slug because the address was first written down in
 * capitals and somebody will type it that way — but only one spelling is ever
 * *served*. The rest is a 308 to the lowercase form.
 */
export function parseThemeStorePath(pathname: string): ThemeStoreRoute | null {
  if (pathname !== THEME_STORE_ROOT && !pathname.startsWith(`${THEME_STORE_ROOT}/`)) {
    return null;
  }

  const segments = pathname.slice(THEME_STORE_ROOT.length).split("/").filter(Boolean);
  const raw = segments[0];
  if (!raw) return null;

  const slug = raw.toLowerCase();
  const themeKey = THEME_STORE_SLUGS[slug];
  if (!themeKey) return null;

  const rest = `/${segments.slice(1).join("/")}`;
  const base = `${THEME_STORE_ROOT}/${slug}`;

  // A trailing slash on the root counts: `/theme-store/kite/` and
  // `/theme-store/kite` are the same page and only one of them is the address.
  const canonical = rest === "/" ? base : `${base}${rest}`;

  return {
    slug,
    themeKey,
    subdomain: demoSubdomain(slug),
    base,
    rest,
    redirect: pathname !== canonical,
  };
}

/**
 * Prefixes a storefront link so browsing stays inside the demo.
 *
 * `base` is the **empty string on every real shop**, and that is the property
 * this whole feature rests on: a merchant's storefront renders exactly the
 * HTML it rendered before any of this existed, so a bug here can only ever
 * show up inside a demo.
 *
 * Only root-relative paths are touched. An absolute URL, a protocol-relative
 * one, an anchor, a `mailto:` and a `tel:` all belong to somewhere else and
 * are handed back untouched.
 */
export function storeHref(base: string, href: string): string {
  if (!base) return href;
  if (!href.startsWith("/")) return href;
  if (href.startsWith("//")) return href;
  if (href.startsWith(base + "/") || href === base) return href;
  // A link that already names the theme store is addressing it absolutely —
  // the demo bar's link to the *other* theme's demo is the case that matters.
  // Prefixing it would produce /theme-store/kite/theme-store/loom.
  if (href === THEME_STORE_ROOT || href.startsWith(`${THEME_STORE_ROOT}/`)) return href;
  return href === "/" ? base : `${base}${href}`;
}
