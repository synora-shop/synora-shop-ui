/**
 * Which store a merchant is working on, when the host doesn't say.
 *
 * On a shop's own address the host is the answer and nothing else is needed.
 * On the platform's own host — where somebody signs in, and where a merchant with
 * three stores lands — there is no shop in the hostname, so the dashboard needs
 * to be told which one is meant. That is this cookie.
 *
 * It is a *preference*, never a permission. Anyone can edit a cookie, so the
 * shop it names is looked up and then checked against the signed-in user's
 * memberships by the ordinary guard in lib/auth-guard.ts, exactly as it would
 * be on a subdomain. Pointing this at somebody else's store gets you the same
 * "you don't have access" as typing their address into the URL bar.
 */
export const SELECTED_SHOP_COOKIE = "shp_store";

/** A month: long enough to survive a normal working rhythm, short enough to lapse. */
export const SELECTED_SHOP_MAX_AGE = 60 * 60 * 24 * 30;

export const selectedShopCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  // Not `secure` in development, where there is no TLS and the cookie would
  // simply never be set.
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SELECTED_SHOP_MAX_AGE,
};
