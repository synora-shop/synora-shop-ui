import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PREVIEW_PARAM } from "@/lib/preview-mode";
import {
  DEMO_SHOP_HEADER,
  SHOP_ID_HEADER,
  SHOP_HOST_HEADER,
  SHOP_PATH_HEADER,
  classifyHost,
  isAppHost,
  legacyStoreHost,
} from "@/lib/shop-context";
import { parseThemeStorePath } from "@/lib/themes/demo";

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

  // Stores moved from `shop.synoradigitals.com` to `app.synoradigitals.com`
  // when the product settled on one name. Every old address keeps working, on
  // the same path, permanently — someone's printed card, a shared link and a
  // search result are all addresses we no longer control, and the only honest
  // answer to one of them is the page it used to reach.
  //
  // First, before anything else looks at the host: the old name is not a shop
  // any more and resolving it would find nothing.
  const moved = legacyStoreHost(host);
  if (moved) {
    // 308 rather than 302: permanent, and it keeps the method, so a form
    // posting to an old address still posts rather than silently becoming a
    // GET and losing what was typed.
    return NextResponse.redirect(
      new URL(`${pathname}${req.nextUrl.search}`, `https://${moved}`),
      308
    );
  }

  const kind = classifyHost(host);

  /**
   * The request's headers with every one of ours removed, then re-set.
   *
   * These headers are how the proxy tells the render which shop it is looking
   * at, and a header is not a private channel: whatever arrives on the request
   * arrives here too. Copying `req.headers` straight through therefore let a
   * visitor *choose the shop* by sending `x-shp-shop` themselves — a request to
   * one merchant's address came back rendering another merchant's storefront,
   * confirmed against a running build before this was written.
   *
   * It was never an escalation. `/admin` is gated on the subdomain in the
   * hostname, not on these, and `shopSession()` re-checks membership against
   * whichever shop was resolved — so a forged header names a shop you are not
   * a member of and gets you nothing. What it *could* do is serve one shop's
   * public pages under another's address, which is somebody else's SEO.
   *
   * `x-shp-shop` in particular is written by nothing in this codebase and read
   * in exactly one place (lib/data/shop.ts). A forged header was the only way
   * that branch could ever be reached.
   *
   * So: strip first, set second, one place. Anything the proxy means to say is
   * said after this runs.
   */
  const trustedHeaders = () => {
    const headers = new Headers(req.headers);
    headers.delete(SHOP_ID_HEADER);
    headers.delete(DEMO_SHOP_HEADER);
    headers.set(SHOP_HOST_HEADER, host);
    return headers;
  };


  // The theme store: `/theme-store/kite` is a demo storefront on our own host.
  //
  // It is answered here rather than by a route because what it renders is the
  // *storefront* — the same pages, the same components, one of our own demo
  // shops instead of a merchant's. Rewriting is what lets that happen without a
  // second copy of every page.
  //
  // The demo shop's name goes down with it, because it cannot be read from the
  // hostname the way it is everywhere else. It comes out of the path in pure
  // string code — no database call, which is the rule this file lives by — and
  // the link prefix the render needs is derived back from it later.
  //
  // Our own hosts only. On a merchant's domain `/theme-store/anything` is one
  // of their pages, or a 404, and never ours.
  if (kind.kind !== "custom") {
    const demo = parseThemeStorePath(pathname);
    if (demo) {
      // One address per page. `/theme-store/KITE` and a trailing slash both
      // reach the same storefront, and serving either would put a second URL
      // for identical content in front of a crawler — the exact thing
      // guardCanonicalHost exists to prevent everywhere else.
      if (demo.redirect) {
        const url = req.nextUrl.clone();
        url.pathname = demo.rest === "/" ? demo.base : `${demo.base}${demo.rest}`;
        return NextResponse.redirect(url, 308);
      }

      const headers = trustedHeaders();
      headers.set(DEMO_SHOP_HEADER, demo.subdomain);
      // The *inner* path, which is what the storefront is actually rendering.
      // Anything reading this — the canonical redirect, `?__theme=` — should
      // see `/shop`, not `/theme-store/kite/shop`.
      headers.set(SHOP_PATH_HEADER, `${demo.rest}${req.nextUrl.search}`);

      const url = req.nextUrl.clone();
      url.pathname = demo.rest;
      return NextResponse.rewrite(url, { request: { headers } });
    }
  }

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
    const headers = trustedHeaders();
    headers.set(SHOP_PATH_HEADER, `${pathname}${req.nextUrl.search}`);

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

  // Our own address, at the top of it.
  //
  // On a shop's address `/` is that shop's home page; on ours it is the page
  // that explains what this is and offers a way in. It used to go straight to
  // /admin, on the reasoning that anyone typing this address has already
  // signed up — which is only true of the people who already have a store.
  // Somebody sent the link, or arriving from a search, met a login form with
  // no explanation of what they were being asked to log in to.
  //
  // Rewritten rather than redirected, and that is not cosmetic. The front page
  // names `https://app.synoradigitals.com` as its canonical address and that is
  // the address submitted to search engines; a root that redirects away is
  // reported as "page with redirect" and the bare domain never gets indexed.
  // This way the bare domain *is* the page. /home still works as its own
  // address for anyone who has the link.
  //
  // A merchant with a session loses nothing: every /admin address still works
  // and the browser remembers where they go.
  if ((isAppHost(host) || kind.kind === "platform") && pathname === "/" && !previewing) {
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
