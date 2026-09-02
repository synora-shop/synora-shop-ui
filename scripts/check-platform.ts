/**
 * Checks the line between the platform and the stores it hosts — `npm run check:platform`.
 *
 * One codebase serves two different products: the company's own site, and every
 * merchant's shopfront. Getting the boundary wrong is not a cosmetic bug — it
 * is our own site serving somebody's shop, or a merchant's domain serving our
 * sign-up page. These pin which host is which and what each may render.
 *
 * Dependency-free and offline.
 */
import { sourceOf } from "./source-text";
import { APP_HOST, PLATFORM_DOMAIN, classifyHost, isAppHost } from "../lib/shop-context";
import { domainProblem } from "../lib/domains";
import { SELECTED_SHOP_COOKIE, selectedShopCookieOptions } from "../lib/selected-shop";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};

/** Stands in for whatever Vercel currently calls the project. */
const DEPLOY_HOST = "anything.vercel.app";

console.log("\nWHICH HOSTS ARE OURS");
check("the apex is ours", classifyHost(PLATFORM_DOMAIN).kind === "platform");
check("www of it is ours", classifyHost(`www.${PLATFORM_DOMAIN}`).kind === "platform");
// Without this the deployment URL is read as a merchant's own domain, finds no
// shop, and 404s the entire site — which is exactly what it did.
//
// The rule is the .vercel.app suffix, not the project name, so these fixtures
// deliberately do not name the project: renaming it must not need a test edit,
// and a test that only passes for one name would not be testing the rule.
check("a deployment URL is ours", classifyHost(DEPLOY_HOST).kind === "platform");
check("any preview URL is ours", classifyHost("anything-git-abc123.vercel.app").kind === "platform");
check("a reserved subdomain is ours", classifyHost(`admin.${PLATFORM_DOMAIN}`).kind === "platform");
check("a nested subdomain is ours, not a shop's",
  classifyHost(`a.b.${PLATFORM_DOMAIN}`).kind === "platform");

console.log("\nWHICH HOSTS ARE A SHOP'S");
check("a free address is a shop", classifyHost(`acme.${PLATFORM_DOMAIN}`).kind === "subdomain");
check("a merchant's own domain is a shop", classifyHost("acme.com").kind === "custom");
check("localhost is neither, so development still works",
  classifyHost("localhost").kind === "local");

console.log("\nTHE TWO RULES AGREE");
// If a hostname could be both, one of two things happens: our marketing site is
// served from a merchant's domain, or their shop is served from ours.
for (const host of [PLATFORM_DOMAIN, `www.${PLATFORM_DOMAIN}`, `acme.${PLATFORM_DOMAIN}`, DEPLOY_HOST]) {
  check(`no merchant can claim ${host}`, domainProblem(host) !== null);
}
check("a deployment URL cannot be claimed as a custom domain",
  domainProblem(DEPLOY_HOST) !== null);

console.log("\nTHE STOREFRONT DOES NOT RENDER ON OUR SITE");
const canonical = sourceOf("lib", "canonical.ts");
check("there is a guard for it", canonical.includes("guardShopHost"));
check("it refuses rather than redirecting", canonical.includes("notFound()"));
const storefrontLayout = sourceOf("app", "(storefront)", "layout.tsx");
check("the storefront layout uses it", storefrontLayout.includes("guardShopHost()"));
check("and still redirects to the canonical host", storefrontLayout.includes("guardCanonicalHost()"));

console.log("\nOUR SITE ANSWERS AT THE BARE DOMAIN");
const proxy = sourceOf("proxy.ts");
check("the platform host is rewritten, not redirected",
  proxy.includes('kind.kind === "platform"') && proxy.includes("NextResponse.rewrite"));
check("it lands on the marketing page", proxy.includes('url.pathname = "/home"'));
check("only the root is rewritten, so /admin and /merchant still work",
  proxy.includes('pathname === "/"'));

console.log("\nTHE CHOSEN STORE IS A PREFERENCE, NOT A PERMISSION");
const shopData = sourceOf("lib", "data", "shop.ts");
// Tied to the cookie read itself rather than matched anywhere in the file.
// Two earlier spellings both missed: the literal inlined call fails a harmless
// refactor that hoists it into a variable, and "the file mentions classifyHost
// somewhere" passes even with the gate deleted, because the file calls it
// again further down for an unrelated reason. What matters is not that the
// call exists but that the cookie is read inside it.
{
  const lines = shopData.split("\n");
  const readAt = lines.findIndex((l) => l.includes("SELECTED_SHOP_COOKIE") && l.includes("cookies()"));
  const gate = readAt === -1 ? "" : lines.slice(Math.max(0, readAt - 6), readAt).join("\n");
  check(
    "the cookie is read only on our own host",
    readAt !== -1 && /kind === "platform"/.test(gate),
    readAt === -1 ? "no cookie read found" : "the read is not inside a platform-host branch"
  );
}
check("the shop it names is looked up, not trusted", shopData.includes("prisma.shop.findUnique"));
// The cookie decides *which* shop the request is about. Membership of that shop
// is then checked by the ordinary guard, exactly as it is on a subdomain — so
// editing the cookie changes what you are refused access to, not whether.
const guard = sourceOf("lib", "auth-guard.ts");
check("membership is still checked against whatever it resolves",
  guard.includes("session.user.shops?.find"));
check("no membership means no session, whatever the cookie said",
  guard.includes("if (!membership) return null"));
check("the guard returns null instead of 404ing, so /admin can redirect",
  guard.includes("currentShop()") && !guard.includes("requireShop()"));

