// Working out which shop a request is for.
//
// The host is the tenant key. `acme.shop.synoradigitals.com` and a merchant's
// own `shop.acme.com` both resolve to the same Shop; everything downstream
// reads it from here rather than guessing, so there is exactly one place that
// decides.
//
// Three kinds of host exist:
//
//   shop.synoradigitals.com    the product's own site — what it is, and sign-up
//   app.synoradigitals.com     the application: sign-in, dashboard, admin
//   acme.shop.synoradigitals.com   a merchant's free store address
//
// Stores are namespaced under `shop.` deliberately. Hanging them off
// synoradigitals.com directly would put every merchant into the same namespace
// as the automation business, where a merchant claiming "blog" or "docs" takes
// a name that side may want.
//
// Client-safe: pure string handling, no Prisma, no next/headers. The database
// lookup lives in lib/data/shop.ts, which imports these.

/** The apex this platform serves its free subdomains from. */
export const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN ?? "shop.synoradigitals.com";

/** Where the application lives: sign-in, the dashboard, the admin. */
export const APP_HOST = process.env.APP_HOST ?? "app.synoradigitals.com";

/**
 * The company domain the whole thing hangs off.
 *
 * Everything at or under it belongs to us — including the automation business,
 * which is a different product on the same name. The one exception is the store
 * namespace: `acme.shop.synoradigitals.com` is a merchant's, and is matched
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
 * The application host is the important one. `app.synoradigitals.com` sits
 * outside PLATFORM_DOMAIN entirely — it is not under `shop.` — so without this
 * it would be read as a merchant's own domain, find no shop, and 404 the whole
 * application.
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

/** Whether this host is the application rather than the marketing site. */
export function isAppHost(rawHost: string): boolean {
  return normaliseHost(rawHost) === normaliseHost(APP_HOST);
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
/** The region asked for in the URL, forwarded by proxy.ts. */
export const REGION_HEADER = "x-shp-region";

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
  /** <sub>.shop.synoradigitals.com — the free address every shop gets. */
  | { kind: "subdomain"; subdomain: string }
  /** A domain the merchant owns and pointed at us. */
  | { kind: "custom"; host: string }
  /** The platform's own marketing site or dashboard. */
  | { kind: "platform" }
  /** Local development. */
  | { kind: "local"; subdomain: string | null };

/**
 * Strips the port and lowercases. Hosts are case-insensitive and a port is
 * never part of the identity — `ACME.shop.synoradigitals.com:3000` is the
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
    // Only a single label is a shop. "a.b.shop.synoradigitals.com" is not a
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
