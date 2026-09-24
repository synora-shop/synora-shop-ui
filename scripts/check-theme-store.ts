/**
 * Checks the theme store — `npm run check:theme-store`.
 *
 * `/theme-store/kite` is a complete demo storefront on our own host, filled
 * with our goods, public and indexed. Three things about it are easy to break
 * later and expensive to notice, so they are held up here.
 *
 *   1. **Every theme has a demo, and every demo has a theme.** A theme added
 *      to the registry without a slug 404s from a Preview button; a slug left
 *      behind after a theme is retired serves a page for a design nobody can
 *      have.
 *   2. **Preview means three different things and each one still points where
 *      it should.** Active Theme is the live shop, All Themes is the shop
 *      wearing a copy, Theme Store is the demo. They were one line of code
 *      once, and collapsing them again is the obvious "tidy-up".
 *   3. **Add brings no demo content.** A merchant adding Kite gets the theme,
 *      not forty of our products — see docs/THEMES.md §5b.
 *
 * Plus the things that keep the demos out of each other's way: they refuse
 * orders and enquiries, they record no visits, and the raw `kite-demo` host
 * never serves.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { THEMES } from "../lib/themes/registry";
import {
  DEMO_SLUGS,
  THEME_STORE_ROOT,
  THEME_STORE_SLUGS,
  demoSlugForSubdomain,
  demoSubdomain,
  parseThemeStorePath,
  storeHref,
  themeKeyForDemoSubdomain,
  themeStorePath,
} from "../lib/themes/demo";
import { DEMO_CATALOGUES } from "./theme-store-catalogue";

/** Source with its comments removed — a guard must not read its own prose. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/* ------------------------------------------------- 1. the slug table ------ */

for (const key of Object.keys(THEMES)) {
  check(
    `${THEMES[key].name} has a demo address`,
    themeStorePath(key) !== null,
    `add "${THEMES[key].name.toLowerCase()}": "${key}" to THEME_STORE_SLUGS — without it the Theme Store's Preview falls back to the merchant's own shop`
  );
}

for (const [slug, key] of Object.entries(THEME_STORE_SLUGS)) {
  check(
    `/theme-store/${slug} names a theme that exists`,
    key in THEMES,
    `"${key}" is not in the registry, so this address serves a design nobody can add`
  );
  check(
    `/theme-store/${slug} has a catalogue to sell`,
    slug in DEMO_CATALOGUES,
    "a demo with no products is a theme judged on an empty grid, which is the thing this replaced"
  );
}

// Each theme demos the kind of shop it was built for — the design file draws
// Loom as cosmetics and Kite as streetwear, and one shared catalogue would hide
// exactly the difference somebody is comparing.
const storeNames = DEMO_SLUGS.map((s) => DEMO_CATALOGUES[s]?.storeName);
check(
  "each theme demos a different kind of shop",
  new Set(storeNames).size === storeNames.length,
  "two themes sharing a catalogue demo the same shop twice"
);

/* --------------------------------------------- 2. the routing is sound ---- */

{
  const route = parseThemeStorePath("/theme-store/kite");
  check("a demo root parses", route?.themeKey === "atlas" && route?.rest === "/");
  check("and needs no redirect", route?.redirect === false);

  const inner = parseThemeStorePath("/theme-store/kite/product/heavyweight-box-tee");
  check(
    "an inner page rewrites to the storefront path",
    inner?.rest === "/product/heavyweight-box-tee",
    "the storefront routes are what render a demo; the prefix must come off first"
  );

  check(
    "a capitalised slug redirects rather than serving",
    parseThemeStorePath("/theme-store/KITE")?.redirect === true,
    "two spellings serving identical content is two URLs for one page"
  );
  check(
    "a trailing slash redirects too",
    parseThemeStorePath("/theme-store/kite/")?.redirect === true
  );
  check("an unknown theme is not ours", parseThemeStorePath("/theme-store/nothing") === null);
  check("and neither is a bare root", parseThemeStorePath(THEME_STORE_ROOT) === null);
  check(
    "an ordinary storefront path is untouched",
    parseThemeStorePath("/shop") === null && parseThemeStorePath("/theme-storefront") === null
  );
}

