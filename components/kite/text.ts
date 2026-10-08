import type { KiteContext } from "@/components/kite/contract";
import { LOOM_TEXT, type LoomTextKey } from "@/components/loom/text";

/**
 * Kite's interface words — the pages the file does not draw (cart, checkout,
 * collection, sign-in, order, wishlist) say these.
 *
 * The same keys as every kit's (Site text, lib/site-text.ts), so a shop's own
 * edits carry from one theme to the next. The values are Loom's, which are
 * the platform's plain sentence-case defaults, except where Kite's own file
 * already says the thing differently: it calls the cart a bag (the header's
 * glyph is a bag) and "Add to cart" is its button's own words.
 */
export const KITE_TEXT: Record<LoomTextKey, string> = {
  ...LOOM_TEXT,
  "cart.heading": "Your bag",
  "cart.emptyHeading": "Your bag is empty — for now.",
  "checkout.emptyCart": "There is nothing in your bag to check out.",
};

export function ktx(ctx: Pick<KiteContext, "text">, key: LoomTextKey, vars: Record<string, string | number> = {}) {
  const raw = ctx.text?.[key] ?? KITE_TEXT[key];
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
