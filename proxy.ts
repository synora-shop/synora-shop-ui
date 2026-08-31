import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { REGION_PARAM } from "@/lib/region";
import { PREVIEW_PARAM } from "@/lib/preview-mode";
import {
  REGION_HEADER,
  SHOP_HOST_HEADER,
  SHOP_PATH_HEADER,
  classifyHost,
  isAppHost,
} from "@/lib/shop-context";

// Formerly `middleware.ts` — Next.js 16 renamed the file convention to `proxy.ts`.
//
// Two jobs, in order: work out which shop the request is for, and decide
// whether this visitor may see the part of it they asked for.
//
// The shop is identified by host and authorised from the session token, with no
// database call — this runs on every request to /admin, and a query here would
// be a query on every navigation. The precise lookup happens once, later, in
// lib/data/shop.ts.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const kind = classifyHost(host);

  // The subdomain this request is addressed to, if any. A custom domain has no
  // subdomain and cannot be resolved here — mapping a hostname to a shop needs
  // the Domain table, and this file is deliberately free of database calls
  // because it runs on every request. lib/data/shop.ts does that lookup, and
  // the admin layout re-checks membership against the shop it resolves, which
  // is what actually enforces access on a custom domain.
  const subdomain =
    kind.kind === "subdomain" || kind.kind === "local" ? kind.subdomain : null;

  /** Memberships ride in the token so this needs no round trip. */
  const shops = req.auth?.user?.shops ?? [];

  /**
   * Whether the signed-in user may administer the shop being addressed.
   *
   * On a shop's own subdomain, membership of *that* shop is what counts —
   * being an owner elsewhere means nothing here. With no subdomain (local
   * development on bare localhost) any membership will do, because there is
   * only one shop to be in.
   */
  const canAdminister = subdomain
    ? shops.some((s) => s.subdomain === subdomain && s.role !== "VIEWER")
    : shops.length > 0;

  const signIn = () => {
    const url = new URL("/merchant/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  };

  /**
   * Passes the resolved host down so data code resolves the same shop, and the
   * path, which a server component otherwise has no way to read — the canonical
   * redirect needs it to send a visitor to the same page on the right domain.
   */
  const withShopHeaders = () => {
    const headers = new Headers(req.headers);
    headers.set(SHOP_HOST_HEADER, host);
    headers.set(SHOP_PATH_HEADER, `${pathname}${req.nextUrl.search}`);

    // A layout gets no searchParams, so the requested region has to arrive as a
    // header. Deleted first, unconditionally: these headers are copied from the
    // incoming request, so without that a client could simply send the header
    // itself and skip the one place that decides what it is allowed to be.
    headers.delete(REGION_HEADER);
    const requested = req.nextUrl.searchParams.get(REGION_PARAM);
    if (requested) headers.set(REGION_HEADER, requested.slice(0, 64));

    return headers;
  };

  if (pathname.startsWith("/admin")) {
    if (!canAdminister) return signIn();
    return NextResponse.next({ request: { headers: withShopHeaders() } });
  }

  // The customizer's preview, asking for a storefront on one of our own hosts.
  //
  // Its preview is an iframe, and the two windows talk over postMessage, which
  // is same-origin only — so the frame must be served from whichever host the
  // admin is on, and a merchant with one store works on the application host
  // rather than their shop's own address.
  //
  // Both of the rules below would otherwise answer this request with something
  // that is not a storefront: the first sent the frame to /admin, so the
  // customizer rendered the admin panel inside its own preview pane, and the
  // second serves the page that explains what the product is. Neither is the
  // shop the merchant is editing.
  //
  // Nothing is granted by skipping them. The storefront layout still calls
  // guardShopHost(), which on our own hosts serves a page only to somebody
  // with a session and a shop, and 404s otherwise.
  const previewing = req.nextUrl.searchParams.has(PREVIEW_PARAM);

  // Our own hosts, which are two different things.
  //
  // The application host is where people work: its root belongs in the
  // dashboard, not on a page explaining what the product is to somebody who has
  // already signed up.
  if (isAppHost(host) && pathname === "/" && !previewing) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  // The product's own site. On a shop's address `/` is that shop's home page;
  // on ours it is the page that explains what this is and offers a way in.
  // Rewritten rather than redirected so the site keeps the bare domain — a
  // company site that bounces you to /home on every visit looks broken.
  if (kind.kind === "platform" && pathname === "/" && !previewing) {
    const url = req.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.rewrite(url, { request: { headers: withShopHeaders() } });
  }

  return NextResponse.next({ request: { headers: withShopHeaders() } });
});

export const config = {
  // Everything except static assets: the storefront needs the shop header too,
  // not only the admin.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
