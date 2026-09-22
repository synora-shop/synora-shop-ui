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
  /themeTokens\(key\)/.test(actions) && /themeLayout\(key\)/.test(actions)
);
check(
  "and clears only the copy being reset",
  /installedTheme\.updateMany\(\{[\s\S]{0,120}where: \{ id \}/.test(actions),
  "with two copies of one theme in the library, 'this theme's edits' is not specific enough to promise that"
);
check(
  "saving writes to one copy, not to the shop and not to the theme",
  /installedTheme\.updateMany\(\{\s*where: \{ id \}/.test(actions) &&
    !/themeSettings\.upsert[\s\S]{0,200}tokens: clean/.test(actions),
  "keyed by theme it wrote to every copy, so editing a draft repainted the live storefront"
);
check(
  "and refuses when the theme is no longer in the library",
  /updated\.count === 0/.test(actions),
  "a customizer left open on a theme removed in another tab"
);

const data = read("lib/data/theme.ts");
check("the storefront resolves a layout per request", /getThemeLayout/.test(data));
check(
  "a previewed design shows its own arrangement and its own edits",
  /themeForRequest\(shop\.id, shop\.businessType\)/.test(data) &&
    /installed\.find\(\(r\) => r\.id === preview\)/.test(data),
  "a preview of Atlas wearing the header you chose on Aurora is a preview of neither"
);
check(
  "and a preview outranks the live design for that request only",
  /if \(preview\) \{[\s\S]{0,400}\}\s*\n\s*const key = settings\?\.themeKey/.test(data),
  "nothing is stored, so no cached page can be left wearing somebody's preview"
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
  "activating is refused for a copy the shop does not have",
  /if \(!copy\) return \{ ok: false/.test(choice),
  "otherwise the library is decoration and one click still changes the live store"
);
check(
  "removing the live copy is refused",
  /This is the copy your store is using/.test(choice),
  "a shop rendering a design it does not have is a state with no honest screen"
);
// The live *copy*, not the live theme. A shop with two copies of KITE may
// remove the one it is not wearing; asking about the theme refused both.
check(
  "and it is the copy that is checked, not the theme",
  /settings\?\.installedThemeId === copyId/.test(choice),
  "asking by theme refused to remove a spare copy on the grounds that another one was live"
);
check(
  "adding a theme meant for another kind of store is refused",
  /is not made for this kind of store/.test(choice),
  "a blog theme on a shop renders sections the shop has no content for"
);
// Add makes a copy, every time. It used to upsert on (shop, theme), so the
// second Add found the first row, wrote nothing, and reported success — a
// merchant asking for a second copy got a toast saying they had one.
check(
  "adding makes a new copy rather than finding the old one",
  /installedTheme\.create\(\{/.test(choice) && !/installedTheme\.upsert/.test(choice),
  "two copies of one theme, each with its own edits, is what the library is for"
);
check(
  "a copy is sealed at the version that ships today",
  /data: \{ shopId: shop\.id, themeKey, version: theme\.version \}/.test(choice),
  "a copy added in August staying at August's version is what makes Update mean anything"
);
check(
  "adding changes nothing a customer can see",
  (() => {
    const body = choice.slice(
      choice.indexOf("export async function installTheme"),
      choice.indexOf("export async function updateTheme")
    );
    return (
      body.includes('revalidatePath("/admin/theme")') &&
      !body.includes("invalidateShop") &&
      !body.includes('revalidatePath("/", "layout")')
    );
  })(),
  "it refreshes the admin screen and nothing else"
);

// The screen, as drawn in APP themes.ai — see docs/PANEL.md §2. It replaced
// theme-gallery.tsx on 22 September, and that file was deleted rather than
// left: a component nothing renders, still held up by checks, is the worst of
// both — it reads as covered and proves nothing about what a merchant sees.
const gallery = read("components/admin/theme-manager.tsx");
check(
  "the screen separates what is live, what is owned, and what exists",
  /"Active Theme"/.test(gallery) && /"All Themes"/.test(gallery) && /"Theme Store"/.test(gallery)
);
check(
  "nothing in the store can go live in one press",
  !/Theme Store[\s\S]{0,2000}chooseTheme/.test(gallery),
  "a store card offers Add, and Add is not Activate"
);
check(
  "the live theme is not offered the button that would make it live",
  /isLive \?[\s\S]{0,400}chooseTheme/.test(gallery) === false ||
    /isLive \? \([\s\S]{0,200}Active/.test(gallery),
  "Activate on the theme that is already active is a control that does nothing"
);
check(
  "an empty library says what to do rather than nothing",
  /have not added a theme yet/.test(gallery)
);
check(
  "the update is offered only when there is one",
  /outOfDate = copy\.version !== copy\.latest/.test(gallery) && /outOfDate && \(/.test(gallery),
  "an Update offered for nothing teaches a merchant to ignore the next one"
);
// The store offers every theme, always — including ones already in the
// library. Add is not "own this", it is "give me another copy".
check(
  "the store offers a theme the shop already has",
  (() => {
    const page = read("app/admin/theme/page.tsx");
    // Built from every theme for this business type, never filtered by what
    // the shop owns — Add means "another copy", so filtering owned themes out
    // makes a second copy unreachable.
    return /store=\{available\.map/.test(page) && !/!.*installed/.test(page);
  })(),
  "filtering owned themes out of the store makes a second copy unreachable"
);
check(
  "and adding says how many the shop now has",
  /You now have \$\{count\}/.test(choice),
  "pressing Add on something you have is not a mistake, but it should not be a silent one"
);
// The plate is a Synora colour, not the theme's own. The store is a Synora
// screen showing what is on offer; the plate says "this is a theme" and the
// picture on it says which.
for (const theme of Object.values(THEMES)) {
  check(
    `${theme.key} sits on a plate`,
    /^#[0-9a-f]{6}$/i.test(theme.plate.from) && /^#[0-9a-f]{6}$/i.test(theme.plate.to)
  );
}
check(
  "and the card is the plate rather than a white box on it",
  /linear-gradient\(180deg, \$\{theme\.plate\.from\}/.test(gallery) &&
    /shadow-card/.test(gallery),
  "a white card with a coloured picture in it is not what the store draws"
);

// Versions. The platform's is in the registry beside the theme; the shop's is
// on its own row. Out of date is the two differing — a comparison, so nothing
// has to be written to every shop when a design changes.
for (const theme of Object.values(THEMES)) {
  check(`${theme.key} declares a version`, /^\d+\.\d+\.\d+$/.test(theme.version), theme.version);
}
{
  const schema = read("prisma/schema.prisma");
  check(
    "a shop records the version it has",
    /model InstalledTheme[\s\S]*?version String @default/.test(schema)
  );
  const actions = read("app/admin/theme/actions-theme-choice.ts");
  check("there is an action that moves it forward", /export async function updateTheme/.test(actions));
  check(
    "updating writes the version and nothing else",
    /updateTheme[\s\S]*?data: \{ version: theme\.version \}/.test(actions),
    "the merchant's edits are differences on top; rewriting them here would destroy them"
  );
  check(
    "adding is a new copy, never an update to an existing one",
    /installedTheme\.create/.test(actions) && !/installedTheme\.upsert/.test(actions),
    "pressing Add asks for another copy, not to be moved onto a new version of the one you have"
  );
  check(
    "and every action names a copy rather than a theme",
    /updateTheme\(copyId: string\)/.test(actions) &&
      /removeTheme\(copyId: string\)/.test(actions) &&
      /chooseTheme\(copyId: string\)/.test(actions),
    "two copies of KITE are both KITE; a key cannot say which one a button means"
  );
}

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
  /StorefrontStill url=\{(?:theme|live)\.previewUrl\}/.test(gallery),
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
/*
 * The preview must NOT lock scrolling, and that is the assertion.
 *
 * It did, briefly. The reasoning was that the customizer already brings the
 * section being edited into view, so scrolling by hand was never the movement
 * that mattered. Only using it showed the gap: the auto-scroll fires when a
 * section's settings change, and *adding* one changes no settings — so a new
 * section landed below the fold and the preview would not move. A page 3,039px
 * tall in an 867px window, 2,172 of it unreachable.
 *
 * The auto-scroll is fixed at its own end. Scrolling stays as the fallback,
 * because a working surface should not have exactly one way to reach things.
 */
check(
  "the preview does not lock scrolling",
  !/overflow = "hidden"/.test(guard),
  "locking it left a merchant unable to reach a section they had just added"
);
check(
  "every section operation brings the result into view",
  (() => {
    const cust = read("components/customizer/customizer.tsx");
    // Editing, adding, duplicating and moving. All four, or the fallback that
    // scrolling provides is doing work the tool should be doing itself.
    return (cust.match(/setChanged\(\{ sectionId/g) ?? []).length >= 4;
  })(),
  "adding a section used to select it without ever showing it"
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

console.log("\nTHE DOCUMENT STILL DESCRIBES THE CODE");
// docs/THEMES.md is what gets read before anyone touches a theme, and a
// document that has drifted is worse than none: it is confidently wrong about
// a system nobody re-reads the source of. Same idea as check:design, narrower
// subject — it must name what actually ships.
{
  const doc = read("docs/THEMES.md");
  check("the document exists", doc.length > 0);
  for (const group of THEME_GROUPS) {
    check(`it names the "${group.title}" settings group`, doc.includes(group.title));
  }
  for (const theme of Object.values(THEMES)) {
    check(`it names ${theme.name}`, doc.includes(theme.name));
  }
  // A theme's key is what every storefront has stored. Renaming the display
  // name is free; renaming a key drops every shop running it back to a
  // default, which is why the type calls the key "stable across renames" and
  // why the 22 September rename touched only `name`.
  check(
    "the keys are the ones storefronts already store",
    ["aurora", "atlas"].every((k) => k in THEMES),
    "a renamed key is every shop on that theme silently losing its design"
  );
  check(
    "it names the three layers a look resolves through",
    doc.includes("THEME_TOKEN_DEFAULTS") &&
      doc.includes("ThemeDefinition.tokens") &&
      doc.includes("InstalledTheme.tokens")
  );
  check(
    "it records that the platform floor is still another brand's palette",
    doc.includes("#4c100f"),
    "the fault is deliberately unfixed; an undocumented deliberate fault is just a bug"
  );
  check(
    "the files it tells you to read further are there",
    ["lib/themes/registry.ts", "lib/theme-tokens.ts", "lib/theme-schema.ts"].every(
      (f) => doc.includes(f) && existsSync(join(process.cwd(), f))
    )
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
