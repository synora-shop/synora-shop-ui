/**
 * Checks a theme is more than a palette — `npm run check:themes`.
 *
 * It was one. `ThemeDefinition` had `tokens` and nothing else, no storefront
 * component read the theme at all, and Aurora and Meridian rendered
 * byte-identical HTML: same header, same card, same grid, same footer, with
 * different CSS custom properties. A merchant choosing between them was
 * choosing a colour scheme with two names, while the Themes screen offered it
 * as a change of storefront.
 *
 * What is held up here:
 *
 *   1. Every theme is registered correctly and offers sections that exist.
 *   2. At least one theme actually arranges the storefront differently, so the
 *      registry's second half is not decorative.
 *   3. The defaults are exactly the old storefront, so an untouched shop is
 *      untouched.
 *   4. Every variant a theme names is implemented in the component that owns
 *      that slot — a theme cannot ask for a header nobody drew.
 *   5. The merchant can reach all of it from the customizer.
 *   6. Nothing stores a resolved layout, which would freeze today's theme into
 *      a merchant's row.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { SECTION_TYPES } from "../lib/section-schema";
import { THEME_GROUPS } from "../lib/theme-schema";
import { THEMES, themeFor, themeLayout, themeTokens } from "../lib/themes/registry";
import {
  CARD_ASPECT,
  CARD_LAYOUTS,
  FOOTER_LAYOUTS,
  GRID_CLASSES,
  GRID_DENSITIES,
  HEADER_LAYOUTS,
  THEME_FEATURES,
  THEME_LAYOUT_DEFAULTS,
  layoutChanges,
  resolveThemeLayout,
} from "../lib/theme-layout";

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

// ---------------------------------------------------------------------------
console.log("EVERY THEME IS REGISTERED PROPERLY");
// ---------------------------------------------------------------------------

for (const [key, theme] of Object.entries(THEMES)) {
  check(`${key} is keyed by its own key`, theme.key === key, `${theme.key} vs ${key}`);
  check(`${key} has a name and a line about it`, !!theme.name && theme.description.length > 10);
  check(`${key} says who it is for`, theme.businessTypes.length > 0);
  check(
    `${key} offers only sections that exist`,
    theme.sections.every((s) => SECTION_TYPES.includes(s)),
    theme.sections.filter((s) => !SECTION_TYPES.includes(s)).join(", ")
  );
  check(`${key} offers at least one section`, theme.sections.length > 0);
}

check(
  "an unknown key falls back rather than breaking a storefront",
  themeFor("no-such-theme").key === "aurora",
  "refusing would take a shop offline over a string"
);

// ---------------------------------------------------------------------------
console.log("\nA THEME ARRANGES, NOT ONLY PAINTS");
// ---------------------------------------------------------------------------

const arranging = Object.values(THEMES).filter((t) => t.layout && Object.keys(t.layout).length > 0);
check(
  "at least one theme changes the storefront's arrangement",
  arranging.length > 0,
  "without one, the layout half of the registry is decoration"
);
check(
  "and it changes more than a single slot",
  arranging.some((t) => Object.keys(t.layout!).length >= 3),
  "swapping one component is a variation, not a theme"
);

// Two ecommerce themes that differ only in colour is the bug this file exists
// because of, so it is asserted directly rather than implied.
const ecom = Object.values(THEMES).filter((t) => t.businessTypes.includes("ecommerce"));
check(
  "the ecommerce themes are not all the same shop in different colours",
  new Set(ecom.map((t) => JSON.stringify(themeLayout(t.key)))).size > 1,
  ecom.map((t) => t.key).join(", ")
);

// ---------------------------------------------------------------------------
console.log("\nAN UNTOUCHED SHOP IS UNTOUCHED");
// ---------------------------------------------------------------------------

check("the default header is the original one", THEME_LAYOUT_DEFAULTS.header === "classic");
check("the default card is the original one", THEME_LAYOUT_DEFAULTS.productCard === "quiet");
check("the default footer is the original one", THEME_LAYOUT_DEFAULTS.footer === "columns");
check(
  "every feature is off by default",
  (Object.keys(THEME_FEATURES) as (keyof typeof THEME_FEATURES)[]).every(
    (f) => THEME_LAYOUT_DEFAULTS[f] === false
  ),
  "a default that switched one on would change a live storefront"
);
check(
  "the original card keeps the shape the storefront always had",
  CARD_ASPECT.quiet === "aspect-[3/4]",
  "the first version made it square and silently reshaped every product on every existing shop"
);
check(
  "and each variant is a different shape",
  new Set(Object.values(CARD_ASPECT)).size === Object.keys(CARD_ASPECT).length,
  "two variants that render identically are one variant with two names"
);
check(
  "Aurora still arranges nothing",
  !THEMES.aurora.layout || Object.keys(THEMES.aurora.layout).length === 0,
  "it is what every existing shop runs, so it has to stay a no-op"
);

// ---------------------------------------------------------------------------
console.log("\nNOTHING UNRECOGNISED REACHES A COMPONENT");
// ---------------------------------------------------------------------------

const junk = resolveThemeLayout({ header: "spaceship", productCard: 7, quickAdd: "yes", nope: 1 });
check("an unknown header falls back", junk.header === "classic");
check("a number where a variant belongs falls back", junk.productCard === "quiet");
check("a string where a switch belongs falls back", junk.quickAdd === false);
check("an unknown key is dropped", !("nope" in junk));
check("nothing means the defaults", JSON.stringify(resolveThemeLayout(undefined)) === JSON.stringify(THEME_LAYOUT_DEFAULTS));
check("null means the defaults", JSON.stringify(resolveThemeLayout(null)) === JSON.stringify(THEME_LAYOUT_DEFAULTS));

check(
  "only a merchant's differences are stored",
  Object.keys(layoutChanges(THEME_LAYOUT_DEFAULTS)).length === 0,
  "storing a resolved layout would freeze today's theme into their row"
);
check(
  "and a real difference is kept",
  layoutChanges({ ...THEME_LAYOUT_DEFAULTS, header: "centred" }).header === "centred"
);

// ---------------------------------------------------------------------------
console.log("\nEVERY VARIANT IS ACTUALLY DRAWN");
// ---------------------------------------------------------------------------

const header = read("components/storefront/site-header.tsx");
const card = read("components/storefront/product-card.tsx");
const footer = read("components/storefront/site-footer.tsx");

for (const variant of Object.keys(HEADER_LAYOUTS)) {
  // "classic" is the fallback branch rather than a named one, so it counts as
  // drawn if the component knows the mode at all.
  check(
    `the header draws "${variant}"`,
    variant === "classic" ? /mode === "classic"/.test(header) : new RegExp(`"${variant}"`).test(header),
    "a theme cannot ask for a header nobody drew"
  );
}
check(
  "the centred header still keeps its tools on the right",
  /mode === "centred" && "lg:ml-auto"/.test(header),
  "the logo leaves the flex flow there, and the tools slid to the left edge"
);
for (const variant of Object.keys(CARD_LAYOUTS)) {
  check(
    `the card draws "${variant}"`,
    variant === "quiet" ? /THEME_LAYOUT_DEFAULTS.productCard/.test(card) : new RegExp(`"${variant}"`).test(card)
  );
}
for (const variant of Object.keys(FOOTER_LAYOUTS)) {
  check(
    `the footer draws "${variant}"`,
    variant === "columns" ? /THEME_LAYOUT_DEFAULTS.footer/.test(footer) : new RegExp(`"${variant}"`).test(footer)
  );
}
for (const density of Object.keys(GRID_DENSITIES)) {
  check(`the grid has classes for "${density}"`, !!GRID_CLASSES[density as keyof typeof GRID_CLASSES]);
}
check(
  "grid classes are written out, not built from a string",
  !/`[^`]*grid-cols-\$\{/.test(read("lib/theme-layout.ts")),
  "Tailwind only ships the classes it can see in the source"
);
check(
  "the grid sets spacing and leaves the column count alone",
  !/grid-cols/.test(JSON.stringify(GRID_CLASSES)),
  "how many fit across a row is already a merchant setting; two switches for one thing is the bug"
);

// ---------------------------------------------------------------------------
console.log("\nTHE FEATURES ARE REAL");
// ---------------------------------------------------------------------------

check("hover swap is drawn", /hoverImage/.test(card) && /group-hover:opacity-100/.test(card));
check(
  "and needs no JavaScript",
  !/useState|onMouseEnter/.test(card),
  "on a phone, where there is no hover, the second image simply never shows"
);
check("quick add exists", /QuickAdd/.test(card));
check(
  "quick add refuses a product with a choice to make",
  /product\.variants\.length === 1/.test(card),
  "a button that quietly picks a size is worse than an extra click"
);
check(
  "quick add does not navigate away",
  /e\.preventDefault\(\)/.test(read("components/storefront/quick-add.tsx")),
  "the card is a link; without this it adds the item and leaves the grid"
);
check("swatches are drawn", /swatches/.test(card));
check(
  "and are capped",
  /\.slice\(0, 5\)/.test(card),
  "twenty dots say nothing and wreck the row"
);
const panel = read("components/storefront/product-purchase-panel.tsx");
check("the sticky bar exists", /stickyBuyBar/.test(panel));
check(
  "it watches the real buttons rather than a scroll position",
  /IntersectionObserver/.test(panel),
  "the distance depends on the page, so a fixed threshold is wrong on most of them"
);
check(
  "and stays off the desktop",
  /lg:hidden/.test(panel.slice(panel.indexOf("stickyBuyBar && buyRowGone"))),
  "there the buttons sit beside the photo and rarely leave the view"
);

// ---------------------------------------------------------------------------
console.log("\nTHE MERCHANT CAN REACH IT");
// ---------------------------------------------------------------------------

/*
 * Asserted against the resolved field list rather than the source text.
 *
 * The first version grepped lib/theme-schema.ts for each key and failed on
 * every feature — they are generated from THEME_FEATURES, so their names never
 * appear literally in that file. The regex was testing how the list is written
 * instead of what it contains, which is the weaker of the two questions and the
 * wrong one: a field added by hand and a field generated in a loop are equally
 * present to a merchant.
 */
