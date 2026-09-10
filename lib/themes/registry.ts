/**
 * The themes this platform ships.
 *
 * A theme is not a folder of code. It is three pieces of data:
 *
 *   1. which sections it offers,
 *   2. the look it starts at, as design tokens,
 *   3. who it is for, as business types.
 *
 * That shape is deliberate and it is what makes six themes affordable. Two
 * ecommerce themes differ in typography, colour, spacing and which sections they
 * put in front of you — not in their React trees. Duplicating eight components
 * per theme would mean forty-eight components to fix a bug in, and every theme
 * added after would make the next bug worse.
 *
 * So a new theme is one entry in this file. If a theme ever genuinely needs a
 * section nothing else has, that is a new section in `lib/section-schema.ts`
 * plus a renderer — and every other theme can then offer it too.
 *
 * Client-safe: pure data, no imports beyond types.
 */
import { SECTION_TYPES } from "@/lib/section-schema";
import { THEME_TOKEN_DEFAULTS, type ThemeTokens } from "@/lib/theme-tokens";
import { THEME_LAYOUT_DEFAULTS, type ThemeLayout } from "@/lib/theme-layout";

/**
 * What kind of business a shop is.
 *
 * Chosen during onboarding, changeable afterwards. It filters the theme picker
 * and decides the vocabulary the admin uses — products, posts or dishes — so it
 * is a setting on the shop rather than a fork in the product.
 */
export const BUSINESS_TYPES = ["ecommerce", "blog", "restaurant"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  ecommerce: "Online store",
  blog: "Blog or publication",
  restaurant: "Restaurant or café",
};

export type ThemeDefinition = {
  /** Stable across renames — this is what a storefront stores. */
  key: string;
  name: string;
  /** One line, shown on the picker card. */
  description: string;
  /**
   * Which business types this theme suits. A theme may serve more than one:
   * a restaurant that sells merchandise is not a strange thing to be.
   */
  businessTypes: BusinessType[];
  /**
   * Section types this theme offers, in the order the picker shows them.
   * Every entry must exist in SECTION_SCHEMAS — `check:themes` proves it.
   */
  sections: string[];
  /**
   * The look this theme starts at. Merchant edits are stored separately and
   * layered on top, so changing a default here never overwrites their work —
   * it only changes where a *new* shop begins.
   */
  tokens: Partial<ThemeTokens>;
  /**
   * A picture of this theme, in `public/themes`.
   *
   * A photograph of the shop page rather than the home page, deliberately: the
   * four things that actually differ between themes — the header, the shape of
   * a product card, the density of the grid and the colour — are all on it, and
   * a home page in a shop without photography is mostly grey rectangles.
   *
   * Optional. A theme without one falls back to a live frame of the merchant's
   * own storefront, which is what every theme did before these existed.
   */
  preview?: string;
  /**
   * How this theme *arranges* the storefront, and what it switches on.
   *
   * The half that was missing. A theme with only tokens is a palette: Aurora
   * and Meridian rendered the same HTML and differed in CSS variables alone.
   * Omitted means "the original storefront", so a theme that says nothing here
   * behaves exactly as every theme did before this existed.
   */
  layout?: Partial<ThemeLayout>;
};

/* -------------------------------------------------------------------------- */

/**
 * Aurora — the storefront this platform has always had.
 *
 * Registered first and unchanged on purpose: it is what every existing shop is
 * already running, so making it a named theme must be a no-op for them. Its
 * tokens are the platform defaults, which is what "unthemed" has always meant.
 */
const aurora: ThemeDefinition = {
  key: "aurora",
  preview: "/themes/aurora.jpg",
  name: "Aurora",
  description: "Clean and roomy, with large imagery. A safe first choice.",
  businessTypes: ["ecommerce"],
  sections: [...SECTION_TYPES],
  tokens: {},
};

/**
 * Atlas — the first theme that is more than a palette.
 *
 * Aurora and Meridian differ in colour, type and corner radius, and in nothing
 * else: the same header, the same card, the same grid, the same footer. Atlas
 * is the theme that proves the other half of the registry works, so it changes
 * every one of those and switches on the behaviour a shop actually sells with.
 *
 * The choices hang together rather than being picked for variety. A centred
 * header and a tall, centred card make a shop that leads with photography; a
 * tight grid earns back the room that costs; a band footer keeps the bottom of
 * a phone page short. Hover swap and quick-add belong to a grid that expects to
 * be browsed rather than searched, and a sticky buy bar belongs to a long
 * product page on a phone, which is where most of these shops are read.
 *
 * Colour is deliberately neither of the other two: a deep pine against a warm
 * off-white, with amber for the second voice — not Aurora's maroon, and not
 * Meridian's absence of colour.
 */
