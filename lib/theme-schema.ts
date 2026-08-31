// The Theme panel's field list, in the same declarative shape as section
// settings — so it renders through the very same SettingFieldInput component
// rather than a second hand-built form.

import type { SettingField } from "@/lib/section-schema";
import { FONT_STACKS, THEME_TOKEN_DEFAULTS } from "@/lib/theme-tokens";

const fontOptions = Object.entries(FONT_STACKS).map(([value, { label }]) => ({ value, label }));

export type ThemeGroup = { title: string; fields: SettingField[] };

export const THEME_GROUPS: ThemeGroup[] = [
  {
    title: "Colour",
    fields: [
      {
        key: "accent",
        kind: "color",
        label: "Accent",
        info: "Buttons, links and highlights. Overrides the accent colour in Global Edits.",
        default: THEME_TOKEN_DEFAULTS.accent,
      },
      { key: "accentContrast", kind: "color", label: "Text on accent",
        info: "Used for text and icons sitting on top of the accent colour, like button labels.", default: THEME_TOKEN_DEFAULTS.accentContrast },
      { key: "pageBackground", kind: "color", label: "Page background",
        info: "The colour behind every page.", default: THEME_TOKEN_DEFAULTS.pageBackground },
      { key: "surface", kind: "color", label: "Card background",
        info: "The colour behind product cards, panels and form fields.", default: THEME_TOKEN_DEFAULTS.surface },
      { key: "textPrimary", kind: "color", label: "Body text",
        info: "The main reading colour for paragraphs and headings.", default: THEME_TOKEN_DEFAULTS.textPrimary },
      { key: "textMuted", kind: "color", label: "Muted text",
        info: "Secondary text, captions, help text, prices that are struck through.", default: THEME_TOKEN_DEFAULTS.textMuted },
      { key: "border", kind: "color", label: "Borders",
        info: "Hairlines around cards, inputs and dividers.", default: THEME_TOKEN_DEFAULTS.border },
      {
        key: "secondary",
        kind: "color",
        label: "Secondary",
        info: "A supporting colour for highlights and quieter accents, alongside the main accent.",
        default: THEME_TOKEN_DEFAULTS.secondary,
      },
    ],
  },
  {
    title: "Header & footer",
    fields: [
      {
        key: "headerBackground",
        kind: "color",
        label: "Header background",
        info: "The bar across the top of every page.",
        default: THEME_TOKEN_DEFAULTS.headerBackground,
        affects: "All pages",
      },
      {
        key: "headerText",
        kind: "contrast-text",
        label: "Header text",
        info: "Left on automatic, this picks whichever of light or dark reads best on your header colour. Any option you choose instead is one that passes the contrast standard.",
        default: THEME_TOKEN_DEFAULTS.headerText,
        contrastAgainst: "headerBackground",
      },
      {
        key: "footerBackground",
        kind: "color",
        label: "Footer background",
        info: "The band at the bottom of every page.",
        default: THEME_TOKEN_DEFAULTS.footerBackground,
        affects: "All pages",
      },
      {
        key: "footerText",
        kind: "contrast-text",
        label: "Footer text",
        info: "Automatic by default, matching however you colour the footer.",
        default: THEME_TOKEN_DEFAULTS.footerText,
        contrastAgainst: "footerBackground",
      },
    ],
  },
  {
    title: "Logo & favicon",
    fields: [
      {
        key: "logoUrl",
        kind: "logo",
        label: "Logo image",
        info: "Upload your own logo as an SVG or PNG file, up to 2 MB. SVG stays crisp at any size and is what re-tinting works best with. Leave it empty to use the logo the store shipped with.",
        default: THEME_TOKEN_DEFAULTS.logoUrl,
      },
      {
        key: "logoHeight",
        kind: "range",
        label: "Logo height",
        info: "How tall the logo sits in the header, in pixels. The width follows your artwork's own proportions.",
        default: THEME_TOKEN_DEFAULTS.logoHeight,
        min: 12,
        max: 120,
        step: 1,
        unit: "px",
      },
      {
        key: "logoColor",
        kind: "select",
        label: "Logo colour",
        info: "Your logo is a single-colour mark, so it can be re-tinted. Automatic reads your header colour and picks light or dark to suit.",
        default: THEME_TOKEN_DEFAULTS.logoColor,
        options: [
          { value: "original", label: "Original artwork" },
          { value: "brand", label: "Match accent colour" },
          { value: "auto", label: "Automatic (light or dark)" },
        ],
      },
      {
        key: "faviconUrl",
        kind: "favicon",
        label: "Favicon",
        info: "The small icon on the browser tab and in a bookmark. A square SVG or PNG, up to 2 MB. It is drawn at about 16 pixels, so use the part of your mark that still reads at that size rather than a full wordmark. Leave it empty and the tab shows the platform's icon.",
        default: THEME_TOKEN_DEFAULTS.faviconUrl,
      },
    ],
  },
  {
    title: "Typography",
    fields: [
      {
        key: "headingFont",
        kind: "select",
        label: "Heading font",
        info: "Used for page titles and section headings.",
        default: THEME_TOKEN_DEFAULTS.headingFont,
        options: fontOptions,
      },
      {
        key: "bodyFont",
        kind: "select",
        label: "Body font",
        info: "Used for paragraphs, buttons and everything that is not a heading.",
        default: THEME_TOKEN_DEFAULTS.bodyFont,
        options: fontOptions,
      },
      {
        key: "baseFontSize",
        kind: "range",
        label: "Base text size",
        info: "The size of normal paragraph text. Everything else scales from this.",
        default: THEME_TOKEN_DEFAULTS.baseFontSize,
        min: 13,
        max: 20,
        step: 1,
        unit: "px",
      },
      {
        key: "headingWeight",
        kind: "select",
        label: "Heading weight",
        info: "How bold headings appear.",
        default: THEME_TOKEN_DEFAULTS.headingWeight,
        options: [
          { value: "500", label: "Medium" },
          { value: "600", label: "Semibold" },
          { value: "700", label: "Bold" },
        ],
      },
      {
        key: "headingLetterSpacing",
        kind: "range",
        label: "Heading letter spacing",
        info: "Tightens or opens up the space between letters in headings.",
        default: THEME_TOKEN_DEFAULTS.headingLetterSpacing,
        min: -3,
        max: 20,
        step: 1,
        unit: "/100em",
      },
    ],
  },
  {
    title: "Shape & layout",
    fields: [
      {
        key: "cornerRadius",
        kind: "range",
        label: "Corner rounding",
        info: "Applies to cards, images and input fields.",
        default: THEME_TOKEN_DEFAULTS.cornerRadius,
        min: 0,
        max: 24,
        step: 1,
        unit: "px",
      },
      {
        key: "buttonRadius",
        kind: "range",
        label: "Button rounding",
        info: "0 for square, high for pill-shaped.",
        default: THEME_TOKEN_DEFAULTS.buttonRadius,
        min: 0,
        max: 999,
        step: 1,
        unit: "px",
      },
      {
        key: "containerWidth",
        kind: "range",
        label: "Content width",
        info: "How wide the page content sits on a large screen. Narrower feels more editorial; wider fits more products per row.",
        default: THEME_TOKEN_DEFAULTS.containerWidth,
        min: 960,
        max: 1600,
        step: 20,
        unit: "px",
      },
    ],
  },
];

/** Fields whose stored value is numeric but whose input yields a string. */
const NUMERIC_KEYS = new Set(["headingWeight"]);

export function coerceThemeValue(key: string, value: unknown): unknown {
  return NUMERIC_KEYS.has(key) ? Number(value) : value;
}
