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
  /**
   * What this theme is, now.
   *
   * The shop records the version it added, on InstalledTheme. A theme is out of
   * date exactly when the two differ, which is why this lives here rather than
   * being written to every shop's row when a design changes: publishing a new
   * version is editing one line in this file, and nothing has to be kept in
   * step with it.
   *
   * Raise it when the design changes in a way a merchant would see. Not for a
   * typo in a description, and not for a fix that only restores what the theme
   * already claimed to be — an Update offered for nothing teaches a merchant to
   * ignore the next one.
   */
  version: string;
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
   * The plate this theme sits on in the store, as two gradient stops.
   *
   * Taken from Synora's accent palette — `#c8e7ff` and `#b8efd6` are two of
   * the five — rather than from the theme's own colours, and deliberately: the
   * store is a Synora screen showing what is on offer, not a preview of the
   * shop. The plate says *this is a theme*; the picture on it says which.
   *
   * Darker at the top, lighter at the bottom, which is what the design draws.
   */
  plate: { from: string; to: string };
  /**
   * How this theme *arranges* the storefront, and what it switches on.
   *
   * The half that was missing. A theme with only tokens is a palette: Loom
   * and the retired Meridian rendered the same HTML and differed in CSS variables alone.
   * Omitted means "the original storefront", so a theme that says nothing here
   * behaves exactly as every theme did before this existed.
   */
  layout?: Partial<ThemeLayout>;
};

/* -------------------------------------------------------------------------- */

/**
 * Loom — the storefront this platform has always had.
 *
 * Named Aurora until 22 September, and keyed `aurora` until 3 October, when
 * the key was moved to match. The warning that used to sit here — that
 * renaming the key would drop every shop back to a default — was answered
 * rather than ignored: `20261030000000_theme_keys_match_names` moves the
 * stored rows, and LEGACY_THEME_KEYS below keeps the old string resolving
 * while any row or any build is still a deploy behind.
 *
 * Registered first and unchanged on purpose: it is what every existing shop is
 * already running, so making it a named theme must be a no-op for them. Its
 * tokens are the platform defaults, which is what "unthemed" has always meant.
 */
const loom: ThemeDefinition = {
  key: "loom",
  // 2.0.0: Loom became its own sections (lib/themes/kits.ts) — the design a
  // merchant sees changed throughout.
  version: "2.0.0",
  plate: { from: "#8ab4c5", to: "#dbe8ed" },
  name: "Loom",
  description: "Clean and roomy, with large imagery. A safe first choice.",
  businessTypes: ["ecommerce"],
  sections: [...SECTION_TYPES],
  tokens: {
    // Measured out of the kit; the whole palette is in docs/LOOM.md.
    //
    // Declared rather than inherited, which is the point of this change. Loom
    // used to be `tokens: {}` — it was not a theme with a palette, it was the
    // platform's leftover defaults wearing a name, and those defaults were the
    // old business's maroon and tan. A theme that declares nothing cannot be
    // chosen *against*.
    accent: "#121212",
    secondary: "#2E3A59",
    accentContrast: "#ffffff",
    pageBackground: "#ffffff",
    surface: "#ffffff",
    textPrimary: "#121212",
    // The kit's own muted grey is #737b8b, which is 4.3:1 on white — under
    // AA, and this is body-sized text (prices, the hero's supporting line).
    // Two steps darker on the same hue clears it at 4.6:1 and is not a
    // difference anyone can see. Being faithful to a design does not extend
    // to reproducing an accessibility failure.
    textMuted: "#6e7686",
    border: "#dddddd",
    headerBackground: "#ffffff",
    footerBackground: "#121212",
    headingFont: "inter",
    bodyFont: "inter",
    baseFontSize: 16,
    // Regular, not semibold. The kit sets its 90px display face at Regular
    // with -5px of tracking, and that pairing — large, light, very tight — is
    // the single most recognisable thing about this design. Set at 600 it
    // becomes an ordinary shop.
    headingWeight: 400,
    headingLetterSpacing: -3,
    // Square cards, pill controls. The kit never rounds a photograph and never
    // leaves a button unrounded, and the contrast between the two is doing
    // real work.
    cornerRadius: 0,
    buttonRadius: 999,
    containerWidth: 1440,
    // The panel keeps its own colours. A storefront opened here should not
    // make the admin look like the shop, for the same reason the README gives
    // for the reverse: a shop opened on Shopify does not look like Shopify's
    // admin. Also load-bearing — with a declared accent, leaving this on would
    // re-skin every merchant's panel near-black the day this ships.
    adminSkin: false,
  },
  layout: {
    header: "utility",
    productCard: "gallery",
    grid: "roomy",
    footer: "masthead",
    hoverSwapImage: true,
    swatchesOnCard: true,
  },
};

