import { storeRedirect } from "@/lib/theme-store";

/**
 * There is no separate sign-up: a customer's first sign-in with an emailed
 * code makes the account (decided 8 October). Old links land on sign-in.
 */
export default async function RegisterPage(props: PageProps<"/account/register">) {
  const next = (await props.searchParams).callbackUrl;
  // `next` came in already prefixed (it is an address this storefront wrote).
  return storeRedirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? `/account/login?callbackUrl=${encodeURIComponent(next)}` : "/account/login");
}
