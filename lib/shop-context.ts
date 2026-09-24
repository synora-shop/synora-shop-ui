// Working out which shop a request is for.
//
// The host is the tenant key. `acme.app.synoradigitals.com` and a merchant's
// own `shop.acme.com` both resolve to the same Shop; everything downstream
// reads it from here rather than guessing, so there is exactly one place that
// decides.
//
// Two kinds of host are ours:
//
//   app.synoradigitals.com         the product — what it is, sign-up, sign-in,
//                                  the dashboard and the admin
//   acme.app.synoradigitals.com    a merchant's free store address
//
// The product is called Synora App and lives at one address. It used to be
// spread over two — `shop.synoradigitals.com` explained the product and held
// the store namespace, `app.` held the application — which meant the product's
// own name appeared nowhere a merchant looked and every store address carried
// a word the product no longer goes by.
//
// Stores stay namespaced under a subdomain of ours rather than hanging off
// synoradigitals.com directly: that apex is shared with the automation
// business, and a merchant claiming "blog" or "docs" there would take a name
// that side may want. Under `app.` the only names at stake are ours, and
// RESERVED_SUBDOMAINS holds them back.
//
// Client-safe: pure string handling, no Prisma, no next/headers. The database
// lookup lives in lib/data/shop.ts, which imports these.

/** The apex this platform serves its free subdomains from. */
export const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN ?? "app.synoradigitals.com";

/**
 * Where stores used to live, and where their old links still point.
 *
 * Every address ever printed, shared or indexed under `shop.synoradigitals.com`
 * has to keep arriving somewhere correct — a moved store that 404s is worse
 * than one that never moved. `legacyStoreHost` turns one of those addresses
 * into its replacement and the proxy redirects there permanently; nothing else
 * in the application knows this domain exists.
 *
 * Set LEGACY_STORE_DOMAIN to "" to switch the redirect off once the old
 * addresses have stopped being used.
 */
export const LEGACY_STORE_DOMAIN =
  process.env.LEGACY_STORE_DOMAIN ?? "shop.synoradigitals.com";

/** Where the application lives: sign-in, the dashboard, the admin. */
export const APP_HOST = process.env.APP_HOST ?? "app.synoradigitals.com";

/**
 * The company domain the whole thing hangs off.
 *
 * Everything at or under it belongs to us — including the automation business,
 * which is a different product on the same name. The one exception is the store
 * namespace: `acme.app.synoradigitals.com` is a merchant's, and is matched
 * before this rule applies.
 *
 * Without it, `synoradigitals.com` would classify as a merchant's own domain
 * and could be typed into the "connect your domain" form.
 */
export const PLATFORM_ROOT_DOMAIN =
  process.env.PLATFORM_ROOT_DOMAIN ?? "synoradigitals.com";

/**
 * Other hosts that are ours rather than a merchant's store.
 *
 * The application host is in here for the case where it is *not* the store
 * apex. They are the same address now, so PLATFORM_DOMAIN already covers it —
 * but the two are separate settings and an environment that points them at
 * different hosts (a preview, a self-hosted install) would otherwise read the
 * application's own host as a merchant's domain, find no shop, and 404 the
 * whole application.
 *
 * Deployment URLs are the other case. `.vercel.app` is treated as ours by
 * default: those hostnames are issued by the host, are never a merchant's own
 * domain, and cannot be claimed as one. Anything further goes in PLATFORM_HOSTS,
 * comma-separated.
 */
const EXTRA_PLATFORM_HOSTS: ReadonlySet<string> = new Set(
  [APP_HOST, ...(process.env.PLATFORM_HOSTS ?? "").split(",")]
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
);

/**
 * Whether this host is the application itself rather than a store on it.
 *
 * `app.synoradigitals.com` is true; `acme.app.synoradigitals.com` is false.
 * It used to mean "the application rather than the marketing site", back when
 * those were two addresses. They are one address now, and this is the test for
 * being at the top of it.
 */
export function isAppHost(rawHost: string): boolean {
  return normaliseHost(rawHost) === normaliseHost(APP_HOST);
}

