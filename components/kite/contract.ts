import {
  kitHref,
  resolveKitSection,
  type KitCartLine,
  type KitContext,
  type KitCustomer,
  type KitLink,
  type KitMenu,
  type KitOrder,
  type KitSectionDef,
  type KitSectionEntry,
  type KitTemplate,
} from "@/lib/themes/kit";

/**
 * How a Kite section is shaped, so that the live customizer can drive it.
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
 *   - **A page is an ordered list of sections** — `KiteTemplate`, the shape of
 *     a Shopify JSON template. Reordering, hiding, adding a section, changing a
 *     word: each is a change to that list's data, never to code.
 *
 *   - **The section draws only what it is given** — its resolved settings and
 *     the shop's data (`KiteContext`). It fetches nothing, so the customizer can
 *     redraw it on every keystroke from the same function the storefront uses.
 *
 * The pages the kit drew first (home, product, collection, cart, checkout,
 * account) predate this file and still spell their words out; they move onto
 * it before Kite is ported. Wishlist, order, search and the header — which
 * carries the phone menu — are built on it from the start.
 */

// The shapes are the platform's (lib/themes/kit.ts) — every theme with its own
// sections is handed the same data. Kite's names for them:
export type KiteLink = KitLink;
export type KiteMenu = KitMenu;
export type KiteOrder = KitOrder;
export type KiteCustomer = KitCustomer;
export type KiteCartLine = KitCartLine;
export type KiteContext = KitContext;
export type KiteSectionEntry = KitSectionEntry;
export type KiteTemplate = KitTemplate;
export type KiteSectionDef = KitSectionDef;

/** Settings with every default filled, by the platform's own rules. */
export const resolve = (def: KiteSectionDef, stored?: Record<string, unknown>) => resolveKitSection(def, stored);

/** Read a setting as a string / boolean, tolerating whatever was stored. */
export const str = (d: Record<string, unknown>, k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
export const on = (d: Record<string, unknown>, k: string) => d[k] !== false;
/** A setting's words with `{query}` and the like filled in — "Results for “{query}”". */
export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
/** A link setting as a real address — `route:cart` becomes the shop's cart. */
export const href = (d: Record<string, unknown>, k: string, ctx: KiteContext, fallback?: string) => kitHref(ctx, str(d, k), fallback) || undefined;
/** One of the shop's own pages. */
export const route = (ctx: KiteContext, name: keyof KiteContext["routes"]) => ctx.routes[name];
export const menu = (d: Record<string, unknown>, k: string, ctx: KiteContext) => ctx.menus[str(d, k)]?.items ?? [];