{
  check(
    "a demo subdomain names its theme",
    themeKeyForDemoSubdomain("kite-demo") === "atlas" &&
      demoSlugForSubdomain("kite-demo") === "kite"
  );
  check(
    "and a merchant's shop never does",
    themeKeyForDemoSubdomain("kite") === null &&
      themeKeyForDemoSubdomain("acme") === null &&
      themeKeyForDemoSubdomain("nothing-demo") === null,
    "isDemoShop decides whether a shop can take an order — a false positive shuts a real store's checkout"
  );
}

/* ------------------------------------- 3. the link prefix is inert ------- */

check(
  "a real shop's links are untouched",
  storeHref("", "/shop") === "/shop" && storeHref("", "/") === "/",
  "the empty base is the whole safety argument: a merchant's storefront must render exactly what it did before"
);
check(
  "a demo's links stay in the demo",
  storeHref("/theme-store/kite", "/shop") === "/theme-store/kite/shop" &&
    storeHref("/theme-store/kite", "/") === "/theme-store/kite"
);
check(
  "nothing is prefixed twice",
  storeHref("/theme-store/kite", "/theme-store/kite/shop") === "/theme-store/kite/shop" &&
    storeHref("/theme-store/kite", "/theme-store/loom") === "/theme-store/loom",
  "the demo bar links to the other theme's demo, which is already absolute"
);
check(
  "links that leave are left alone",
  storeHref("/theme-store/kite", "https://example.com") === "https://example.com" &&
    storeHref("/theme-store/kite", "mailto:a@b.c") === "mailto:a@b.c" &&
    storeHref("/theme-store/kite", "//cdn.example.com/x") === "//cdn.example.com/x" &&
    storeHref("/theme-store/kite", "#top") === "#top"
);

/* ------------------------------------- 4. every storefront link goes through it */

{
  const files = [
    "components/storefront/site-header.tsx",
    "components/storefront/site-footer.tsx",
    "components/storefront/product-card.tsx",
    "components/storefront/cart-page-client.tsx",
    "components/storefront/sections/category-grid.tsx",
    "components/storefront/sections/collection-showcase.tsx",
    "components/storefront/sections/layout-bits.tsx",
  ];
  for (const f of files) {
    const src = read(f);
    check(
      `${f.split("/").pop()} links through StoreLink`,
      /StoreLink as Link/.test(src) && !/^import Link from "next\/link";$/m.test(src),
      "a raw next/link on the storefront is a link that escapes the demo on the first click"
    );
  }

  const layout = read("app/(storefront)/layout.tsx");
  check(
    "the storefront provides the base",
    /<StoreBaseProvider base=\{await storeBase\(\)\}>/.test(layout),
    "without the provider every link falls back to the empty base and the demo leaks on click"
  );
  check(
    "and says which demo it is",
    /<ThemeDemoBar/.test(layout),
    "a believable demo shop with nothing saying so is a shop somebody thinks is real"
  );
}

/* ------------------------------------- 5. Preview means three things ----- */

{
  const page = stripComments(read("app/admin/theme/page.tsx"));

  check(
    "Active Theme opens the shop's own address",
    /storeUrl=\{storeUrl\}/.test(page),
    "the live site is the live site; a ?__theme= on it implies a preview of what is already there"
  );
  check(
    "All Themes opens the shop wearing that copy",
    /previewUrl: `\$\{storeUrl\}\?__theme=\$\{r\.id\}`/.test(page),
    "by copy id, never by theme key — two copies of KITE are both KITE"
  );
  check(
    "Theme Store opens our demo",
    /themeStorePath\(t\.key\)/.test(page) && /appUrl\(demo\)/.test(page),
    "previewing an unowned theme through the merchant's own catalogue judges the theme on their photography"
  );

  const manager = stripComments(read("components/admin/theme-manager.tsx"));
  check(
    "and the live section never falls back to a store card's link",
    /StorefrontStill url=\{storeUrl\}/.test(manager) && !/url=\{liveTheme\.previewUrl\}/.test(manager),
    "on a shop running a theme it holds no copy of, liveTheme falls back to the store card — whose preview is now somebody else's demo"
  );
}

/* ------------------------------------- 6. Add brings no demo content ----- */

