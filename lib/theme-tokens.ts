// Theme design tokens — the global look of the storefront, editable from the
// customizer's Theme panel and stored per environment in ThemeSettings.tokens.
//
// These are emitted as CSS custom properties that override the ones declared in
// app/globals.css. That indirection is the whole point: because every component
// already styles itself with `bg-brand-500`, `text-ink`, `rounded-lg` and so on
// — all of which resolve through those variables — retheming the entire store
// takes no component changes at all, and works just as well for a section added
// later or shipped by an uploaded theme.
//
// Client-safe: pure data and string building, no Prisma, no next/headers.

import { brandRamp } from "@/lib/color";
import { CSS_FONT_FORMAT } from "@/lib/font-validation";
import { safeAssetUrl } from "@/lib/icon-validation";
import { AA_NORMAL, autoTextColor, clampForContrast, contrastRatio, tint } from "@/lib/contrast";

/**
 * "auto" means "work out the readable colour for whatever it sits on".
 *
 * Storing the intent rather than a resolved hex is what keeps the two in sync:
 * change the background and the text follows, with no stale value left behind
 * that used to be readable and no longer is.
 */
export const AUTO = "auto";

export type ThemeTokens = {
  // Colour
  accent: string;
  secondary: string;
  accentContrast: string;
  pageBackground: string;
  surface: string;
  textPrimary: string;
  textMuted: string;
  border: string;
  // Header and footer get their own background, with text either auto-derived
  // or overridden from options that pass AA.
  headerBackground: string;
  headerText: string;
  footerBackground: string;
  footerText: string;
  // "brand" | "auto" | "original" | a hex value — see resolveLogoColor().
  logoColor: string;
  /** Uploaded logo, or "" to use the built-in artwork at /logo.svg. */
  logoUrl: string;
  /** Rendered logo height in the header, in pixels. */
  logoHeight: number;
  /**
   * The little icon a browser shows on the tab and in a bookmark, or "" for
   * none. Every other visible mark of a shop's identity was settable and this
   * one was not, so every storefront on the platform wore the platform's icon
   * — a merchant's own customers saw our mark on their tab.
   */
  faviconUrl: string;
  /** Whether the admin panel re-skins from this theme. */
  adminSkin: boolean;
  // Typography
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;
  headingWeight: number;
  headingLetterSpacing: number; // in hundredths of an em
  // Shape
  cornerRadius: number;
  buttonRadius: number;
  containerWidth: number;
};

export const THEME_TOKEN_DEFAULTS: ThemeTokens = {
  accent: "#4c100f",
  secondary: "#d4bea7", // the brand's tan secondary
  accentContrast: "#ffffff",
  pageBackground: "#f8f5f1",
  surface: "#ffffff",
  textPrimary: "#221a1a",
  textMuted: "#4a3f3f",
  border: "#e8ded4",
  headerBackground: "#f8f5f1",
  headerText: AUTO,
  footerBackground: "#f0e6db",
  footerText: AUTO,
  logoColor: "original",
  logoUrl: "",
  logoHeight: 28,
  faviconUrl: "",
  adminSkin: true,
  headingFont: "cormorant",
  bodyFont: "inter",
  baseFontSize: 16,
  headingWeight: 600,
  headingLetterSpacing: 0,
  cornerRadius: 8,
  buttonRadius: 999,
  containerWidth: 1280,
};

/**
 * Font choices offered in the Theme panel.
 *
 * Deliberately limited to the two families the app already self-hosts via
 * next/font plus system stacks: loading an arbitrary web font at render time
 * would mean a network request to a third party on every storefront page, and
 * an uploaded theme must not be able to trigger that.
 */