/**
 * The address that replaces an old `shop.synoradigitals.com` one, or null.
 *
 * `acme.shop.…` becomes `acme.app.…` and the bare domain becomes the bare
 * application host. Anything else — including a two-label name like
 * `a.b.shop.…`, which was never a store — returns null and is left alone.
 *
 * Deliberately string-only and database-free: it runs in the proxy, on every
 * request, before anything has been resolved.
 */
export function legacyStoreHost(rawHost: string): string | null {
  const legacy = normaliseHost(LEGACY_STORE_DOMAIN);
  if (!legacy) return null;

  const host = normaliseHost(rawHost);
  const apex = normaliseHost(PLATFORM_DOMAIN);
  if (host === legacy || host === `www.${legacy}`) return apex;

  if (!host.endsWith(`.${legacy}`)) return null;
  const sub = host.slice(0, -(legacy.length + 1));
  if (!sub || sub.includes(".")) return null;
  return `${sub}.${apex}`;
}

/** Absolute URL on the application host, for links that cross from marketing. */
export function appUrl(path = "/"): string {
  // Cross-host, so it has to be absolute: the marketing site and the
  // application do not share a session, and a relative link would keep the
  // visitor on the wrong one.
  return `https://${APP_HOST}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Header the proxy sets once it has resolved the shop, for routes to read. */
export const SHOP_ID_HEADER = "x-shp-shop";
export const SHOP_HOST_HEADER = "x-shp-host";
/** The path being requested, so a server component can build a redirect to it. */
export const SHOP_PATH_HEADER = "x-shp-path";

/**
 * The theme store, passed from the proxy to the render.
 *
 * `/theme-store/kite` is a demo storefront on our own host, so the shop cannot
 * be read from the hostname the way it is everywhere else. The proxy works it
 * out from the path — pure string code, no database — and names it here.
 *
 * Only the shop travels. The link prefix every demo render needs is derived
 * back from this one name rather than sent alongside it, so a request that
 * arrives carrying headers of its own cannot choose where a demo's navigation
 * points. See lib/themes/demo.ts and docs/THEMES.md §5b.
 */
export const DEMO_SHOP_HEADER = "x-shp-demo-shop";

/**
 * Subdomains that are the platform itself, not a merchant.
 *
 * Reserved rather than merely taken: a merchant who managed to claim "admin" or
 * "api" would break routing for everyone, and finding that out after signup is
 * far worse than refusing it at signup.
 */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www", "admin", "api", "app", "dashboard", "cdn", "assets", "static",
  "mail", "smtp", "imap", "ftp", "ns1", "ns2", "mx",
  "status", "docs", "help", "support", "blog", "about", "legal",
  "billing", "account", "accounts", "login", "signup", "auth",
  "test", "staging", "dev", "preview", "demo", "sandbox",
  "shop", "store", "my", "go", "link", "img", "images", "files",
]);

export type HostKind =
  /** <sub>.app.synoradigitals.com — the free address every shop gets. */
  | { kind: "subdomain"; subdomain: string }
  /** A domain the merchant owns and pointed at us. */
  | { kind: "custom"; host: string }
  /** The product's own site: what it is, sign-up, sign-in, the dashboard. */
  | { kind: "platform" }
  /** Local development. */
  | { kind: "local"; subdomain: string | null };

/**
 * Strips the port and lowercases. Hosts are case-insensitive and a port is
 * never part of the identity — `ACME.app.synoradigitals.com:3000` is the
 * same shop.
 */
export function normaliseHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0].replace(/\.$/, "");
}

/**
 * What kind of address this is.
 *
 * Local development is handled explicitly rather than as a special case
 * sprinkled through the callers: `acme.localhost:3000` behaves like a
 * subdomain, and a bare `localhost` is the platform.
 */
export function classifyHost(rawHost: string): HostKind {
  const host = normaliseHost(rawHost);

  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return { kind: "local", subdomain: null };
  }
  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    return { kind: "local", subdomain: sub || null };
  }

  if (host === PLATFORM_DOMAIN || host === `www.${PLATFORM_DOMAIN}`) {
    return { kind: "platform" };
  }

  // Deployment URLs and anything else configured as ours.
  if (host.endsWith(".vercel.app") || EXTRA_PLATFORM_HOSTS.has(host)) {
    return { kind: "platform" };
  }

  if (host.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const sub = host.slice(0, -(PLATFORM_DOMAIN.length + 1));
    // Only a single label is a shop. "a.b.app.synoradigitals.com" is not a
    // shop; it is a mistake, and treating it as one would let someone squat a
    // lookalike of a real store.
    if (sub.includes(".")) return { kind: "platform" };
    if (RESERVED_SUBDOMAINS.has(sub)) return { kind: "platform" };
    return { kind: "subdomain", subdomain: sub };
  }

  // Checked after the store namespace, so a merchant's address still wins.
  // Everything else on the company domain is ours — the automation business
  // included — and none of it is claimable as a custom domain.
  if (host === PLATFORM_ROOT_DOMAIN || host.endsWith(`.${PLATFORM_ROOT_DOMAIN}`)) {
    return { kind: "platform" };
  }

  return { kind: "custom", host };
}

export type SubdomainResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/**
 * Validates and normalises a subdomain in one step.
 *
 * Returns the cleaned value rather than just a verdict, and deliberately so.
 * An earlier version answered only "is this a problem?" while lowercasing
 * internally, so `"Acme"` came back as acceptable and a caller that stored the
 * raw input got `Acme` in a URL and a TLS certificate. Handing back the value
 * that was actually checked removes the gap between the two.
 *
 * The rules are strict — lowercase letters, digits and inner hyphens only.
 * Loosening this later is easy; tightening it later breaks live stores.
 */
export function parseSubdomain(raw: string): SubdomainResult {
  const error = subdomainProblem(raw);
  if (error) return { ok: false, error };
  return { ok: true, value: raw.trim().toLowerCase() };
}

/**
 * The reason a subdomain can't be used, or null if it can.
 *
 * Case is normalised before checking, so "Acme" is acceptable — it simply
 * becomes "acme". Use parseSubdomain() to get that normalised value; this
 * exists for live form feedback, where only the message is wanted.
 */
export function subdomainProblem(raw: string): string | null {
  const sub = raw.trim().toLowerCase();

  if (!sub) return "Pick an address for your store.";
  if (sub.length < 3) return "That is too short, use at least 3 characters.";
  if (sub.length > 40) return "That is too long, keep it under 40 characters.";
  if (!/^[a-z0-9-]+$/.test(sub)) {
    return "Use only lowercase letters, numbers and hyphens.";
  }
  if (sub.startsWith("-") || sub.endsWith("-")) {
    return "It cannot start or end with a hyphen.";
  }
  if (sub.includes("--")) return "It cannot contain two hyphens in a row.";
  if (RESERVED_SUBDOMAINS.has(sub)) return "That address is reserved. Try another.";
  // The theme store's demo shops live at `<slug>-demo` — `kite-demo`,
  // `loom-demo`. The whole suffix is held back rather than the two names in
  // use today, so adding a theme never has to remember to come back here.
  //
  // Deliberately *not* in RESERVED_SUBDOMAINS: that set is also what
  // `classifyHost` uses to decide a host is the platform rather than a shop,
  // and a demo host that classified as the platform would stop resolving to
  // its own shop — which is the thing that redirects it to its real address.
  // This blocks the name at signup, which is the only place it needs blocking.
  if (sub.endsWith("-demo")) return "That address is reserved. Try another.";
  // Entirely numeric reads as an IP fragment in some resolvers and is a common
  // source of confusion in support.
  if (/^\d+$/.test(sub)) return "Include at least one letter.";

  return null;
}

/** Suggests a usable subdomain from a store name. */
export function suggestSubdomain(storeName: string): string {
  const base = storeName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40)
    .replace(/-+$/, "");

  if (!base || base.length < 3) return "";
  if (RESERVED_SUBDOMAINS.has(base)) return "";
  return base;
}

/** The full public address of a shop on its free subdomain. */
export function subdomainUrl(subdomain: string): string {
  return `https://${subdomain}.${PLATFORM_DOMAIN}`;
}
