import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { canonicalHost, currentShop } from "@/lib/data/shop";
import { shopSession } from "@/lib/auth-guard";
import { SHOP_PATH_HEADER, classifyHost, normaliseHost } from "@/lib/shop-context";

/**
 * Keeps the public out of a storefront rendered on the product's own site.
 *
 * The platform host names no shop, but it can still resolve one: a signed-in
 * merchant picks a store for the dashboard and that choice lives in a cookie.
 * Left alone, shop.synoradigitals.com would quietly serve whichever shopfront the last
 * person to sign in happened to be working on.
 *
 * So the rule is not "never" but "only the people who work there". A merchant
 * previewing their own shop is the whole reason the customizer exists, and its
 * preview renders these very routes — blocking the host outright broke it, and
 * broke "preview store" with it. Anyone without access gets a 404, which is
 * also the honest answer: to them, there is no shop at this address.
 *
 * The marketing site still answers at `/` regardless; proxy.ts rewrites it
 * before this runs.
 */
export async function guardShopHost() {
  const h = await headers();
  const host = normaliseHost(h.get("host") ?? "");
  if (classifyHost(host).kind !== "platform") return;

  const me = await shopSession();
  if (!me) notFound();
}

/**
 * Sends a storefront request to the shop's canonical address.
 *
 * A shop reachable at `acme.shop.synoradigitals.com`, `acme.com` and `www.acme.com` is
 * three different sites to a search engine: the ranking splits three ways, and
 * whichever one gets crawled first is the one customers are shown. Worse, a
 * customer who adds something to a basket on one and returns via another finds
 * an empty basket, because cookies are per host.
 *
 * So every non-canonical host redirects, permanently, to the same path on the
 * canonical one.
 *
 * Not done in proxy.ts, which is where a redirect would normally live, because
 * mapping a hostname to its shop's canonical domain needs the database and that
 * file runs on every request for every asset. Here it costs one cached query on
 * storefront pages only.
 */
export async function guardCanonicalHost() {
  const h = await headers();
  const requestHost = normaliseHost(h.get("host") ?? "");
  if (!requestHost) return;

  // Local development is reached by whatever host the developer typed, and
  // redirecting them to a production domain would be actively hostile.
  //
  // The platform host is exempt for a different reason: reaching a storefront
  // there means a merchant is previewing their own shop (see guardShopHost),
  // and bouncing them to the canonical address would defeat the preview — and
  // land them on a hostname that may not resolve yet.
  const kind = classifyHost(requestHost);
  if (kind.kind === "local" || kind.kind === "platform") return;

  const shop = await currentShop();
  if (!shop) return;

  const canonical = await canonicalHost(shop.id);
  if (requestHost === canonical) return;

  // The path comes from the proxy: a server component cannot read it, and
  // redirecting everything to "/" would lose whichever page was asked for —
  // including, for a shop that has just switched domains, every link anyone
  // has ever shared.
  const path = h.get(SHOP_PATH_HEADER) ?? "/";
  redirect(`https://${canonical}${path.startsWith("/") ? path : `/${path}`}`);
}
