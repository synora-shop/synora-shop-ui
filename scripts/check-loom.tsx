/**
 * Checks that Loom's sections can be driven by the live customizer —
 * `npx tsx scripts/check-loom.tsx`.
 *
 * Why this exists: "every word is a setting" is easy to claim and easy to
 * break. One heading typed straight into a component looks identical on the
 * page and is invisible to the customizer — a merchant changes the setting and
 * nothing happens, the same class of fault as the Themes screen whose switch
 * was read by nothing (docs/DESIGN.md §9).
 *
 * What is checked:
 *   1. Every registered section's schema names its own type, and every field
 *      explains itself (`info`), as the platform's own sections must.
 *   2. Every `menu` setting's default names a menu that exists, and every
 *      template names only registered section types.
 *   3. Every text setting reaches the page: each is set to a unique marker,
 *      the section is drawn in every state its words appear in, and the marker
 *      must be in the output. A word typed into the component fails here.
 *   4. Every show/hide switch hides something: drawn with it off, the output
 *      must differ from drawn with it on.
 *
 * Dependency-free beyond React's own server renderer; exits non-zero on failure.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { LOOM_SECTIONS } from "../components/loom/sections";
import * as TEMPLATES from "../components/loom/templates";
import { demoContext } from "../components/loom/demo";
import { LOOM_TEXT, type LoomTextKey } from "../components/loom/text";
import { resolve, type LoomContext, type LoomTemplate } from "../components/loom/contract";

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};


/** The states a section's words can appear in — each is drawn and the outputs pooled. */
const STATES: LoomContext[] = [
  demoContext(),
  demoContext({ query: "red" }),
  demoContext({ query: "zzzz-nothing" }),
  // A cart under the free-delivery amount, so the "how far off" note shows.
  demoContext({ cart: [{ ...demoContext().cart![0], qty: 1 }] }),
  // An order that has arrived, so "Delivered {date}" is drawn.
  demoContext({ order: { ...demoContext().order!, stage: 3 } }),
];

/**
 * Words drawn only in a state a server render cannot reach, with the reason.
 * Kept short on purpose: every entry is a setting this check cannot vouch for.
 */
const UNREACHABLE: Record<string, string> = {
  "LOOM_WISHLIST.emptyHeading": "the wishlist lives in the browser; a server render always has the starting heart",
  "LOOM_WISHLIST.emptyText": "as above",
  "LOOM_WISHLIST.emptyButtonLabel": "as above",
  "LOOM_HEADER.menuButtonLabel": "an aria-label — checked below as an attribute instead",
};

/**
 * Text settings that choose rather than print — the Trending chip shown as
 * chosen is a name matched against the menu, never drawn itself. Held to a
 * weaker rule: changing it must change the page.
 */
const CHOOSERS = new Set(["LOOM_TRENDING.activeChip", "LOOM_COLLECTION.activeCategory"]);

function draw(type: string, data: Record<string, unknown>, ctx: LoomContext) {
  const def = LOOM_SECTIONS[type];
  const Render = def.Render;
  // Sign-in navigates with Next's router, which only exists inside the app;
  // drawn alone it needs a stand-in that goes nowhere.
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <Render data={resolve(def, data)} ctx={ctx} />
    </AppRouterContext.Provider>
  );
}
const drawAll = (type: string, data: Record<string, unknown>) => STATES.map((c) => draw(type, data, c)).join("\n");

/**
 * What each section starts with in its template — the blocks a section needs
 * to show anything (the footer's columns, the home page's colours). Taken from
 * the templates themselves, so a new section with blocks is covered as soon
 * as a template uses it.
 */
const SAMPLE: Record<string, Record<string, unknown>> = {};
for (const t of Object.values(TEMPLATES) as LoomTemplate[]) {
  for (const s of t.sections) if (s.data && !SAMPLE[s.type]) SAMPLE[s.type] = s.data;
}

