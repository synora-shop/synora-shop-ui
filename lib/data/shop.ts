import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { forShop, type TenantClient } from "@/lib/tenant";
import { auth } from "@/auth";
import {
  PLATFORM_DOMAIN,
  SHOP_ID_HEADER,
  classifyHost,
  normaliseHost,
} from "@/lib/shop-context";
import { SELECTED_SHOP_COOKIE } from "@/lib/selected-shop";

// Which shop this request is for, and a database client locked to it.
//
// The shop is resolved once by proxy.ts and passed down as a header, so every
// read here is a header lookup rather than another round trip. `cache()` makes
// it once-per-request even when a dozen components ask.
//
// The alternative — threading a shopId parameter through every data function —
// was the first design, and it meant changing about two hundred call sites and
// then relying on nobody ever forgetting the argument. This puts the shop where
// the request already is.

export type CurrentShop = {
  id: string;
  name: string;
  subdomain: string;
  status: "TRIAL" | "ACTIVE" | "PAUSED" | "PAST_DUE" | "SUSPENDED" | "CLOSED";
  /// What kind of business this is. Decides which storefront rows a scoped
  /// query sees — see PROFILE_MODELS in lib/tenant.ts.
  businessType: "ECOMMERCE" | "BLOG" | "RESTAURANT";
  /// Null until the merchant has been through, or skipped, the welcome flow.
  onboardedAt: Date | null;
};

/**
 * The columns a CurrentShop is made of.
 *
 * Written once because a shop is resolved five different ways — by header, by
 * cookie, by sole membership, by host, by custom domain — and a select that
 * disagrees with this type is not a compile error when the result is cast.
 * That is exactly how onboardedAt went missing from four of the five: the
 * merchant finished setup, was resolved through a path that never read the
 * column, and was sent back to the welcome screen for ever.
 */
const SHOP_SELECT = {
  id: true,
  name: true,
  subdomain: true,
  status: true,
  businessType: true,
  onboardedAt: true,
} as const;

/**
 * The shop this request belongs to, or null on a platform page.
 *
 * Null is a real answer, not a failure: the marketing site, signup and the
 * account area all exist above any shop.
 */
export const currentShop = cache(async (): Promise<CurrentShop | null> => {
  const h = await headers();

  const id = h.get(SHOP_ID_HEADER);
  if (id) {
    const shop = await prisma.shop.findUnique({
      where: { id },
      select: SHOP_SELECT,
    });
    if (shop) return shop;
  }

  const host = h.get("host") ?? "";
  const hostKind = classifyHost(host);

  // If addressed to an explicit subdomain or custom domain, resolve by host:
  if (
    hostKind.kind === "subdomain" ||
    (hostKind.kind === "local" && hostKind.subdomain) ||
    hostKind.kind === "custom"
  ) {
    const byHost = await resolveShopByHost(host);
    if (byHost) return byHost;
  }

  // On the platform's own host or bare localhost, the hostname names no shop,
  // but the dashboard still has to know which store a merchant is working on.
  // The cookie or the user's sole membership says which one is active.
  if (hostKind.kind === "platform" || (hostKind.kind === "local" && !hostKind.subdomain)) {
    const selected = (await cookies()).get(SELECTED_SHOP_COOKIE)?.value;
    if (selected) {
      const shop = await prisma.shop.findUnique({
        where: { id: selected },
        select: SHOP_SELECT,
      });
      if (shop) return shop;
    }

    // No cookie, but most merchants have exactly one store — and for them a
    // "choose your store" step is a click that exists only because the code
    // was easier to write that way. One store is not a choice, so it needs no
    // cookie either.
    const session = await auth();
    const shops = session?.user?.shops ?? [];
    if (shops.length === 1) {
      const shop = await prisma.shop.findUnique({
        where: { id: shops[0].shopId },
        select: SHOP_SELECT,
      });
      if (shop) return shop;
    }
  }

  // Fallback: resolve from host (e.g. unauthenticated bare localhost)
  const byHost = await resolveShopByHost(host);
  if (byHost) return byHost;

  return null;
});

/**
 * Looks a shop up from a request host.
 *
 * Kept separate from currentShop so proxy.ts — which has no React cache and no
 * headers() — can use exactly the same rules.
 */
