/**
 * What a theme *arranges*, as opposed to what it paints.
 *
 * Themes used to be tokens and nothing else. Aurora and Meridian rendered
 * byte-identical HTML — same header, same card, same grid — and differed only
 * in CSS custom properties. That is a palette, not a theme, and a merchant
 * choosing between them was choosing a colour scheme with two names.
 *
 * So a theme now also picks a *variant* for each of the storefront's structural
 * slots, and switches on the behaviour it wants. Every variant is written once,
 * in the one component that owns that slot. Adding a theme still adds no
 * components — which is the property the registry was built to protect — but a
 * theme can now genuinely look and behave like a different shop.
 *
 * The defaults below are exactly what the storefront did before any of this
 * existed, so a shop that has never touched it renders what it always did.
 *
 * Client-safe: pure data and pure functions, no Prisma, no next/headers.
 */

/* ------------------------------------------------------------------ slots -- */

/**
 * Where the logo, the navigation and the tools sit.
 *
 * Not cosmetic. A centred header pushes the navigation below the logo and costs
 * vertical space that a shop with forty categories cannot spare; a minimal one
 * buys that space back by hiding navigation behind a button, which a shop with
 * four categories should never do.
 */
export const HEADER_LAYOUTS = {
  classic: {
    label: "Classic",
    description: "Logo on the left, links beside it, tools on the right. Fits the most links.",
  },
  centred: {
    label: "Centred",
    description: "Logo in the middle with links underneath. Formal, and taller.",
  },
  minimal: {
    label: "Minimal",
    description: "Logo and tools only, with links behind a button. Most room for the page itself.",
  },
} as const;

/**
 * How a product looks in a grid.
 *
 * The card is the most repeated element on a storefront — thirty of them on one
 * page — so its proportions decide the character of the whole shop more than
 * any other single choice.
 */
export const CARD_LAYOUTS = {
  quiet: {
    label: "Quiet",
    description: "Square photo, name and price underneath, aligned left. Calm and familiar.",
  },
  editorial: {
    label: "Editorial",
    description: "Tall photo, centred name in small capitals. For a shop that sells a look.",
  },
  compact: {
    label: "Compact",
    description: "Smaller photo and type, price beside the name. For a large catalogue.",
  },
} as const;

/**
 * How much air sits between products in a grid.
 *
 * Spacing only, deliberately. How many products fit across a row is already a
 * merchant setting — Preferences › shop grid columns — and a theme that also
 * set it would be a second switch for one thing, which is the shape of bug
 * lib/payment-methods.ts exists because of. The theme owns the rhythm; the
 * merchant owns the count.
 */
export const GRID_DENSITIES = {
  roomy: { label: "Roomy", description: "Generous space around each product." },
  tight: { label: "Tight", description: "Less space between products, so more of the page is catalogue." },
} as const;

export const FOOTER_LAYOUTS = {
  columns: {
    label: "Columns",
    description: "Menus in columns with the payment methods underneath.",
  },
  band: {
    label: "Band",
    description: "A single centred row. Quieter, and much shorter on a phone.",
  },
} as const;

export type HeaderLayout = keyof typeof HEADER_LAYOUTS;
export type CardLayout = keyof typeof CARD_LAYOUTS;
export type GridDensity = keyof typeof GRID_DENSITIES;
export type FooterLayout = keyof typeof FOOTER_LAYOUTS;

/* --------------------------------------------------------------- features -- */

/**
 * Behaviour a theme switches on.
 *
 * Each is a real thing the storefront does, not a style. They live here rather
 * than in tokens because a merchant should be able to keep their theme's look
 * and turn one of these off — quick-add in particular is wrong for a shop whose
 * every product needs a size chosen.
 */
