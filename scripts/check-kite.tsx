/**
 * Checks that Kite's sections can be driven by the live customizer —
 * `npx tsx scripts/check-kite.tsx`. Kite's half of scripts/check-loom.tsx,
 * holding Kite to the same promises (see that file for why each exists):
 *
 *   1. Every section's schema names its own type; every field explains itself.
 *   2. Every `menu` default names a menu that exists; templates name only
 *      registered sections, with unique ids, and cover every page a kit needs.
 *   3. Every text setting reaches the page (set to a marker, drawn in every
 *      state its words appear in, the marker must be in the output).
 *   4. Every show/hide switch changes the page.
 *   5. Every Site text key Kite uses reaches the page, or is listed as
 *      appearing only after an interaction or only on a real shop.
 *   6. The kit is registered for every Kite copy, and the server's save rules
 *      hold for its main sections.
 *
 * Dependency-free beyond React's own server renderer; exits non-zero on failure.
 */
import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { KITE_SECTIONS } from "../components/kite/sections";
import * as TEMPLATES from "../components/kite/templates";
import { KITE_DEMO_BAG, KITE_DEMO_COLLECTION, KITE_DEMO_CUSTOMER, KITE_DEMO_ORDER, KITE_DEMO_PRODUCT, KITE_DEMO_SAVED, kiteDemoContext } from "../components/kite/demo";
import { KITE_TEXT } from "../components/kite/text";
import { resolve, type KiteContext, type KiteTemplate } from "../components/kite/contract";
import type { LoomTextKey } from "../components/loom/text";
import { kitFor } from "../lib/themes/kits";
import { checkTemplate } from "../lib/themes/kit-templates";
import { TEMPLATE_NAMES } from "../lib/themes/kit";

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const full = (extra: Partial<KiteContext> = {}) =>
  kiteDemoContext({
    product: KITE_DEMO_PRODUCT,
    collection: { title: "Shop", description: "Every piece." },
    customer: KITE_DEMO_CUSTOMER,
    savedGroups: KITE_DEMO_SAVED,
    order: KITE_DEMO_ORDER,
    cart: KITE_DEMO_BAG,
    ...extra,
  });

/** The states a section's words can appear in — each is drawn and the outputs pooled. */
const STATES: KiteContext[] = [
  full(),
  full({ products: KITE_DEMO_COLLECTION, query: "piece" }),
  full({ products: KITE_DEMO_COLLECTION, query: "zzzz-nothing" }),
  full({ products: [] }),
  full({ cart: [] }),
  full({ order: { ...KITE_DEMO_ORDER, stage: 1, arriving: "Thursday", tracking: "https://track.example" } }),
  full({ order: { ...KITE_DEMO_ORDER, cancelled: true } }),
  full({ order: { ...KITE_DEMO_ORDER, thanks: "Sarah" } }),
  full({ order: undefined, orderLookup: { id: "ab12c" } }),
  ...(["orders", "details", "saved"] as const).map((accountTab) => full({ accountTab })),
  full({ accountTab: "saved", savedGroups: undefined }),
  // A bag under a shop's free-delivery amount, so "how far off" shows.
  full({ checkout: { methods: [{ value: "cod", label: "Cash", hint: "", instructions: null, redirects: false }], shippingFee: 300, freeShippingFrom: 500000, cities: ["Lahore"] } }),
  // A shop whose first way to pay leaves for a card provider's page.
  full({ checkout: { methods: [{ value: "card", label: "Card", hint: "", instructions: "Paid on the provider's page", redirects: true }], shippingFee: 300, freeShippingFrom: null, cities: ["Lahore"] } }),
  // A collection of one.
  full({ products: KITE_DEMO_COLLECTION.slice(0, 1) }),
  // A real shop's checkout terms and an empty bag.
  full({ live: true, cart: [], checkout: { methods: [], shippingFee: 300, freeShippingFrom: 5000, cities: ["Lahore"] } }),
];

/** Words drawn only in a state a server render cannot reach, with the reason. */
const UNREACHABLE: Record<string, string> = {
  "KITE_WISHLIST.removeLabel": "saved items live in the browser; a server render has none",
  "KITE_WISHLIST.addLabel": "as above",
  "KITE_ACCOUNT.savedEmpty": "the saved tab reads the browser's favourites, which a server render cannot",
  "KITE_ACCOUNT.savedEmptyLink": "as above",
  "KITE_PRODUCT.shippingText": "shown only once the SHIPPING row is opened",
};

function draw(type: string, data: Record<string, unknown>, ctx: KiteContext) {
  const def = KITE_SECTIONS[type];
  const Render = def.Render;
  const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} };
  return renderToStaticMarkup(
    <AppRouterContext.Provider value={router as never}>
      <Render data={resolve(def, data)} ctx={ctx} />
    </AppRouterContext.Provider>
  );
}
const drawAll = (type: string, data: Record<string, unknown>) => STATES.map((c) => draw(type, data, c)).join("\n");

const SAMPLE: Record<string, Record<string, unknown>> = {};
for (const t of Object.values(TEMPLATES).filter((x): x is KiteTemplate => !!x && typeof x === "object" && "sections" in x)) {
  for (const s of t.sections) if (s.data && Object.keys(s.data).length && !SAMPLE[s.type]) SAMPLE[s.type] = s.data;
}