export async function resolveShopByHost(host: string): Promise<CurrentShop | null> {
  const kind = classifyHost(host);

  if (kind.kind === "platform") return null;

  const subdomain =
    kind.kind === "subdomain" ? kind.subdomain : kind.kind === "local" ? kind.subdomain : null;

  if (subdomain) {
    const shop = await prisma.shop.findUnique({
      where: { subdomain },
      select: SHOP_SELECT,
    });
    return shop ?? null;
  }

  // A domain the merchant owns.
  //
  // Only VERIFIED and ACTIVE domains resolve. A PENDING row is nothing but
  // someone having typed a name into a box — serving a store from it would
  // mean anyone could claim any hostname and have it work the moment its DNS
  // happened to point here.
  if (kind.kind === "custom") {
    const domain = await prisma.domain.findFirst({
      where: {
        hostname: normaliseHost(kind.host),
        status: { in: ["VERIFIED", "ACTIVE"] },
      },
      select: { shop: { select: SHOP_SELECT } },
    });
    return domain?.shop ?? null;
  }

  // Bare localhost in development: serve the first shop so the app is usable
  // without editing your hosts file. Never reached in production, because
  // classifyHost only returns "local" for localhost and .local.
  if (kind.kind === "local") {
    const shop = await prisma.shop.findFirst({
      orderBy: { createdAt: "asc" },
      select: SHOP_SELECT,
    });
    return shop ?? null;
  }

  return null;
}

/**
 * The current shop, or a 404.
 *
 * For anything under a storefront or a shop's admin, where there is no sensible
 * page to render without knowing whose shop it is.
 */
export async function requireShop(): Promise<CurrentShop> {
  const shop = await currentShop();
  if (!shop) notFound();
  return shop;
}

/**
 * A database client scoped to this request's shop.
 *
 * This is what data-layer code should use instead of `prisma`. Every query it
 * issues carries the shop; every row it creates is stamped with it.
 */
export const db = cache(async (): Promise<TenantClient> => {
  const shop = await requireShop();
  // The business type as well as the shop: models describing a storefront are
  // partitioned by it, so a merchant who switches type and back finds their
  // store as they left it. See PROFILE_MODELS in lib/tenant.ts.
  return forShop(shop.id, shop.businessType);
});

/**
 * The one address a shop should be known by.
 *
 * A store reachable at `acme.shop.synoradigitals.com`, `acme.com` and
 * `www.acme.com` is
 * three stores as far as a search engine is concerned, splitting its ranking
 * three ways and showing whichever it happened to crawl. The primary domain is
 * the answer to "which one is real", and everything else redirects to it.
 *
 * Falls back to the free subdomain, which is always present and always ours, so
 * this never returns nothing.
 */
export const canonicalHost = cache(async (shopId: string): Promise<string> => {
  const primary = await prisma.domain.findFirst({
    where: { shopId, isPrimary: true, status: { in: ["VERIFIED", "ACTIVE"] } },
    select: { hostname: true },
  });
  if (primary) return primary.hostname;

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { subdomain: true },
  });
  return `${shop?.subdomain ?? "store"}.${PLATFORM_DOMAIN}`;
});

/** The canonical base URL for the current shop, for metadata and sitemaps. */
export async function canonicalUrl(shopId: string): Promise<string> {
  return `https://${await canonicalHost(shopId)}`;
}

/** Whether the storefront should be serving customers right now. */
export function isServingCustomers(shop: CurrentShop): boolean {
  return shop.status === "TRIAL" || shop.status === "ACTIVE" || shop.status === "PAST_DUE";
}

/**
 * Just the id of the current shop.
 *
 * Most code should use `db()` and never see this. It exists for the few places
 * that must name the shop explicitly: a compound unique key like
 * (shopId, env) cannot be built without it, and Prisma will not accept a
 * partial one.
 */
export const currentShopId = cache(async (): Promise<string> => (await requireShop()).id);

/**
 * Where a shop's own notifications should go.
 *
 * The address the merchant published for customers to reach them, falling back
 * to whoever owns the shop — the one person guaranteed to exist and to care.
 * Null only if a shop somehow has neither, in which case no notice is sent
 * rather than one going somewhere arbitrary.
 *
 * This deliberately does not read an environment variable. A single
 * platform-wide notification address meant every merchant's orders landed in
 * the platform's inbox while the merchant who made the sale heard nothing.
 */
export async function shopNotificationEmail(shopId: string): Promise<string | null> {
  const settings = await prisma.storeSettings.findFirst({
    where: { shopId },
    select: { contactEmail: true },
  });
  if (settings?.contactEmail?.trim()) return settings.contactEmail.trim();

  const owner = await prisma.membership.findFirst({
    where: { shopId, role: "OWNER", acceptedAt: { not: null } },
    select: { user: { select: { email: true } } },
  });
  return owner?.user.email ?? null;
}
