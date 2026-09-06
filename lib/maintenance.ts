import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { GEO_COUNTRY_HEADER, isBlocked, normaliseCountry } from "@/lib/geo-block";
import { shopSession } from "@/lib/auth-guard";
import { currentShop, isServingCustomers } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";

/**
 * Whether a storefront should be selling right now, and why not.
 *
 * Two separate reasons a store can be shut, and they are not the same thing:
 *
 *   The shop's own status — paused by the merchant, closed by them, or
 *   suspended by us. This outranks everything.
 *
 *   Maintenance mode, a toggle in Global Edits for "back in ten minutes".
 *
 * Both land on /maintenance, but the page says different words, because "we're
 * on holiday" and "this store has closed" send a customer to very different
 * next actions.
 */
export type ClosedReason = "paused" | "closed" | "suspended" | "maintenance" | "blocked";

export async function storefrontClosure(): Promise<ClosedReason | null> {
  const shop = await currentShop();
  if (shop && !isServingCustomers(shop)) {
    if (shop.status === "PAUSED") return "paused";
    if (shop.status === "CLOSED") return "closed";
    return "suspended";
  }

  const settings = await getStoreSettings();
  if (settings.maintenanceMode) return "maintenance";

  // Country blocking rides on the gate every storefront page already calls,
  // rather than a check of its own in each of them — one of those would
  // eventually be forgotten on a new page and the shop would leak through it.
  //
  // Read last because it costs a header lookup, and because a shop that is shut
  // for any other reason is shut for everyone anyway.
  if (settings.blockedCountries.length > 0) {
    const country = normaliseCountry((await headers()).get(GEO_COUNTRY_HEADER));
    if (isBlocked(country, settings.blockedCountries)) return "blocked";
  }

  return null;
}

/**
 * Called at the top of storefront shopping pages (home, shop, product,
 * collections, cart, checkout). Sends everyone except this shop's own staff to
 * /maintenance when the store isn't open for business.
 *
 * Deliberately NOT applied to /account/*, /p/[slug], or the maintenance page
 * itself — those aren't "the storefront is down for shopping" in the same
 * sense. It is opt-in per page rather than a blanket, which is also what keeps
 * /merchant/* reachable: a merchant must always be able to sign in and switch
 * this back off, and a paused store that locks out its own owner is a support
 * ticket with no other way out.
 */
export async function guardStorefront() {
  const reason = await storefrontClosure();
  if (!reason) return;

  // Staff of this shop keep seeing it while it is shut, so they can work.
  // Checked after the reason so a fully open store never pays for the lookup.
  if (await shopSession()) return;

  redirect("/maintenance");
}