for (const [type, def] of Object.entries(KITE_SECTIONS)) {
  check(`${type}: schema names its own type`, def.schema.type === type, def.schema.type);
  for (const f of [...def.schema.fields, ...(def.schema.blocks?.fields ?? [])]) {
    check(`${type}.${f.key}: explains itself`, typeof f.info === "string" && f.info.length > 10);
    if (f.kind === "menu" && f.default) check(`${type}.${f.key}: default menu exists`, String(f.default) in kiteDemoContext().menus, String(f.default));
  }
  const base = SAMPLE[type] ?? {};

  for (const f of def.schema.fields.filter((x) => x.kind === "text" || x.kind === "textarea")) {
    const key = `${type}.${f.key}`;
    if (UNREACHABLE[key]) continue;
    const marker = `MARK${f.key.toUpperCase()}`;
    const tokens = (String(f.default).match(/\{\w+\}/g) ?? []).join(" ");
    const html = drawAll(type, { ...base, [f.key]: `${marker} ${tokens}`.trim() });
    check(`${key}: reaches the page`, html.includes(marker), "the setting changes nothing on the page");
  }
  if (def.schema.blocks) {
    for (const f of def.schema.blocks.fields.filter((x) => x.kind === "text" || x.kind === "textarea")) {
      const marker = `MARK${f.key.toUpperCase()}`;
      const blocks = ((base[def.schema.blocks.key] as Record<string, unknown>[]) ?? [{}]).map((b) => ({ ...b, [f.key]: marker }));
      const html = drawAll(type, { ...base, [def.schema.blocks.key]: blocks });
      check(`${type}.${def.schema.blocks.key}[].${f.key}: reaches the page`, html.includes(marker));
    }
  }
  for (const f of def.schema.fields.filter((x) => x.kind === "checkbox")) {
    check(`${type}.${f.key}: changes the page`, drawAll(type, { ...base, [f.key]: true }) !== drawAll(type, { ...base, [f.key]: false }), "on and off draw the same page");
  }
}

// 5. Site text Kite draws. Kite does not use every shared key (it has no
//    promises row, no delivery speeds, no account-wide sign-out link of its
//    own), so the check is: of the keys Kite's code names, each reaches the
//    page — or is listed here with why it cannot in a server render.
const AFTER_INTERACTION = new Set<string>([
  "checkout.emailError", "checkout.firstNameError", "checkout.lastNameError", "checkout.addressError",
  "checkout.cityError", "checkout.postcodeError", "checkout.phoneError", "checkout.orderNumber", "checkout.thanks",
  "checkout.thanksText", "checkout.whenStandard", "checkout.placeOrder", "checkout.nothingCharged",
  "account.codeSent", "account.code", "account.signInButton", "account.differentEmail", "account.sendAgain",
  "account.codeResent", "account.emailError", "account.codeError", "account.detailsNote", "account.saveAddress", "account.cancel",
  "filters.colorLabel", "filters.sizeLabel", "filters.priceLabel", "filters.clearAll", "filters.clearFilters",
  "collections.emptyState", "order.lookupError", "cart.itemCountOne",
]);
// Only a real shop draws these, once the browser has read its bag.
const LIVE_ONLY = new Set<string>(["checkout.discount", "checkout.discountCode", "checkout.apply", "checkout.removeDiscount", "checkout.cityPlaceholder", "checkout.emptyCart"]);
{
  const dir = path.join(__dirname, "../components/kite");
  const files = fs.readdirSync(dir, { recursive: true }).filter((f) => String(f).endsWith(".tsx")).map((f) => fs.readFileSync(path.join(dir, String(f)), "utf8"));
  const used = (Object.keys(KITE_TEXT) as LoomTextKey[]).filter((k) => files.some((src) => src.includes(`"${k}"`)) || files.some((src) => src.includes("SORTS") && k.startsWith("sort.")));
  const markers = Object.fromEntries(Object.keys(KITE_TEXT).map((k) => [k, `TXT${k.replace(/\W/g, "")}TXT`]));
  const pool = Object.keys(KITE_SECTIONS)
    .flatMap((type) => STATES.map((c) => draw(type, SAMPLE[type] ?? {}, { ...c, text: markers })))
    .join("\n");
  for (const k of used) {
    if (AFTER_INTERACTION.has(k) || LIVE_ONLY.has(k)) continue;
    check(`site text ${k}: reaches the page`, pool.includes(markers[k]), "set in Site text, changes nothing");
  }
  console.log(`site text: Kite names ${used.length} of ${Object.keys(KITE_TEXT).length} keys; ${AFTER_INTERACTION.size} appear only after an interaction, ${LIVE_ONLY.size} only on a real shop`);
}

// 6. Registered, for every copy, with every page; the save rules hold.
{
  const kit = kitFor("kite", "2.0.0");
  check("kits: Kite 2.0.0 has a kit", !!kit);
  check("kits: every Kite copy is the kit, 1.0.0 included", kitFor("kite", "1.0.0") !== null);
  if (kit) {
    for (const name of TEMPLATE_NAMES) check(`templates: Kite has "${name}"`, !!kit.templates[name]);
    const product = kit.templates.product;
    const ok = (sections: unknown) => checkTemplate(kit, "product", { sections });
    check("save: the default product page passes", ok(product.sections).ok);
    check("save: removing the main section is refused", !ok(product.sections.filter((x) => x.type !== "KITE_PRODUCT")).ok);
    check("save: an unknown section type is refused", !ok([...product.sections, { id: "x1", type: "NOT_A_SECTION" }]).ok);
    for (const name of TEMPLATE_NAMES) check(`save: the default ${name} template passes`, checkTemplate(kit, name, { sections: kit.templates[name].sections }).ok);
  }
}

for (const t of Object.values(TEMPLATES).filter((x): x is KiteTemplate => !!x && typeof x === "object" && "sections" in x)) {
  for (const s of t.sections) check(`template ${t.name}: ${s.type} is registered`, s.type in KITE_SECTIONS);
  check(`template ${t.name}: section ids are unique`, new Set(t.sections.map((s) => s.id)).size === t.sections.length);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
