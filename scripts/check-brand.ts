/**
 * Checks a shop's marks are its own — `npm run check:brand`.
 *
 * A logo is identity, not style. It used to live in the theme's tokens, which
 * are stored per business type, so a merchant who switched from a shop to a
 * restaurant lost their logo, and lost it again switching back — the same
 * company, the same artwork, two storefronts each holding half of it.
 *
 * Four ways that arrangement can quietly come back:
 *
 *   A second place to set one. The whole point is that Home is the only
 *   screen that writes a mark. A control anywhere else — the theme panel, the
 *   customizer — means two answers to "what is my logo" and no way to tell
 *   which won.
 *
 *   A gap in the fallback. A theme may ask for any of the four combinations,
 *   and must never be handed nothing when the merchant has uploaded
 *   *something*. The order is chosen, not obvious: shape beats colour, because
 *   a wordmark that does not fit is illegible while one in the wrong tone is
 *   merely wrong.
 *
 *   The platform's own artwork on a merchant's storefront. Before this, a shop
 *   with no logo rendered /logo.svg — ours — in its header, while Home told
 *   the merchant their store name would be used instead.
 *
 *   A favicon a browser will not draw. WebP previews perfectly in the panel
 *   and renders as a blank square on a tab, which is a fault nobody can
 *   diagnose from inside the product.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import {
  BRAND_MARKS_DEFAULTS,
  FAVICON_FORMATS,
  type BrandMarks,
  faviconProblem,
  faviconType,
  pickLogo,
  toBrandMarks,
} from "../lib/brand-marks";
import { isDarkBackground } from "../lib/contrast";

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

const marks = (over: Partial<BrandMarks> = {}): BrandMarks => ({
  ...BRAND_MARKS_DEFAULTS,
  ...over,
});

// ---------------------------------------------------------------------------
// Every combination resolves to something, and to the right something
// ---------------------------------------------------------------------------

const FULL = marks({
  logoUrl: "main",
  logoDarkUrl: "dark",
  logoCompactUrl: "compact",
  logoCompactDarkUrl: "compactDark",
});

check("wide on light picks the main mark", pickLogo(FULL) === "main");
check("wide on dark picks the dark mark", pickLogo(FULL, { dark: true }) === "dark");
check("compact on light picks the compact mark", pickLogo(FULL, { compact: true }) === "compact");
check(
  "compact on dark picks the compact dark mark",
  pickLogo(FULL, { dark: true, compact: true }) === "compactDark"
);

// With only a main mark, everything falls back to it rather than to nothing.
const ONLY_MAIN = marks({ logoUrl: "main" });
for (const request of [{}, { dark: true }, { compact: true }, { dark: true, compact: true }]) {
  check(
    `only a main mark still answers ${JSON.stringify(request)}`,
    pickLogo(ONLY_MAIN, request) === "main"
  );
}

// The chosen order, stated as tests so changing it is a decision.
check(
  "compact+dark prefers the compact mark over the dark one",
  pickLogo(marks({ logoUrl: "main", logoDarkUrl: "dark", logoCompactUrl: "compact" }), {
    dark: true,
    compact: true,
  }) === "compact",
  "shape beats colour: a wordmark that does not fit is illegible, one in the wrong tone is merely wrong"
);
check(
  "compact+dark falls to the dark mark when there is no compact one",
  pickLogo(marks({ logoUrl: "main", logoDarkUrl: "dark" }), { dark: true, compact: true }) === "dark"
);
check(
  "a compact mark is not used on a wide screen",
  pickLogo(marks({ logoUrl: "main", logoCompactUrl: "compact" })) === "main"
);
check(
  "a dark mark is not used on a light background",
  pickLogo(marks({ logoUrl: "main", logoDarkUrl: "dark" })) === "main"
);

// Whitespace is not a logo.
check("a slot of spaces counts as empty", pickLogo(marks({ logoUrl: "   " })) === "");
check("nothing uploaded returns nothing", pickLogo(marks()) === "");

// ---------------------------------------------------------------------------
// Nothing hands back the platform's artwork
// ---------------------------------------------------------------------------

const logo = read("components/ui/logo.tsx");
check(
  "the logo falls back to the shop's name when given one",
  /fallbackText/.test(logo),
  "without it an empty logo rendered BUILTIN_LOGO — this platform's mark — on a merchant's storefront"
);
check(
  "the built-in mark is only for callers that pass no name",
  /if \(fallbackText\) \{/.test(logo)
);

const header = read("components/storefront/site-header.tsx");
const footer = read("components/storefront/site-footer.tsx");
check("the storefront header passes the shop's name", /storeName/.test(header));
check("so does the footer", /storeName/.test(footer));
check(
  "the header renders both marks and lets CSS choose",
  /sm:hidden/.test(header) && /hidden sm:inline-block/.test(header),
  "measuring the window in JavaScript would ship one mark, hydrate, and swap — a flicker on the first thing anyone sees of the shop"
);

// ---------------------------------------------------------------------------
// One place to set a mark
// ---------------------------------------------------------------------------

const themeSchema = read("lib/theme-schema.ts");
check(
  "the theme panel has no logo upload",
  !/kind: "logo"/.test(themeSchema),
  "logos are set on Home; a second control means two answers and no way to tell which won"
);
check("the theme panel has no favicon upload", !/kind: "favicon"/.test(themeSchema));
check(
  "the theme still owns how a mark is drawn",
  /logoHeight/.test(themeSchema) && /logoColor/.test(themeSchema),
  "height and tint are presentation, which is the theme's job"
);

const tokens = read("lib/theme-tokens.ts");
check(
  "the theme tokens no longer carry the images",
  !/^\s*logoUrl:/m.test(tokens) && !/^\s*faviconUrl:/m.test(tokens)
);

const identity = read("app/admin/identity-actions.ts");
check("the identity action writes the marks", /\.\.\.marks/.test(identity));
check(
  "and no longer writes the theme",
  !/themeSettings\.upsert/.test(identity),
  "it used to store the logo among the theme's tokens"
);
check(
  "it invalidates the settings cache as well as the theme",
  /invalidateShop\(shopId, "settings"\)/.test(identity),
  "the storefront reads the marks from settings; a stale copy shows the wrong header for five minutes"
);

// No other server action may write a mark.
const SKIP = new Set(["node_modules", ".git", ".next", ".claude", "generated", "migrations"]);
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

const MARK_COLUMNS = /\b(logoUrl|logoDarkUrl|logoCompactUrl|logoCompactDarkUrl|faviconUrl)\s*:/;
const WRITERS = ["app/admin/identity-actions.ts"];
for (const file of walk(join(ROOT, "app"))) {
  const rel = relative(ROOT, file);
  if (WRITERS.includes(rel)) continue;
  const src = readFileSync(file, "utf8");
  // A write is one of those columns inside a settings update.
  const writes =
    /storeSettings\.(upsert|update|updateMany)/.test(src) && MARK_COLUMNS.test(src);
  check(`${rel} does not write a mark`, !writes, "Home is the only screen that may");
}

// ---------------------------------------------------------------------------
// The favicon
// ---------------------------------------------------------------------------

for (const good of ["/uploads/brand/icon.png", "/a/b.SVG", "https://cdn.example.com/x.ico", ""]) {
  check(`"${good}" is accepted as a favicon`, faviconProblem(good) === null);
}
for (const bad of [
  "/uploads/brand/icon.webp",
  "/uploads/brand/icon.jpg",
  "/uploads/brand/icon.avif",
  "/uploads/brand/icon.gif",
]) {
  check(`"${bad}" is refused`, faviconProblem(bad) !== null, "it uploads fine and never draws");
}
check("the refusal names the formats", (faviconProblem("/x.webp") ?? "").includes("SVG"));

check("svg declares its type", faviconType("/x.svg") === "image/svg+xml");
check("png declares its type", faviconType("/x.png") === "image/png");
check("ico declares its type", faviconType("/x.ico") === "image/x-icon");
check("every accepted format has a declared type", FAVICON_FORMATS.every((e) => faviconType(`/x${e}`) !== undefined));

const identityForm = read("components/admin/store-identity-form.tsx");
check(
  "the favicon field narrows what can be chosen",
  /accept=\{FAVICON_ACCEPT\}/.test(identityForm)
);
const imageField = read("components/admin/single-image-field.tsx");
check(
  "and a dropped file is held to the same rule",
  /function allowed\(file: File\)/.test(imageField),
  "accept on a file input is a filter, not a rule — dragging a file in bypasses it"
);

// ---------------------------------------------------------------------------
// Reading a settings row, and the defaults matching the schema
// ---------------------------------------------------------------------------

check(
  "a row missing the columns reads as empty rather than undefined",
  JSON.stringify(toBrandMarks({})) === JSON.stringify(BRAND_MARKS_DEFAULTS)
);
check(
  "a non-string value is ignored",
  toBrandMarks({ logoUrl: 42 }).logoUrl === ""
);

const schema = read("prisma/schema.prisma");
for (const column of Object.keys(BRAND_MARKS_DEFAULTS)) {
  const declared = new RegExp(`${column}\\s+String\\s+@default\\("([^"]*)"\\)`).exec(schema)?.[1];
  check(`${column} is a defaulted column on StoreSettings`, declared === "");
}

// ---------------------------------------------------------------------------
// Darkness is decided once
// ---------------------------------------------------------------------------

check("a near-black header counts as dark", isDarkBackground("#111111"));
check("a near-white header does not", !isDarkBackground("#f8f5f1"));
check("the brand's own dark red counts as dark", isDarkBackground("#4c100f"));
check("the tan secondary does not", !isDarkBackground("#d4bea7"));

const layout = read("app/(storefront)/layout.tsx");
check(
  "the storefront asks brand-marks rather than reaching for a token",
  /pickLogo\(marks/.test(layout) && !/tokens\.logoUrl/.test(layout)
);
check(
  "the header and footer are resolved against their own backgrounds",
  /isDarkBackground\(tokens\.headerBackground\)/.test(layout) &&
    /isDarkBackground\(tokens\.footerBackground\)/.test(layout),
  "a header and footer of different darknesses need different marks"
);
check("the favicon declares its type in the metadata", /faviconType\(favicon\)/.test(layout));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
