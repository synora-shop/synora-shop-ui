import type { KitContext, KitSectionDef, KitTemplate, TemplateName } from "@/lib/themes/kit";
import { DEMO_CUSTOMER, DEMO_ORDER } from "@/components/loom/demo";
import { DEMO_LINES } from "@/components/loom/cart/lines";
import { LOOM_SECTIONS } from "@/components/loom/sections";
import * as LOOM from "@/components/loom/templates";
import { LOOM_TEXT } from "@/components/loom/text";
import { KITE_SECTIONS } from "@/components/kite/sections";
import * as KITE from "@/components/kite/templates";
import { KITE_TEXT } from "@/components/kite/text";
import { KITE_DEMO_BAG, KITE_DEMO_CUSTOMER, KITE_DEMO_ORDER } from "@/components/kite/demo";

/**
 * The themes that bring their own sections, and from which version.
 *
 * A theme key in lib/themes/registry.ts plus a version: a shop's copy of that
 * theme draws from the kit only once the copy is at `since` or later. That is
 * what keeps a kit from changing a single live storefront the day it ships —
 * every copy made before it records an older version, renders exactly as it
 * always has, and moves only when the merchant presses Update. Loom's kit
 * starts at 1.0.0 — every Loom is the kit — because it shipped before any
 * merchant existed.
 *
 * Server-side only: the kit's sections are React components.
 */
export type ThemeKit = {
  themeKey: string;
  /** The first version that is this kit. */
  since: string;
  sections: Record<string, KitSectionDef>;
  /** What every page is made of until a merchant edits it. */
  templates: Record<TemplateName, KitTemplate>;
  /** The kit's interface words, keyed like Site text. The shop's own Site text wins. */
  text: Record<string, string>;
  /**
   * What the live customizer shows where the merchant has none of their own:
   * they are not a shopper, so they have no account, no orders and no cart,
   * and a page drawn from nothing has nothing to edit. Never shown to a
   * customer — only in the customizer's preview.
   */
  sample: Required<Pick<KitContext, "customer" | "order" | "cart">>;
};

export const KITS: ThemeKit[] = [
  {
    themeKey: "loom",
    // Every copy of Loom. Decided 8 October: with no merchants yet, the new
    // design is simply Loom — there is no older storefront to protect. The
    // version gate stays for the next theme that gains a kit after shops
    // already wear it.
    since: "1.0.0",
    sections: LOOM_SECTIONS,
    sample: { customer: DEMO_CUSTOMER, order: DEMO_ORDER, cart: DEMO_LINES },
    templates: {
      index: LOOM.HOME,
      product: LOOM.PRODUCT,
      collection: LOOM.COLLECTION,
      search: LOOM.SEARCH,
      cart: LOOM.CART,
      checkout: LOOM.CHECKOUT,
      account: LOOM.ACCOUNT,
      "sign-in": LOOM.SIGN_IN,
      order: LOOM.ORDER,
      wishlist: LOOM.WISHLIST,
      header: LOOM.HEADER_GROUP,
      footer: LOOM.FOOTER_GROUP,
    },
    text: LOOM_TEXT,
  },
  {
    themeKey: "kite",
    // Every copy of Kite. Decided 9 October: the new design (rebuilt from
    // "KITE - Trümung", docs/KITE.md) replaces the old Kite outright — no
    // merchant wears it yet, so there is no older storefront to protect.
    since: "1.0.0",
    sections: KITE_SECTIONS,
    sample: { customer: { ...KITE_DEMO_CUSTOMER, orders: KITE_DEMO_CUSTOMER.orders.map((o) => ({ ...o, href: "#" })) }, order: KITE_DEMO_ORDER, cart: KITE_DEMO_BAG },
    templates: {
      index: KITE.HOME,
      product: KITE.PRODUCT,
      collection: KITE.COLLECTION,
      search: KITE.SEARCH,
      cart: KITE.CART,
      checkout: KITE.CHECKOUT,
      account: KITE.ACCOUNT,
      "sign-in": KITE.SIGN_IN,
      order: KITE.ORDER,
      wishlist: KITE.WISHLIST,
      header: KITE.HEADER_GROUP,
      footer: KITE.FOOTER_GROUP,
    },
    text: KITE_TEXT,
  },
];

/** "2.0.0" ≥ "1.10.3", numerically by part — not as strings, where "10" < "9". */
export function versionAtLeast(version: string, since: string): boolean {
  const a = version.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const b = since.split(".").map((n) => Number.parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  }
  return true;
}

/** The kit a theme copy draws from, or null for a copy that draws the platform's own storefront. */
export function kitFor(themeKey: string, version: string): ThemeKit | null {
  return KITS.find((k) => k.themeKey === themeKey && versionAtLeast(version, k.since)) ?? null;
}