export const FONT_STACKS: Record<string, { label: string; stack: string }> = {
  inter: { label: "Inter (clean sans)", stack: "var(--font-inter), system-ui, sans-serif" },
  cormorant: { label: "Cormorant Garamond (serif)", stack: "var(--font-heading), Georgia, serif" },
  system: { label: "System UI", stack: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
  georgia: { label: "Georgia (serif)", stack: "Georgia, 'Times New Roman', serif" },
  mono: { label: "Monospace", stack: "ui-monospace, SFMono-Regular, Menlo, monospace" },
};

const HEX = /^#[0-9a-fA-F]{3,8}$/;
/** Font tokens are either a built-in key or "custom:<cuid>". */
const FONT_TOKEN = /^[a-z]+$|^custom:[a-zA-Z0-9_-]{1,64}$/;

/** Colour fields, and what each may be beyond a plain hex value. */
const COLOR_FIELDS: Record<string, readonly string[]> = {
  accent: [], secondary: [], accentContrast: [], pageBackground: [], surface: [],
  textPrimary: [], textMuted: [], border: [],
  headerBackground: [], footerBackground: [],
  headerText: [AUTO], footerText: [AUTO],
  logoColor: ["original", "brand", AUTO],
};

/** Numeric fields and the range each is clamped into. */
const NUMBER_FIELDS: Record<string, [min: number, max: number]> = {
  logoHeight: [12, 120],
  baseFontSize: [10, 28],
  headingWeight: [100, 900],
  headingLetterSpacing: [-10, 50],
  cornerRadius: [0, 40],
  buttonRadius: [0, 999],
  containerWidth: [640, 2400],
};

/**
 * Normalises stored tokens into a known-good ThemeTokens.
 *
 * This is the only way tokens enter the app — the save action resolves what it
 * is handed, and every read resolves what it loads — so validating here covers
 * both directions at once, including rows written before this existed.
 *
 * It matters more than ordinary input tidying because these values are
 * interpolated into a `<style>` element. A colour of `red</style><script>…`
 * would otherwise escape the stylesheet and become markup, so anything that
 * isn't recognisably a colour, a known keyword, or a number in range is
 * discarded in favour of the default rather than being passed through.
 */
export function resolveThemeTokens(stored: unknown): ThemeTokens {
  const raw = (stored ?? {}) as Record<string, unknown>;
  const out: ThemeTokens = { ...THEME_TOKEN_DEFAULTS };

  for (const key of Object.keys(THEME_TOKEN_DEFAULTS) as (keyof ThemeTokens)[]) {
    const value = raw[key];
    if (value === undefined || value === null) continue;

    const allowed = COLOR_FIELDS[key];
    if (allowed) {
      if (typeof value === "string" && (HEX.test(value) || allowed.includes(value))) {
        (out[key] as string) = value;
      }
      continue;
    }

    const range = NUMBER_FIELDS[key];
    if (range) {
      const n = Number(value);
      if (Number.isFinite(n)) (out[key] as number) = Math.min(range[1], Math.max(range[0], Math.round(n)));
      continue;
    }

    if (key === "adminSkin") {
      out.adminSkin = Boolean(value);
      continue;
    }

    // An uploaded logo ends up in both an <img src> and a CSS url(), so it is
    // held to the same standard as a colour: recognisably safe, or dropped.
    if (key === "logoUrl") {
      out.logoUrl = safeAssetUrl(value) ?? "";
      continue;
    }

    // Held to the logo's standard for the same reason: it is interpolated into
    // a <link href>, so anything not recognisably an asset URL is dropped.
    if (key === "faviconUrl") {
      out.faviconUrl = safeAssetUrl(value) ?? "";
      continue;
    }

    if (key === "headingFont" || key === "bodyFont") {
      if (typeof value === "string" && FONT_TOKEN.test(value)) out[key] = value;
      continue;
    }
  }

  return out;
}

/** Text colour for a background, honouring an explicit override or deriving one. */
export function resolveTextColor(background: string, setting: string): string {
  return setting === AUTO ? autoTextColor(background) : setting;
}

/**
 * The colour the logo is drawn in, or null to leave the artwork as-is.
 *
 * "auto" reads whatever is behind it — the header on the storefront — so a dark
 * header gets a light logo without anyone having to think about it.
 */
export function resolveLogoColor(tokens: ThemeTokens, behind: string): string | null {
  if (tokens.logoColor === "original") return null;
  if (tokens.logoColor === "brand") return tokens.accent;
  if (tokens.logoColor === AUTO) return autoTextColor(behind);
  return tokens.logoColor;
}

/**
 * The CSS-variable overrides for the admin panel.
 *
 * Separate from the storefront's because the admin has a different job: it must
 * stay legible while you're mid-experiment with a colour that might be terrible.
 * The brand hue still drives buttons, links and active navigation, but surfaces
 * are a heavily desaturated tint and text is clamped until it clears AA against
 * that tint — so no brand colour, however pale or garish, can lock you out of
 * the panel you'd use to fix it.
 */
export function adminThemeCss(tokens: ThemeTokens): string {
  if (!tokens.adminSkin) return "";
  if (tokens.accent === THEME_TOKEN_DEFAULTS.accent) return "";

  const ramp = brandRamp(tokens.accent);
  if (!ramp) return "";

  const ground = tint(tokens.accent, 0.965);
  const surface = tint(tokens.accent, 0.995);
  const ink = clampForContrast("#221a1a", ground, 7);
  const inkSoft = clampForContrast("#4a3f3f", ground, 4.5);
  const border = tint(tokens.accent, 0.9);

  // Buttons use the ramp's 500, and their label has to survive it. A mid-tone
  // accent is the awkward case: neither white nor near-black clears AA against
  // a mid grey, so picking the better of the two isn't enough. When that
  // happens the button colour itself is moved away from the middle until its
  // label is readable — the hue is kept, only the lightness gives.
  let button = ramp[500];
  let onAccent = autoTextColor(button);
  if (contrastRatio(button, onAccent) < AA_NORMAL) {
    button = clampForContrast(button, onAccent, AA_NORMAL);
    onAccent = autoTextColor(button);
  }

  return `:root{--color-brand-50:${ramp[50]};--color-brand-100:${ramp[100]};--color-brand-300:${ramp[300]};--color-brand-500:${button};--color-brand-600:${ramp[600]};--color-brand-700:${ramp[700]};--color-canvas:${ground};--background:${ground};--color-subtle:${ramp[100]};--color-ink:${ink};--foreground:${ink};--color-ink-soft:${inkSoft};--color-border:${border};--shp-surface:${surface};--shp-on-accent:${onAccent};}`;
}

/** An uploaded font, as needed to build its @font-face rule. */
export type CustomFont = { id: string; name: string; url: string; format: string };

/** Theme tokens reference an uploaded font as "custom:<FontAsset id>". */
export const CUSTOM_FONT_PREFIX = "custom:";

export function customFontId(tokenValue: string): string | null {
  return tokenValue.startsWith(CUSTOM_FONT_PREFIX) ? tokenValue.slice(CUSTOM_FONT_PREFIX.length) : null;
}

/** CSS-safe family name for an uploaded font. */
function customFamily(id: string): string {
  return `sd-font-${id}`;
}

function fontStack(key: string, fallback: string, fonts: CustomFont[]): string {
  const id = customFontId(key);
  if (id) {
    const font = fonts.find((f) => f.id === id);
    // Falls back to the built-in stack if the font was deleted out from under
    // the token, rather than rendering in an unstyled default.
    if (font) return `"${customFamily(font.id)}", ${fallback}`;
    return fallback;
  }
  return FONT_STACKS[key]?.stack ?? fallback;
}

function fontFaceRules(tokens: ThemeTokens, fonts: CustomFont[]): string {
  const used = new Set(
    [customFontId(tokens.headingFont), customFontId(tokens.bodyFont)].filter(Boolean) as string[]
  );
  return fonts
    .filter((f) => used.has(f.id))
    .map(
      (f) =>
        `@font-face{font-family:"${customFamily(f.id)}";src:url("${f.url}") format("${
          CSS_FONT_FORMAT[f.format as keyof typeof CSS_FONT_FORMAT] ?? "woff2"
        }");font-display:swap;}`
    )
    .join("");
}

/**
 * Builds the CSS that overrides globals.css for these tokens.
 *
 * Returns "" when the tokens are untouched defaults, so an unthemed store ships
 * no extra style block at all.
 */
export function themeTokensToCss(tokens: ThemeTokens, fonts: CustomFont[] = []): string {
  const isDefault = (Object.keys(THEME_TOKEN_DEFAULTS) as (keyof ThemeTokens)[]).every(
    (k) => tokens[k] === THEME_TOKEN_DEFAULTS[k]
  );
  if (isDefault) return "";

  const ramp = brandRamp(tokens.accent);
  const decls: string[] = [];

  if (ramp) {
    decls.push(
      `--color-brand-50:${ramp[50]}`,
      `--color-brand-100:${ramp[100]}`,
      `--color-brand-300:${ramp[300]}`,
      `--color-brand-500:${ramp[500]}`,
      `--color-brand-600:${ramp[600]}`,
      `--color-brand-700:${ramp[700]}`
    );
  }

  decls.push(
    `--color-canvas:${tokens.pageBackground}`,
    `--background:${tokens.pageBackground}`,
    `--color-ink:${tokens.textPrimary}`,
    `--foreground:${tokens.textPrimary}`,
    `--color-ink-soft:${tokens.textMuted}`,
    `--color-border:${tokens.border}`,
    `--shp-surface:${tokens.surface}`,
    `--shp-accent-contrast:${tokens.accentContrast}`,
    `--shp-secondary:${tokens.secondary}`,
    `--shp-header-bg:${tokens.headerBackground}`,
    `--shp-header-text:${resolveTextColor(tokens.headerBackground, tokens.headerText)}`,
    `--shp-footer-bg:${tokens.footerBackground}`,
    `--shp-footer-text:${resolveTextColor(tokens.footerBackground, tokens.footerText)}`,
    `--font-sans:${fontStack(tokens.bodyFont, "system-ui, sans-serif", fonts)}`,
    `--font-serif:${fontStack(tokens.headingFont, "Georgia, serif", fonts)}`,
    // Tailwind v4 resolves rounded-* utilities through these.
    `--radius-md:${Math.max(0, tokens.cornerRadius - 2)}px`,
    `--radius-lg:${tokens.cornerRadius}px`,
    `--radius-xl:${tokens.cornerRadius + 4}px`,
    `--shp-button-radius:${tokens.buttonRadius}px`,
    `--shp-container:${tokens.containerWidth}px`
  );

  const headings = [
    `font-weight:${tokens.headingWeight}`,
    `letter-spacing:${(tokens.headingLetterSpacing / 100).toFixed(3)}em`,
  ].join(";");

  return [
    fontFaceRules(tokens, fonts),
    `:root{${decls.join(";")}}`,
    `html{font-size:${tokens.baseFontSize}px}`,
    `h1,h2,h3{${headings}}`,
    // Pill-vs-square buttons: every CTA in the app uses rounded-full, so this
    // is the one override that makes the shape setting real.
    `.rounded-full{border-radius:var(--shp-button-radius)}`,
  ].join("");
}
