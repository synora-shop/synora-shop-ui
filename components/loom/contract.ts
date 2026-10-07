import type { SectionSchema } from "@/lib/section-schema";
import { resolveSchemaData } from "@/lib/section-schema";
import type { CatalogueItem } from "@/components/loom/catalogue";

/**
 * How a Loom section is shaped, so that the live customizer can drive it.
 *
 * The same contract Shopify's themes have, in this platform's own types:
 *
 *   - **A section declares its settings as data** — a `SectionSchema` from
 *     lib/section-schema.ts, the exact format every platform section already
 *     uses and the customizer already builds its panel from. Every word the
 *     section prints is a setting with the kit's wording as its default, every
 *     optional part has a show/hide switch, and every list of links is a `menu`
 *     field pointing at a menu built under Admin → Menus.
 *
 *   - **A page is an ordered list of sections** — `LoomTemplate`, the shape of
 *     a Shopify JSON template. Reordering, hiding, adding a section, changing a
 *     word: each is a change to that list's data, never to code.
 *
 *   - **The section draws only what it is given** — its resolved settings and
 *     the shop's data (`LoomContext`). It fetches nothing, so the customizer can
 *     redraw it on every keystroke from the same function the storefront uses.
 *
 * The pages the kit drew first (home, product, collection, cart, checkout,
 * account) predate this file and still spell their words out; they move onto
 * it before Loom is ported. Wishlist, order, search and the header — which
 * carries the phone menu — are built on it from the start.
 */

/** One link in a menu, with its dropdown. The platform's MenuItem allows two levels and refuses a third. */
export type LoomLink = { id: string; label: string; href: string; children?: LoomLink[] };

/** A menu the merchant built, by the id a `menu` setting stores. */
export type LoomMenu = { id: string; name: string; items: LoomLink[] };

/** An order as the order page shows it. */
export type LoomOrder = {
  id: string;
  placed: string;
  /** Where it has got to, 0–3: ordered, packed, on its way, delivered. */
  stage: number;
  /** When each stage happened, or is expected. */
  dates: [string, string, string, string];
  arriving: string;
  lines: { id: string; title: string; src: string; colour: string; size: string; qty: number; price: number; href: string }[];
  delivery: number;
  speed: string;
  address: string[];
  payment: string;
  tracking: string;
};

/** The shop's data every section may read. Passed in, never fetched by a section. */
export type LoomContext = {
  menus: Record<string, LoomMenu>;
  /** The shop's products, for sections that list or look them up. */
  products: CatalogueItem[];
  /** The page's own query, for the search template. */
  query?: string;
  /** The order being looked at, on the order page. */
  order?: LoomOrder;
};

/** One section in a template: its type, its stored settings, and whether it is shown. */
export type LoomSectionEntry = { id: string; type: string; visible?: boolean; data?: Record<string, unknown> };

/** A page: its sections, in order. Stored as data when ported, exactly like this. */
export type LoomTemplate = { name: string; sections: LoomSectionEntry[] };

/** A section's definition: what it can be set to, and how it draws. */
export type LoomSectionDef = {
  schema: SectionSchema;
  Render: (props: { data: Record<string, unknown>; ctx: LoomContext }) => React.ReactNode;
};

/** Settings with every default filled, by the platform's own rules. */
export const resolve = (def: LoomSectionDef, stored?: Record<string, unknown>) => resolveSchemaData(def.schema, stored);

/** Read a setting as a string / boolean, tolerating whatever was stored. */
export const str = (d: Record<string, unknown>, k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
export const on = (d: Record<string, unknown>, k: string) => d[k] !== false;
/** A setting's words with `{query}` and the like filled in — "Results for “{query}”". */
export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
export const menu = (d: Record<string, unknown>, k: string, ctx: LoomContext) => ctx.menus[str(d, k)]?.items ?? [];