export const THEME_FEATURES = {
  hoverSwapImage: {
    label: "Second photo on hover",
    description:
      "Hovering a product shows its next photo. Does nothing on a phone, where there is no hover, so nothing is lost by leaving it on.",
  },
  quickAdd: {
    label: "Add to basket from the grid",
    description:
      "A button on the card for products with only one version. Anything with sizes or colours opens its page instead, rather than guessing.",
  },
  stickyBuyBar: {
    label: "Buy bar follows the page",
    description:
      "On a product page, the price and Add to basket stay in view as the customer scrolls. Matters most on phones.",
  },
  swatchesOnCard: {
    label: "Show colours on the card",
    description:
      "The colours a product comes in, before it is opened. Only appears where a product actually has more than one.",
  },
} as const;

export type ThemeFeature = keyof typeof THEME_FEATURES;

export type ThemeLayout = {
  header: HeaderLayout;
  productCard: CardLayout;
  grid: GridDensity;
  footer: FooterLayout;
} & Record<ThemeFeature, boolean>;

/**
 * What the storefront did before any of this existed.
 *
 * Every feature off and every slot on its original variant, so a shop that has
 * never chosen renders exactly what it always rendered. A default that changed
 * a live storefront would be this file's first and worst bug.
 */
export const THEME_LAYOUT_DEFAULTS: ThemeLayout = {
  header: "classic",
  productCard: "quiet",
  grid: "roomy",
  footer: "columns",
  hoverSwapImage: false,
  quickAdd: false,
  stickyBuyBar: false,
  swatchesOnCard: false,
};

/* -------------------------------------------------------------- resolving -- */

const SLOTS = {
  header: HEADER_LAYOUTS,
  productCard: CARD_LAYOUTS,
  grid: GRID_DENSITIES,
  footer: FOOTER_LAYOUTS,
} as const;

/**
 * A stored blob turned into a layout that is safe to render.
 *
 * Same shape of guarantee as `resolveThemeTokens`: anything unrecognised falls
 * back rather than reaching a component. A hand-edited row naming a header
 * variant that no longer exists renders the classic one, not nothing.
 */
export function resolveThemeLayout(raw: unknown): ThemeLayout {
  const input = (raw ?? {}) as Record<string, unknown>;
  const out: ThemeLayout = { ...THEME_LAYOUT_DEFAULTS };

  for (const [slot, variants] of Object.entries(SLOTS)) {
    const value = input[slot];
    if (typeof value === "string" && value in variants) {
      (out as Record<string, unknown>)[slot] = value;
    }
  }

  for (const feature of Object.keys(THEME_FEATURES) as ThemeFeature[]) {
    if (typeof input[feature] === "boolean") out[feature] = input[feature] as boolean;
  }

  return out;
}

/** Only the keys that differ from the defaults, for storing a merchant's edits. */
export function layoutChanges(layout: ThemeLayout): Partial<ThemeLayout> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(THEME_LAYOUT_DEFAULTS) as (keyof ThemeLayout)[]) {
    if (layout[key] !== THEME_LAYOUT_DEFAULTS[key]) out[key] = layout[key];
  }
  return out as Partial<ThemeLayout>;
}

/* ------------------------------------------------------------ grid shapes -- */

/**
 * The gap classes for a density. Columns are not set here — see GRID_DENSITIES.
 *
 * Written out rather than built from a string, because Tailwind only ships the
 * classes it can see in the source: a template literal produces a class that
 * exists in the HTML and in no stylesheet.
 */
export const GRID_CLASSES: Record<GridDensity, string> = {
  roomy: "gap-x-4 gap-y-10",
  tight: "gap-x-3 gap-y-6",
};

/**
 * The photo shape each card variant wants.
 *
 * `quiet` is 3:4 because that is what the storefront has always used, and the
 * first version of this table had it as a square — which silently reshaped
 * every product on every existing shop. Caught by looking at Aurora rather
 * than by reading the diff. The rule this table is under: the original variant
 * of any slot reproduces the original storefront exactly.
 */
export const CARD_ASPECT: Record<CardLayout, string> = {
  quiet: "aspect-[3/4]",
  /** Taller again, so the photograph is the card and the words are a caption. */
  editorial: "aspect-[2/3]",
  /** Square: the most products in the least height. */
  compact: "aspect-square",
};