console.log("\nTHE COOKIE ITSELF IS SENSIBLE");
check("it is not readable from JavaScript", selectedShopCookieOptions.httpOnly === true);
check("it does not ride on cross-site requests", selectedShopCookieOptions.sameSite === "lax");
check("it is https-only in production",
  selectedShopCookieOptions.secure === (process.env.NODE_ENV === "production"));
check("it expires", (selectedShopCookieOptions.maxAge ?? 0) > 0);
check("its name is namespaced", SELECTED_SHOP_COOKIE.startsWith("shp_"));

console.log("\nSIGNING IN LEADS SOMEWHERE USEFUL");
const loginForm = sourceOf("components", "merchant", "login-form.tsx");
check("login goes to the stores list by default",
  loginForm.includes('"/merchant/stores"'));
check("and still honours a callbackUrl", loginForm.includes("callbackUrl"));
// An open redirect on a sign-in page is how a phishing link borrows a real
// login form and bounces the victim somewhere else afterwards.
check("but only to a path on this site",
  loginForm.includes('startsWith("/")') && loginForm.includes('!requested.startsWith("//")'));

const stores = sourceOf("app", "merchant", "stores", "page.tsx");
check("one store skips the picker", stores.includes('redirect("/admin")'));
// A server component may not write cookies; doing it here 500'd the page.
check("the page sets no cookie while rendering", !stores.includes("cookies()"));

const adminLayout = sourceOf("app", "admin", "layout.tsx");
check("no session sends you to sign in", adminLayout.includes("/merchant/login"));
check("a session with no store sends you to pick one",
  adminLayout.includes('redirect("/merchant/stores")'));

console.log("\nOUR SITE IS A REAL PAGE, NOT A PLACEHOLDER");
const home = sourceOf("app", "(platform)", "home", "page.tsx");
check("it offers a way to sign up", home.includes("/merchant/signup"));
check("it offers a way to sign in", home.includes("/merchant/login"));
// The front page inherits the site's title and description rather than setting
// its own: the root template appends "· Shop" to every child title, which
// on the front page says the name twice.
// Matched against the brand rather than against "title:", which also appears
// in the page's own content — the first version of this check read those and
// failed on them.
check("it sets no metadata title that would repeat the brand",
  !/title:\s*"Shop/.test(home));
const rootLayout = sourceOf("app", "layout.tsx");
check("the site has a description for search engines and link previews",
  rootLayout.includes("description:") && rootLayout.includes("openGraph"));
check("that description is about the platform, not about one shop",
  rootLayout.includes("Open an online store"));
const platformLayout = sourceOf("app", "(platform)", "layout.tsx");
// The marketing site and the application are separate hosts and deliberately
// share no session cookie — scoping one across the company domain would hand it
// to every merchant storefront and to the automation business. The consequence
// is that this site cannot know whether you are signed in, and must not try.
check("the marketing site does not read a session it cannot see",
  !platformLayout.includes("auth()"));
check("its doors point at the application host",
  platformLayout.includes("appUrl("));

console.log("\nTHE APPLICATION HOST IS NOT THE MARKETING SITE");
check("the app host is recognised", isAppHost(APP_HOST));
check("the marketing host is not the app host", !isAppHost(PLATFORM_DOMAIN));
// Somebody who has already signed up does not need the page explaining what
// the product is.
check("its root goes to the dashboard", proxy.includes("isAppHost(host)"));
check("cross-host links are absolute, since a relative one would stay put",
  sourceOf("lib", "shop-context.ts").includes("https://${APP_HOST}"));

console.log("\nEXCEPT WHEN THE CUSTOMIZER IS PREVIEWING");
{
  // The customizer's preview is an iframe, and the two windows talk over
  // postMessage, which is same-origin only. So the frame must be served from
  // whichever host the admin is on — and a merchant with one store works on
  // the application host, not their shop's address.
  //
  // While the root redirect had no exception, that iframe followed it and
  // rendered the admin panel inside the customizer's own preview pane. Nothing
  // errored; the editor simply showed the wrong thing to most merchants.
  // Both rules, not one. Exempting only the /admin redirect let the request
  // fall through to the next rule and be answered with the marketing page —
  // a different wrong thing in the same pane.
  check("the dashboard redirect makes way for the preview",
    /isAppHost\(host\) && pathname === "\/" && !previewing/.test(proxy));
  check("and so does the marketing rewrite",
    /kind\.kind === "platform" && pathname === "\/" && !previewing/.test(proxy));
  check("both read the same flag", /const previewing = req\.nextUrl\.searchParams\.has\(PREVIEW_PARAM\)/.test(proxy));

  // The exception must not become an entrance. What it allows is a *render*;
  // who may see it is still guardShopHost's decision.
  const layout = sourceOf("app", "(storefront)", "layout.tsx");
  check("the storefront still guards its host", /guardShopHost\(\)/.test(layout));
  const canonical = sourceOf("lib", "canonical.ts");
  check("that guard demands a session on our own host",
    /kind !== "platform"\) return;[\s\S]{0,200}shopSession\(\)[\s\S]{0,80}notFound\(\)/.test(canonical));
  check("and the canonical redirect leaves the preview alone",
    /kind === "local" \|\| kind\.kind === "platform"\) return;/.test(canonical));

  // If either side ever accepted a foreign origin, the preview could be framed
  // by somebody else's page and driven from it.
  const previewSections = sourceOf("components", "storefront", "preview-sections.tsx");
  check("the preview ignores messages from other origins",
    /event\.origin !== window\.location\.origin/.test(previewSections));
  check("and speaks only to its own", /window\.location\.origin/.test(previewSections));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exitCode = 1;
