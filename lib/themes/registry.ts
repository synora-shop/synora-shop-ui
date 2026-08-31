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
  name: "Aurora",
  description: "Clean and roomy, with large imagery. A safe first choice.",
  businessTypes: ["ecommerce"],
  sections: [...SECTION_TYPES],
  tokens: {},
};

/**
 * Meridian — the same sections, a completely different shop.
 *
 * Registered second on purpose. One theme does not prove a registry: until a
 * second one exists there is no evidence that a theme is data rather than a
 * special case, and no way to tell which of Aurora's choices were the
 * platform's and which were Aurora's.
 *
 * It shares every section with Aurora and overlaps in none of the decisions
 * that make a shop look like itself — serif against sans, cream against white,
 * pill buttons against square, a light footer against a black one. That is the
 * whole difference, and it is nineteen lines.
 */
const meridian: ThemeDefinition = {
  key: "meridian",
  name: "Meridian",
  description: "Monochrome and sharp-edged, with a wide grid. For a modern label.",
  businessTypes: ["ecommerce"],
  sections: [...SECTION_TYPES],
  tokens: {
    accent: "#111111",
    secondary: "#8a8a8a",
    accentContrast: "#ffffff",
    pageBackground: "#ffffff",
    surface: "#fafafa",
    textPrimary: "#0a0a0a",
    textMuted: "#6b6b6b",
    border: "#e5e5e5",
    headerBackground: "#ffffff",
    footerBackground: "#0a0a0a",
    // Sans headings at a heavier weight and negative tracking: the single
    // change that most separates it from Aurora's serif.
    headingFont: "inter",
    bodyFont: "inter",
    headingWeight: 700,
    headingLetterSpacing: -2,
    // Nothing is rounded. Aurora's pill buttons are the other half of its
    // character, so squaring them here is deliberate rather than plain.
    cornerRadius: 0,
    buttonRadius: 0,
    containerWidth: 1440,
  },
};

/* ------------------------------------------------------------------ blog -- */

/**
 * Which sections a blog is built from.
 *
 * Named rather than "all of them": a blog offering a category grid and a
 * featured-products row would be offering a merchant sections that render
 * nothing, which is the frustrating interface we said we would not ship.
 */
const BLOG_SECTIONS = ["ARTICLE_LIST", "TEXT_BLOCK", "IMAGE_TEXT", "BANNER", "STORY", "FAQ_LIST"];

const quill: ThemeDefinition = {
  key: "quill",
  name: "Quill",
  description: "Serif and unhurried, built around long reading.",
  businessTypes: ["blog"],
  sections: BLOG_SECTIONS,
  tokens: {
    accent: "#1c2b24",
    secondary: "#8f9d94",
    accentContrast: "#ffffff",
    pageBackground: "#fbfaf7",
    surface: "#ffffff",
    textPrimary: "#1a1a17",
    textMuted: "#5a5a52",
    border: "#e6e2d8",
    headerBackground: "#fbfaf7",
    footerBackground: "#f1eee6",
    headingFont: "cormorant",
    bodyFont: "georgia",
    // Larger body text than a shop would use. A storefront is scanned; an
    // article is read, and 17px is the difference between the two.
    baseFontSize: 17,
    headingWeight: 600,
    cornerRadius: 4,
    buttonRadius: 4,
    // Narrow on purpose. A line of text longer than about 75 characters is
    // measurably harder to read, and a blog is nothing but lines of text.
    containerWidth: 1120,
  },
};

const column: ThemeDefinition = {
  key: "column",
  name: "Column",
  description: "Tight and newsy, for publishing often.",
  businessTypes: ["blog"],
  sections: BLOG_SECTIONS,
  tokens: {
    accent: "#0f4c81",
    secondary: "#7a8b99",
    accentContrast: "#ffffff",
    pageBackground: "#ffffff",
    surface: "#f7f9fb",
    textPrimary: "#101418",
    textMuted: "#5b6670",
    border: "#dde3e9",
    headerBackground: "#ffffff",
    footerBackground: "#101418",
    headingFont: "inter",
    bodyFont: "inter",
    baseFontSize: 16,
    headingWeight: 700,
    headingLetterSpacing: -1,
    cornerRadius: 2,
    buttonRadius: 2,
    containerWidth: 1200,
  },
};

/* ------------------------------------------------------------ restaurant -- */

/**
 * A restaurant's sections.
 *
 * The menu, the hours and the address are the three things somebody standing
 * outside on a phone is looking for, so they lead. Featured products is here
 * too, for a kitchen that does sell online.
 */
const RESTAURANT_SECTIONS = [
  "MENU_LIST",
  "OPENING_HOURS",
  "LOCATION_INFO",
  "HERO_SLIDESHOW",
  "IMAGE_TEXT",
  "STORY",
  "FEATURED_PRODUCTS",
  "FAQ_LIST",
];

const hearth: ThemeDefinition = {
  key: "hearth",
  name: "Hearth",
  description: "Warm and traditional, with the menu front and centre.",
  businessTypes: ["restaurant"],
  sections: RESTAURANT_SECTIONS,
  tokens: {
    accent: "#7a2e1f",
    secondary: "#c9a227",
    accentContrast: "#fffaf3",
    pageBackground: "#fdf8f1",
    surface: "#ffffff",
    textPrimary: "#241a14",
    textMuted: "#5d4b3f",
    border: "#e9dcc9",
    headerBackground: "#fdf8f1",
    footerBackground: "#241a14",
    headingFont: "cormorant",
    bodyFont: "inter",
    baseFontSize: 16,
    headingWeight: 600,
    cornerRadius: 10,
    buttonRadius: 999,
    containerWidth: 1180,
  },
};

const service: ThemeDefinition = {
  key: "service",
  name: "Service",
  description: "Dark and modern, for evenings and bookings.",
  businessTypes: ["restaurant"],
  sections: RESTAURANT_SECTIONS,
  tokens: {
    accent: "#c8a24a",
    secondary: "#6f6a60",
    accentContrast: "#14120f",
    // The one theme that starts dark. A restaurant page is most often opened
    // in the evening, on a phone, outside.
    pageBackground: "#14120f",
    surface: "#1c1a16",
    textPrimary: "#f4f1ea",
    textMuted: "#a9a396",
    border: "#2c2822",
    headerBackground: "#14120f",
    footerBackground: "#0d0b09",
    headingFont: "inter",
    bodyFont: "inter",
    baseFontSize: 16,
    headingWeight: 600,
    headingLetterSpacing: 4,
    cornerRadius: 2,
    buttonRadius: 2,
    containerWidth: 1180,
  },
};

export const THEMES: Record<string, ThemeDefinition> = {
  aurora,
  meridian,
  quill,
  column,
  hearth,
  service,
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

/** Whether a theme offers a section type. */
export function themeOffers(key: string | null | undefined, sectionType: string): boolean {
  return themeFor(key).sections.includes(sectionType);
}