const offered = new Set(THEME_GROUPS.flatMap((g) => g.fields.map((f) => f.key)));
for (const slot of ["header", "productCard", "grid", "footer"]) {
  check(`the customizer offers "${slot}"`, offered.has(slot));
}
for (const feature of Object.keys(THEME_FEATURES)) {
  check(`the customizer offers "${feature}"`, offered.has(feature));
}
check(
  "every layout key is reachable from the panel",
  Object.keys(THEME_LAYOUT_DEFAULTS).every((k) => offered.has(k)),
  Object.keys(THEME_LAYOUT_DEFAULTS).filter((k) => !offered.has(k)).join(", ")
);
check(
  "and every choice it offers is one the storefront understands",
  THEME_GROUPS.flatMap((g) => g.fields)
    .filter((f) => f.key in THEME_LAYOUT_DEFAULTS && f.kind === "select")
    .every((f) => (f.options ?? []).every((o) => {
      const probe = resolveThemeLayout({ [f.key]: o.value }) as Record<string, unknown>;
      return probe[f.key] === o.value;
    })),
  "a dropdown offering a variant the validator rejects silently does nothing"
);
const actions = read("app/admin/theme/actions.ts");
check(
  "saving splits the panel into its two columns",
  /resolveThemeTokens\(tokens\)/.test(actions) && /resolveThemeLayout\(tokens\)/.test(actions)
);
check(
  "resetting keeps the theme the merchant chose",
  !/themeSettings\.deleteMany/.test(actions),
  "deleting the row took themeKey with it and quietly dropped the shop back to Aurora"
);
check(
  "and returns the theme's own look, not the platform's",
  /themeTokens\(row\?\.themeKey\)/.test(actions)
);

