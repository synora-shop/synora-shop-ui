import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { canonicalHost, canonicalUrl, currentShop, isServingCustomers } from "@/lib/data/shop";
import { PLATFORM_DOMAIN, classifyHost, normaliseHost } from "@/lib/shop-context";

// Per shop, per host — not one file for the whole platform.
//
// It used to point every host at a single hardcoded sitemap URL, which on a
// platform means telling every crawler that every merchant's sitemap lives on
// somebody else's domain.

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const shop = await currentShop();

  // The platform's own site, not a store.
  if (!shop) {
    // Only the marketing domain invites crawlers. Every other host that
    // classifies as ours serves the same pages — the application host, every
    // deployment URL, and the .vercel.app name this project kept from before it
    // was renamed — so without this the company site is offered to search
    // engines from several addresses at once, competing with itself.
    const host = normaliseHost((await headers()).get("host") ?? "");
    const marketing =
      host === normaliseHost(PLATFORM_DOMAIN) || host === `www.${normaliseHost(PLATFORM_DOMAIN)}`;
    const isLocal = classifyHost(host).kind === "local";
    if (host && !isLocal && !marketing) {
      return { rules: { userAgent: "*", disallow: "/" } };
    }
    return {
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/merchant", "/api"] },
    };
  }

  // A store that is paused, closed or suspended should not be crawled: all a
  // crawler would find is a notice saying it is shut, and that notice replacing
  // a shop's search results is a real cost of a two-week holiday.
  if (!isServingCustomers(shop)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  // A store reachable at three addresses would otherwise be crawled three times
  // and ranked as three sites. Only the canonical host invites crawlers in.
  //
  // Local development is exempt, the same way the canonical redirect is: a
  // developer's host is never the canonical one, and a robots.txt that always
  // said "go away" locally would read as a bug in this file.
  const requestHost = normaliseHost((await headers()).get("host") ?? "");
  const canonical = await canonicalHost(shop.id);
  const local = classifyHost(requestHost).kind === "local";
  if (requestHost && !local && requestHost !== canonical) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /merchant is the platform's own sign-in and is reachable on every host.
      disallow: ["/admin", "/merchant", "/account", "/checkout", "/cart", "/api"],
    },
    sitemap: `${await canonicalUrl(shop.id)}/sitemap.xml`,
  };
}