{
  const install = stripComments(read("app/admin/theme/actions-theme-choice.ts"));
  const body = install.slice(install.indexOf("export async function installTheme"), install.indexOf("export async function updateTheme"));
  check(
    "Add creates a theme row and nothing else",
    !/product\.|category\.|mediaAsset\.|section\.createMany/.test(body),
    "adding a theme must not bring the demo's products — the merchant would have to delete forty things before opening"
  );
  check(
    "and it is still one row per press",
    /installedTheme\.create\(/.test(body) && !/installedTheme\.upsert\(/.test(body),
    "upsert made the second Add find the first row and report success"
  );
}

/* ------------------------------------- 7. a demo is not a shop ----------- */

{
  const orders = stripComments(read("app/api/orders/route.ts"));
  check(
    "a demo refuses orders",
    /isDemoShop\(/.test(orders),
    "a demo that took orders would write real rows and mail a merchant who does not exist"
  );

  const enquiry = stripComments(read("app/enquiry/actions.ts"));
  check("a demo refuses enquiries", /isDemoShop\(/.test(enquiry));

  const layout = stripComments(read("app/(storefront)/layout.tsx"));
  check(
    "a demo records no visits",
    /if \(visiting && !demo\)/.test(layout),
    "these pages are crawled on purpose; a row per crawl is analytics nobody reads"
  );
  check(
    "and its raw subdomain never serves",
    /guardDemoShop\(\)/.test(layout),
    "kite-demo.app.synoradigitals.com would otherwise be a second address for the same page"
  );

  const canonical = stripComments(read("lib/canonical.ts"));
  check(
    "the redirect off that subdomain is permanent",
    /permanentRedirect\(/.test(canonical.slice(canonical.indexOf("export async function guardDemoShop"))),
    "a 307 tells a search engine to keep the old address indexed"
  );
  check(
    "and the theme store is the one storefront allowed on our host",
    /themeStoreContext\(\)\) return;/.test(canonical),
    "guardShopHost 404s a storefront on the application host; the demo has to be the exemption"
  );
}

/* ------------------------------------- 8. it is findable ----------------- */

{
  const sitemap = stripComments(read("app/sitemap.ts"));
  check(
    "the demos are in the platform's sitemap",
    /DEMO_SLUGS\.map/.test(sitemap),
    "they are indexed on purpose, so they have to be offered"
  );
  check(
    "and a demo publishes no sitemap of its own",
    /isDemoShop\(shop\.subdomain\)\) return \[\]/.test(sitemap),
    "that one would advertise the raw subdomain this feature keeps out of the index"
  );

  const layout = read("app/(storefront)/layout.tsx");
  check(
    "a demo page carries its own canonical",
    /alternates: \{ canonical: base \}/.test(layout),
    "left to the shop's metadata it would name kite-demo.app.synoradigitals.com"
  );
}

/* ------------------------------------- 9. the name cannot be claimed ----- */

{
  const context = stripComments(read("lib/shop-context.ts"));
  check(
    "no merchant can sign up as a demo shop",
    /endsWith\("-demo"\)/.test(context),
    `${demoSubdomain("kite")} has to stay ours`
  );
  check(
    "but a demo host still resolves to its shop",
    !/"kite-demo"/.test(context),
    "in RESERVED_SUBDOMAINS it would classify as the platform, and the redirect off it would never run"
  );
}

/* ------------------------------------- 10. our headers are not a public API */

{
  const proxy = stripComments(read("proxy.ts"));

  check(
    "the proxy strips its own headers off the incoming request",
    /headers\.delete\(SHOP_ID_HEADER\)/.test(proxy) &&
      /headers\.delete\(DEMO_SHOP_HEADER\)/.test(proxy),
    "a header is not a private channel: sending x-shp-shop yourself chose which shop was rendered, confirmed against a running build"
  );
  check(
    "and every path that talks to the render goes through the stripping",
    (proxy.match(/new Headers\(req\.headers\)/g) ?? []).length === 1,
    "a second place copying req.headers straight through reopens it for whichever routes use that one"
  );
  check(
    "the demo shop is named after the strip, never before",
    proxy.indexOf("headers.delete(DEMO_SHOP_HEADER)") <
      proxy.indexOf("headers.set(DEMO_SHOP_HEADER"),
    "setting it first and deleting after would erase the proxy's own answer"
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
