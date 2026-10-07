import type { KitSectionDef, KitTemplate, TemplateName } from "@/lib/themes/kit";
import { LOOM_SECTIONS } from "@/components/loom/sections";
import * as LOOM from "@/components/loom/templates";
import { LOOM_TEXT } from "@/components/loom/text";
import { LoomFrame } from "@/components/loom/frame";

/**
 * The themes that bring their own sections, and from which version.
 *
 * A theme key in lib/themes/registry.ts plus a version: a shop's copy of that
 * theme draws from the kit only once the copy is at `since` or later. That is
 * what keeps a kit from changing a single live storefront the day it ships —
 * every copy made before it records an older version, renders exactly as it
 * always has, and moves only when the merchant presses Update (or however the
 * release is decided). Loom 1.x is the platform's original storefront wearing
 * Loom's colours; Loom 2.0 is the kit.
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
  /** Everything a page of this kit sits inside — its fonts, its unit, its `<main>`. */
  Frame: (props: { children: React.ReactNode }) => React.ReactNode;
};

export const KITS: ThemeKit[] = [
  {
    themeKey: "loom",
    since: "2.0.0",
    sections: LOOM_SECTIONS,
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
    Frame: LoomFrame,
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