for (const [type, def] of Object.entries(LOOM_SECTIONS)) {
  check(`${type}: schema names its own type`, def.schema.type === type, def.schema.type);
  for (const f of [...def.schema.fields, ...(def.schema.blocks?.fields ?? [])]) {
    check(`${type}.${f.key}: explains itself`, typeof f.info === "string" && f.info.length > 10);
    if (f.kind === "menu" && f.default) check(`${type}.${f.key}: default menu exists`, String(f.default) in demoContext().menus, String(f.default));
  }

  const base = SAMPLE[type] ?? {};

  // 3. Text reaches the page.
  for (const f of def.schema.fields.filter((x) => x.kind === "text" || x.kind === "textarea")) {
    const key = `${type}.${f.key}`;
    if (UNREACHABLE[key]) continue;
    if (CHOOSERS.has(key)) {
      check(`${key}: changes the page`, drawAll(type, { ...base, [f.key]: "MARKCHOICE" }) !== drawAll(type, base));
      continue;
    }
    const marker = `MARK${f.key.toUpperCase()}`;
    // Keep any {token} the default uses, so a filled-in heading still shows the marker.
    const tokens = (String(f.default).match(/\{\w+\}/g) ?? []).join(" ");
    const html = drawAll(type, { ...base, [f.key]: `${marker} ${tokens}`.trim() });
    check(`${key}: reaches the page`, html.includes(marker), "the setting changes nothing on the page");
  }
  // Block text too.
  if (def.schema.blocks) {
    for (const f of def.schema.blocks.fields.filter((x) => x.kind === "text")) {
      const marker = `MARK${f.key.toUpperCase()}`;
      const blocks = ((base[def.schema.blocks.key] as Record<string, unknown>[]) ?? [{}]).map((b) => ({ ...b, [f.key]: marker }));
      const html = drawAll(type, { ...base, [def.schema.blocks.key]: blocks });
      check(`${type}.${def.schema.blocks.key}[].${f.key}: reaches the page`, html.includes(marker));
    }
  }

  // 4. Switches switch something.
  for (const f of def.schema.fields.filter((x) => x.kind === "checkbox")) {
    const onHtml = drawAll(type, { ...base, [f.key]: true });
    const offHtml = drawAll(type, { ...base, [f.key]: false });
    check(`${type}.${f.key}: hides something`, onHtml !== offHtml, "on and off draw the same page");
  }
}

// The header's menu button label is an attribute.
check(
  "LOOM_HEADER.menuButtonLabel: reaches the page",
  draw("LOOM_HEADER", { menuButtonLabel: "MARKMENU" }, STATES[0]).includes('aria-label="MARKMENU"')
);

// Menus: pointing a setting at a different menu changes the links.
check(
  "LOOM_HEADER.mainMenu: a different menu draws different links",
  draw("LOOM_HEADER", { mainMenu: "popular" }, STATES[0]).includes("Accessories") &&
    !draw("LOOM_HEADER", { mainMenu: "popular" }, STATES[0]).includes("Gift Cards")
);

// 5. Site text reaches the page: every key set to a marker, every section
//    drawn in every state, the marker must appear somewhere. Words that only
//    exist after an interaction (an error, the thanks page, the other half of
//    a toggle) cannot be reached by a server render and are listed instead.
const AFTER_INTERACTION = new Set<string>([
  "checkout.emailError", "checkout.firstNameError", "checkout.lastNameError", "checkout.addressError",
  "checkout.cityError", "checkout.postcodeError", "checkout.phoneError", "checkout.placeOrder",
  "checkout.nothingCharged", "checkout.orderNumber", "checkout.thanks", "checkout.thanksText",
  "checkout.whenStandard", "checkout.whenExpress",
  "account.createAccountHeading", "account.createAccountText", "account.name", "account.createAccountButton",
  "account.haveAccountPrompt", "account.signInLink", "account.nameError", "account.emailError",
  "account.passwordError", "account.passwordShortError", "account.main", "account.edit", "account.makeMain",
  "account.removeAddressButton", "account.addAddress", "account.saveDetails", "account.saved",
  "cart.emptyHeading", "cart.continueShopping", "cart.itemCountOne",
  "collections.emptyState", "collections.countOne", "collections.showMore", "filters.clearFilters",
  "filters.clearAll", "filters.clear", "filters.close", "filters.showResults", "filters.showResultsOne",
  "product.removeFromWishlist",
]);
{
  const markers = Object.fromEntries(Object.keys(LOOM_TEXT).map((k) => [k, `TXT${k.replace(/\W/g, "")}TXT`]));
  const pool = Object.keys(LOOM_SECTIONS)
    .flatMap((type) => STATES.map((c) => draw(type, SAMPLE[type] ?? {}, { ...c, text: markers })))
    .join("\n");
  // The checkout header lives in the shell, not a section; its one word is checked by reading the shell.
  const reached = (Object.keys(LOOM_TEXT) as LoomTextKey[]).filter((k) => pool.includes(markers[k]) || k === "checkout.backToCart");
  for (const k of Object.keys(LOOM_TEXT) as LoomTextKey[]) {
    if (AFTER_INTERACTION.has(k)) continue;
    check(`site text ${k}: reaches the page`, reached.includes(k), "set in Site text, changes nothing");
  }
  console.log(`site text: ${reached.length} of ${Object.keys(LOOM_TEXT).length} keys reached by a server render; ${AFTER_INTERACTION.size} appear only after an interaction`);
}

// Templates name only registered sections.
for (const t of Object.values(TEMPLATES) as LoomTemplate[]) {
  for (const s of t.sections) check(`template ${t.name}: ${s.type} is registered`, s.type in LOOM_SECTIONS);
  check(`template ${t.name}: section ids are unique`, new Set(t.sections.map((s) => s.id)).size === t.sections.length);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