const atlas: ThemeDefinition = {
  key: "atlas",
  preview: "/themes/atlas.jpg",
  name: "Atlas",
  description: "Photography-led, with a tight grid and quick buying. For a shop with a look.",
  businessTypes: ["ecommerce"],
  sections: [...SECTION_TYPES],
  tokens: {
    accent: "#12463c",
    secondary: "#c8763f",
    accentContrast: "#ffffff",
    pageBackground: "#fbfbf9",
    surface: "#ffffff",
    textPrimary: "#12181a",
    textMuted: "#5a6663",
    border: "#e3e5e0",
    headerBackground: "#ffffff",
    footerBackground: "#12181a",
    headingFont: "inter",
    bodyFont: "inter",
    baseFontSize: 16,
    headingWeight: 700,
    headingLetterSpacing: -1,
    // Softened rather than square: Meridian already owns the hard corner, and
    // an unrounded photograph beside a rounded button looks like an accident.
    cornerRadius: 6,
    buttonRadius: 6,
    containerWidth: 1360,
  },
  layout: {
    header: "centred",
    productCard: "editorial",
    grid: "tight",
    footer: "band",
    hoverSwapImage: true,
    quickAdd: true,
    stickyBuyBar: true,
    swatchesOnCard: true,
  },
};

/* -------------------------------------------------------------------------- */

/*
 * Meridian, Quill, Column, Hearth and Service were here.
 *
 * Removed 10 September. All five were palettes — the same HTML in different
 * colours — and keeping five of those alongside two real themes made the picker
 * look full while offering one genuine choice. Aurora is what every shop is
 * already running; Atlas is the one that actually arranges the storefront
 * differently.
 *
 * Their consequence, written down because it is not obvious: **there are no
 * blog or restaurant themes any more.** Those business types now have an empty
 * picker, which is honest — the platform is an e-commerce panel, and a
 * restaurant deserves a design built for restaurants rather than a shop's
 * design with the words changed. Until one exists, saying so is better than
 * offering five recolours of a product grid.
 *
 * A shop still on a removed key does not break: themeFor() falls back to
 * Aurora rather than letting a retired string take a storefront offline.
 */

export const THEMES: Record<string, ThemeDefinition> = {
  aurora,
  atlas,
};

/** The theme a shop gets when it has not chosen one and we know nothing else. */
export const DEFAULT_THEME_KEY = "aurora";

/**
 * The theme a shop of this kind starts on.
 *
 * Not DEFAULT_THEME_KEY: that is Aurora, which is an ecommerce design. A blog
 * that has never opened the picker would otherwise fall back to a storefront
 * built around a product grid it has no products for.
 */
export function defaultThemeFor(businessType: BusinessType): string {
  return themesFor(businessType)[0]?.key ?? DEFAULT_THEME_KEY;
}

/* -------------------------------------------------------------------------- */

/** A theme by key, or the default when the key is unknown. */
export function themeFor(key: string | null | undefined): ThemeDefinition {
  // An unknown key is a theme we retired, or a typo. Falling back keeps the
  // storefront up; refusing would take a shop offline over a string.
  return (key && THEMES[key]) || THEMES[DEFAULT_THEME_KEY];
}

/** Themes suitable for a business type, for the picker. */
export function themesFor(businessType: BusinessType): ThemeDefinition[] {
  return Object.values(THEMES).filter((theme) => theme.businessTypes.includes(businessType));
}

/**
 * The tokens a theme starts at.
 *
 * Three layers, weakest first: the platform's defaults, then the theme's own,
 * then whatever the merchant has changed. The middle layer is the only new one.
 */
export function themeTokens(
  key: string | null | undefined,
  merchant: Partial<ThemeTokens> = {}
): ThemeTokens {
  return { ...THEME_TOKEN_DEFAULTS, ...themeFor(key).tokens, ...merchant };
}

/**
 * The layout a theme starts at, with the merchant's changes on top.
 *
 * Same three layers as `themeTokens`, and the same rule: a merchant who has
 * chosen a header outranks the theme that suggested one.
 */
export function themeLayout(
  key: string | null | undefined,
  merchant: Partial<ThemeLayout> = {}
): ThemeLayout {
  return { ...THEME_LAYOUT_DEFAULTS, ...themeFor(key).layout, ...merchant };
}

/** Whether a theme offers a section type. */
export function themeOffers(key: string | null | undefined, sectionType: string): boolean {
  return themeFor(key).sections.includes(sectionType);
}