/**
 * Kite — rebuilt from "KITE - Trümung - Ecommerce Clothing Store.fig" as its
 * own sections (lib/themes/kits.ts, docs/KITE.md), replacing the palette-only
 * Kite of September outright on 9 October.
 *
 * Named Atlas until 22 September, rekeyed 3 October, for the reason above.
 *
 * Its pages are the kit's; these tokens colour what the platform still draws
 * for a Kite shop (its own pages — FAQ, About, Contact, a policy page) so they
 * sit in the same room: the file's near-black ground, its warm off-white ink,
 * square corners, Inter for words. The file's serif (Hiragino Mincho, set as
 * Shippori Mincho in the kit) is not one the token system may load, so a
 * platform heading uses the built-in serif nearest it.
 */
const kite: ThemeDefinition = {
  key: "kite",
  // 2.0.0: Kite became its own sections — every page changed.
  version: "2.0.0",
  plate: { from: "#2a2a28", to: "#040404" },
  name: "Kite",
  description: "Dark and editorial: large photography, a serif voice and a quiet grid. For a fashion label.",
  businessTypes: ["ecommerce"],
  sections: [...SECTION_TYPES],
  tokens: {
    accent: "#f4f3f1",
    secondary: "#9c240c",
    accentContrast: "#040404",
    pageBackground: "#040404",
    surface: "#0e0e0d",
    textPrimary: "#f4f3f1",
    textMuted: "#b5b3ae",
    border: "#3a3936",
    headerBackground: "#040404",
    footerBackground: "#040404",
    headingFont: "cormorant",
    bodyFont: "inter",
    baseFontSize: 16,
    headingWeight: 400,
    headingLetterSpacing: 0,
    // The file never rounds a corner.
    cornerRadius: 0,
    buttonRadius: 0,
    containerWidth: 1728,
    // As Loom: the panel keeps its own colours.
    adminSkin: false,
  },
  layout: {
    header: "centred",
    productCard: "editorial",
    grid: "roomy",
    footer: "masthead",
  },
};

/* -------------------------------------------------------------------------- */

/*
 * Meridian, Quill, Column, Hearth and Service were here.
 *
 * Removed 10 September. All five were palettes — the same HTML in different
 * colours — and keeping five of those alongside two real themes made the picker
 * look full while offering one genuine choice. Loom is what every shop is
 * already running; Kite is the one that actually arranges the storefront
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
 * Loom rather than letting a retired string take a storefront offline.
 */

export const THEMES: Record<string, ThemeDefinition> = {
  loom,
  kite,
};

/** The theme a shop gets when it has not chosen one and we know nothing else. */
export const DEFAULT_THEME_KEY = "loom";

/**
 * The theme a shop of this kind starts on.
 *
 * Not DEFAULT_THEME_KEY: that is Loom, which is an ecommerce design. A blog
 * that has never opened the picker would otherwise fall back to a storefront
 * built around a product grid it has no products for.
 */
export function defaultThemeFor(businessType: BusinessType): string {
  return themesFor(businessType)[0]?.key ?? DEFAULT_THEME_KEY;
}

/* -------------------------------------------------------------------------- */

/**
 * Keys that used to be stored, and what they are now.
 *
 * Aurora and Atlas were renamed Loom and Kite on 22 September and their keys
 * were left alone, on the rule that a key is "stable across renames" because
 * it is what every storefront has stored. That rule is right about the danger
 * and wrong about the remedy: it left `/theme-store/loom` serving a theme
 * whose key said `aurora`, and every document since has had to carry the
 * translation. The keys moved on 3 October, with
 * `20261030000000_theme_keys_match_names` moving the stored rows in the same
 * deploy.
 *
 * This map is what makes that safe rather than merely done. Preview and
 * Production share one database, so a row and the code that reads it can be a
 * deploy apart in either direction:
 *
 *   * code ahead of data — a row still saying `atlas` resolves to Kite here,
 *     instead of failing the lookup and falling back to the default, which
 *     would serve a Kite shop the Loom design.
 *   * data ahead of code — an older build does not know `kite`, falls back to
 *     Aurora, and Aurora is Loom under its old name. Wrong theme for a Kite
 *     shop for the length of a rollback, right for everyone else.
 *
 * Deletable once nothing in the database holds either string. That is one
 * query to check and not worth guessing at, so it stays until someone has
 * run it.
 */
const LEGACY_THEME_KEYS: Record<string, string> = {
  aurora: "loom",
  atlas: "kite",
};

/** A theme by key, or the default when the key is unknown. */
export function themeFor(key: string | null | undefined): ThemeDefinition {
  if (!key) return THEMES[DEFAULT_THEME_KEY];
  // An unknown key is a theme we retired, a typo, or a row written before the
  // keys were renamed. Falling back keeps the storefront up; refusing would
  // take a shop offline over a string.
  return THEMES[key] || THEMES[LEGACY_THEME_KEYS[key] ?? ""] || THEMES[DEFAULT_THEME_KEY];
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
