import { redirect } from "next/navigation";
import { getKitForRequest } from "@/lib/data/theme";
import { kitBaseContext, kitCheckoutTerms, kitCustomer, showsSamples } from "@/lib/data/kit-context";
import { KitPage } from "@/components/storefront/kit-page";
import { isPreview } from "@/lib/preview-mode";

/**
 * The customer pages — sign in, register, the account and its tabs — drawn by
 * a theme with its own sections. Each returns null when the shop's theme has
 * no kit, and the route goes on to draw the platform's own page.
 */

type Search = Record<string, string | string[] | undefined>;

/** Only an address on this shop — never somewhere else a link chose. */
const sameSite = (to: unknown) => (typeof to === "string" && to.startsWith("/") && !to.startsWith("//") ? to : undefined);

export async function kitSignInPage(mode: "in" | "up", search: Search) {
  const live = await getKitForRequest();
  if (!live) return null;
  const ctx = { ...(await kitBaseContext()), authMode: mode, afterSignIn: sameSite(search.callbackUrl) };
  return <KitPage kit={live.kit} templates={live.templates} name="sign-in" ctx={ctx} preview={isPreview(search)} />;
}

export async function kitAccountPage(tab: "orders" | "addresses" | "details", path: string, search: Search) {
  const live = await getKitForRequest();
  if (!live) return null;
  const base = await kitBaseContext();
  const preview = isPreview(search);
  // The customizer's merchant is not a shopper: they see the kit's sample.
  const customer = (await kitCustomer(base.base)) ?? ((await showsSamples(preview)) ? live.kit.sample.customer : null);
  if (!customer) redirect(`/account/login?callbackUrl=${encodeURIComponent(path)}`);
  // The address form chooses from the cities the shop delivers to.
  const ctx = { ...base, customer, accountTab: tab, checkout: await kitCheckoutTerms() };
  return <KitPage kit={live.kit} templates={live.templates} name="account" ctx={ctx} preview={preview} />;
}
