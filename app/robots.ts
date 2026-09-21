import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { canonicalHost, canonicalUrl, currentShop, isServingCustomers } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { APP_HOST, classifyHost, normaliseHost } from "@/lib/shop-context";

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
    // Exactly one host invites crawlers. Every other host that classifies as
    // ours serves the same pages — the deployment URLs, the .vercel.app name
    // this project kept from before it was renamed, and the bare platform
    // domain — so without this the product's own site is offered to search
    // engines from several addresses at once, competing with itself.
    //
    // That host is the application host. It used to be PLATFORM_DOMAIN, which
    // was right while `/` on the application host went straight to the panel:
    // an admin screen has no business in an index. It serves the front page
    // now, so the address a merchant already types is the address that should
    // be findable, and the bare platform domain became the duplicate.
    //
    // PLATFORM_DOMAIN itself is untouched. It still decides which host is a
    // shop — `<name>.shop.…` — and merchant storefronts are handled further
    // down this file, not here.
    const host = normaliseHost((await headers()).get("host") ?? "");
    const marketing =
      host === normaliseHost(APP_HOST) || host === `www.${normaliseHost(APP_HOST)}`;
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

  // The merchant's own answer, from Preferences. A shop still being built, or
  // a catalogue meant to be shared by link, asks not to be listed. Search
  // engines obey this; nothing else has to, which is why the screen calls it
  // asking rather than blocking.
  const settings = await getStoreSettings();
  if (!settings.searchIndexing) {
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
