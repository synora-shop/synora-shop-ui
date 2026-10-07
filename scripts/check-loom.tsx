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
import { LOOM_SECTIONS } from "../components/loom/sections";
import * as TEMPLATES from "../components/loom/templates";
import { DEMO_MENUS } from "../components/loom/demo-menus";
import { SHOES } from "../components/loom/catalogue";
import { resolve, type LoomContext, type LoomOrder, type LoomTemplate } from "../components/loom/contract";

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const ORDER: LoomOrder = {
  id: "LM-1",
  placed: "1 October",
  stage: 1,
  dates: ["1", "2", "3", "4"],
  arriving: "Friday",
  lines: [{ id: "x", title: "Shoe", src: "/x.png", colour: "Red", size: "9", qty: 1, price: 10, href: "#" }],
  delivery: 0,
  speed: "Standard",
  address: ["A"],
  payment: "Card",
  tracking: "T1",
};

/** The states a section's words can appear in — each is drawn and the outputs pooled. */
const STATES: LoomContext[] = [
  { menus: DEMO_MENUS, products: SHOES, order: ORDER },
  { menus: DEMO_MENUS, products: SHOES, query: "red", order: ORDER },
  { menus: DEMO_MENUS, products: SHOES, query: "zzzz-nothing", order: ORDER },
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

function draw(type: string, data: Record<string, unknown>, ctx: LoomContext) {
  const def = LOOM_SECTIONS[type];
  const Render = def.Render;
  return renderToStaticMarkup(<Render data={resolve(def, data)} ctx={ctx} />);
}
const drawAll = (type: string, data: Record<string, unknown>) => STATES.map((c) => draw(type, data, c)).join("\n");

/** The blocks a section needs to show anything (the footer's columns). */
const SAMPLE: Record<string, Record<string, unknown>> = {
  LOOM_FOOTER: { columns: [{ heading: "Popular", menu: "popular" }] },
};

for (const [type, def] of Object.entries(LOOM_SECTIONS)) {
  check(`${type}: schema names its own type`, def.schema.type === type, def.schema.type);
  for (const f of [...def.schema.fields, ...(def.schema.blocks?.fields ?? [])]) {
    check(`${type}.${f.key}: explains itself`, typeof f.info === "string" && f.info.length > 10);
    if (f.kind === "menu" && f.default) check(`${type}.${f.key}: default menu exists`, String(f.default) in DEMO_MENUS, String(f.default));
  }

  const base = SAMPLE[type] ?? {};

  // 3. Text reaches the page.
  for (const f of def.schema.fields.filter((x) => x.kind === "text" || x.kind === "textarea")) {
    const key = `${type}.${f.key}`;
    if (UNREACHABLE[key]) continue;
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

// Templates name only registered sections.
for (const t of Object.values(TEMPLATES) as LoomTemplate[]) {
  for (const s of t.sections) check(`template ${t.name}: ${s.type} is registered`, s.type in LOOM_SECTIONS);
  check(`template ${t.name}: section ids are unique`, new Set(t.sections.map((s) => s.id)).size === t.sections.length);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