const data = read("lib/data/theme.ts");
check("the storefront resolves a layout per request", /getThemeLayout/.test(data));
check(
  "a previewed theme shows its own arrangement",
  /preview \? \{\} :/.test(data),
  "otherwise a preview of Atlas wears the header you chose on Aurora, and is a preview of neither"
);

// ---------------------------------------------------------------------------
console.log("\nADDING AND PUBLISHING ARE TWO ACTS");
// ---------------------------------------------------------------------------

/*
 * The screen used to have one button, and it changed the live storefront.
 * Browsing six designs was one click away from putting an untried one in front
 * of customers, and there was nowhere to keep a design being worked on.
 */
const choice = read("app/admin/theme/actions-theme-choice.ts");
check("a theme can be added to a shop's library", /export async function installTheme/.test(choice));
check("and removed from it", /export async function removeTheme/.test(choice));
check(
  "publishing is refused for a theme that was never added",
  /if \(!installed\)/.test(choice),
  "otherwise the library is decoration and one click still changes the live store"
);
check(
  "removing the live theme is refused",
  /This is the theme your store is using/.test(choice),
  "a shop rendering a theme it does not have is a state with no honest screen"
);
check(
  "adding a theme meant for another kind of store is refused",
  /is not made for this kind of store/.test(choice),
  "a blog theme on a shop renders sections the shop has no content for"
);
check(
  "re-adding does not reset when it was added",
  /update: \{\},/.test(choice),
  "'Added 3 weeks ago' is how a merchant tells two half-tried designs apart"
);
check(
  "adding changes nothing a customer can see",
  !/invalidateShop[\s\S]{0,80}installTheme/.test(choice) &&
    /revalidatePath\("\/admin\/theme"\);\n  return \{ ok: true, message: `\$\{theme\.name\} was added/.test(choice),
  "it refreshes the admin screen and nothing else"
);

const gallery = read("components/admin/theme-gallery.tsx");
check(
  "the screen separates what is live, what is owned, and what exists",
  /Your themes/.test(gallery) && /Discover themes/.test(gallery) && /Live/.test(gallery)
);
check(
  "nothing in the catalogue can go live in one press",
  !/Discover[\s\S]{0,900}chooseTheme/.test(gallery),
  "the Discover cards offer Add, and Add is not Publish"
);
check(
  "an empty library says what to do rather than nothing",
  /Nothing here yet/.test(gallery)
);

/*
 * A theme's own picture.
 *
 * Shot from the shop page rather than the home page: the header, the card
 * shape, the grid density and the colour are the four things that differ
 * between themes and they are all on it, while a home page in a shop without
 * photography is mostly grey rectangles.
 */
for (const theme of Object.values(THEMES)) {
  if (!theme.preview) continue;
  check(
    `${theme.key}'s picture is a file that exists`,
    existsSync(join(ROOT, "public", theme.preview.replace(/^\//, ""))),
    theme.preview
  );
}
check(
  "every ecommerce theme has one",
  ecom.every((t) => !!t.preview),
  ecom.filter((t) => !t.preview).map((t) => t.key).join(", ")
);
check(
  "and a theme without one still shows something",
  /StorefrontStill url=\{theme\.previewUrl\}/.test(gallery),
  "a live frame of the merchant's own storefront, which is what every theme had before"
);

// ---------------------------------------------------------------------------
console.log("\nTHE PREVIEW IS A PREVIEW, NOT A BROWSER");
// ---------------------------------------------------------------------------

/*
 * Here rather than in a script of its own because this is how a merchant looks
 * at a theme, and both faults were found while looking at one.
 *
 * An iframe pointed at the storefront is a working browser window. A merchant
 * could scroll it away from what they were editing, and could click a link and
 * leave the preview — clicking the shop's logo went to `/`, which on the
 * application host redirects to `/admin`, so the admin panel loaded inside the
 * preview pane on the very screen where logos are changed. It read as "the
 * customizer sends you to settings", and it was an anchor doing what anchors do.
 */
const guard = read("components/storefront/preview-guard.tsx");
check("the preview stops the page being scrolled by hand", /overflow = "hidden"/.test(guard));
check(
  "and restores it on the way out",
  /previousHtml/.test(guard) && /previousBody/.test(guard),
  "the guard unmounts on a client navigation; leaving the document locked would be worse than the bug"
);
check("links do not navigate", /event\.preventDefault\(\)/.test(guard) && /a\[href\]/.test(guard));
check("forms do not submit", /"submit"/.test(guard));
check(
  "but selecting a section by clicking still works",
  // The call, not the word: this file's own comment explains why it does not
  // stop propagation, and the first version of this check matched that prose.
  !/\.stopPropagation\(/.test(guard),
  "PreviewSections listens on the same capture phase; stopping propagation would kill selection"
);
check(
  "the guard runs only inside the preview",
  /<PreviewGuard \/>/.test(read("components/storefront/preview-sections.tsx")) &&
    !/PreviewGuard/.test(read("app/(storefront)/layout.tsx")),
  "mounted from PreviewSections, which a customer never renders"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
