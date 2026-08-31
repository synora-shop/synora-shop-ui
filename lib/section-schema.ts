// The section schema registry.
//
// Every storefront section type declares — as data — what settings it has and
// what input each one needs. Nothing in the customizer UI is hand-written per
// section type: it reads these schemas and generates the entire settings panel
// from them. Adding a section type means adding a renderer plus an entry here,
// and the editor picks it up for free.
//
// This is deliberately the same shape a third-party theme would ship, so the
// eventual "upload a theme" feature is a validator over this format rather than
// a new system. That's also why it is pure data with no executable behavior —
// an uploaded theme must never be able to run code on the server.
//
// Client-safe: no Prisma, no next/headers. Imported by both the storefront
// renderers and the (client) customizer.

export type FieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "color"
  | "range"
  | "number"
  | "select"
  | "checkbox"
  | "url"
  | "collection"
  | "product"
  /** A logo upload: SVG or PNG, sanitised and scanned before storage. */
  | "logo"
  /** A favicon upload. Same hardened path as a logo, previewed at tab size. */
  | "favicon"
  /**
   * A text colour chosen for readability against another field's colour.
   * Offers "automatic" plus only those options that clear WCAG AA, so an
   * unreadable combination can't be picked in the first place. Requires
   * `contrastAgainst`.
   */
  | "contrast-text";

export type SelectOption = { value: string; label: string };

/**
 * A setting can be disabled by the state of another setting — declared as data,
 * never as a predicate function, so this stays serialisable and an uploaded
 * theme can express it without shipping code.
 */
export type DisabledWhen = {
  /** Another field in the same section (or theme group). */
  field: string;
  /** Disabled while that field equals this value. */
  equals?: unknown;
  /** Disabled while that field does NOT equal this value. */
  notEquals?: unknown;
  /** Shown in place of the input, explaining what's taking precedence. */
  message: string;
};

export type SettingField = {
  key: string;
  kind: FieldKind;
  label: string;
  /**
   * Plain-language help, shown under every input.
   *
   * Required on purpose: "every option has an 'i' icon explaining it, including
   * every feature added in future" only holds if it can't be skipped. Making
   * this non-optional turns that from a habit into a compile error.
   */
  info: string;
  default: unknown;
  placeholder?: string;
  /** Where a change lands, when it isn't obvious from the panel you're in. */
  affects?: string;
  /** Greyed out while another setting overrides it. */
  disabledWhen?: DisabledWhen;
  /** contrast-text only: the key of the background colour this sits on. */
  contrastAgainst?: string;
  /** select only */
  options?: SelectOption[];
  /** range / number only */
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
};

/** Evaluates a `disabledWhen` rule against the current values. */
export function isFieldDisabled(
  field: SettingField,
  values: Record<string, unknown>
): { disabled: boolean; message?: string } {
  const rule = field.disabledWhen;
  if (!rule) return { disabled: false };
  const current = values[rule.field];
  if ("equals" in rule && current === rule.equals) return { disabled: true, message: rule.message };
  if ("notEquals" in rule && current !== rule.notEquals) return { disabled: true, message: rule.message };
  return { disabled: false };
}

/** A repeatable child item within a section (a slide, an FAQ, a testimonial). */
export type BlockSchema = {
  /** Where the array lives inside the section's `data` (e.g. "slides"). */
  key: string;
  /** Singular noun used in the UI: "Add slide". */
  label: string;
  /** Field used as the row's title in the block list, when present. */
  titleField?: string;
  fields: SettingField[];
  max?: number;
};

export type SectionSchema = {
  type: string;
  label: string;
  description?: string;
  /** Grouping in the "Add section" picker. */
  category: "Layout" | "Content" | "Commerce" | "Media";
  fields: SettingField[];
  blocks?: BlockSchema;
  /** Only one of these may exist per page (e.g. a page header). */
  singleton?: boolean;
};

// ---------------------------------------------------------------------------
// Common style settings
//
// Appended to every section so each one gets padding/background/width controls
// without its schema repeating them. Stored under a reserved key so they can
// never collide with a section's own field names — and so a theme author can't
// accidentally shadow them.
// ---------------------------------------------------------------------------

export const STYLE_KEY = "__style";

export const STYLE_FIELDS: SettingField[] = [
  {
    key: "paddingTop",
    kind: "range",
    label: "Top spacing",
    info: "Empty space above this section. Raise it to separate this section from the one above.",
    default: 48,
    min: 0,
    max: 160,
    step: 4,
    unit: "px",
  },
  {
    key: "paddingBottom",
    kind: "range",
    label: "Bottom spacing",
    info: "Empty space below this section.",
    default: 48,
    min: 0,
    max: 160,
    step: 4,
    unit: "px",
  },
  {
    key: "background",
    kind: "select",
    label: "Background",
    info: "The colour behind this section. Alternating backgrounds is an easy way to separate sections without extra spacing.",
    default: "none",
    options: [
      { value: "none", label: "None" },
      { value: "canvas", label: "Cream" },
      { value: "subtle", label: "Blush" },
      { value: "accent", label: "Accent" },
      { value: "custom", label: "Custom colour" },
    ],
  },
  {
    key: "backgroundCustom",
    kind: "color",
    label: "Custom background",
    info: "Your own background colour for this section.",
    default: "#ffffff",
    disabledWhen: {
      field: "background",
      notEquals: "custom",
      message: "Set Background to “Custom colour” to use this.",
    },
  },
  {
    key: "width",
    kind: "select",
    label: "Content width",
    info: "How wide the content sits. Narrow suits long text; Full width suits images that should reach the screen edges.",
    default: "container",
    options: [
      { value: "container", label: "Standard" },
      { value: "narrow", label: "Narrow" },
      { value: "full", label: "Full width" },
    ],
  },
];

export type SectionStyle = {
  paddingTop: number;
  paddingBottom: number;
  background: string;
  backgroundCustom: string;
  width: string;
};

export const DEFAULT_SECTION_STYLE: SectionStyle = {
  paddingTop: 48,
  paddingBottom: 48,
  background: "none",
  backgroundCustom: "#ffffff",
  width: "container",
};

// ---------------------------------------------------------------------------
// Reusable field builders — keeps the schemas below readable.
// ---------------------------------------------------------------------------

const heading = (
  dflt: string,
  label = "Heading",
  info = "The large text at the top of this section. Leave it empty to hide it."
): SettingField => ({
  key: "heading",
  kind: "text",
  label,
  info,
  default: dflt,
});

const body = (
  dflt = "",
  label = "Text",
  info = "The paragraph under the heading. Line breaks are kept as you type them."
): SettingField => ({
  key: "body",
  kind: "richtext",
  label,
  info,
  default: dflt,
});

const image = (
  label = "Image",
  key = "image",
  info = "Upload or paste an image. Landscape photos work best; anything very tall gets cropped."
): SettingField => ({
  key,
  kind: "image",
  label,
  info,
  default: "",
});

const ctaPair = (labelDefault = ""): SettingField[] => [
  {
    key: "ctaLabel",
    kind: "text",
    label: "Button label",
    info: "The words on the button. Leave empty and no button appears.",
    default: labelDefault,
    placeholder: "Shop now",
  },
  {
    key: "ctaHref",
    kind: "url",
    label: "Button link",
    info: "Where the button goes. A path on this site like /shop, or a full https:// address.",
    default: "",
    placeholder: "/shop",
  },
];

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

export const SECTION_SCHEMAS: Record<string, SectionSchema> = {
  HERO_SLIDESHOW: {
    type: "HERO_SLIDESHOW",
    label: "Hero Slideshow",
    description: "Full-width rotating banner, usually the first thing on the homepage.",
    category: "Media",
    fields: [
      {
        key: "autoplaySeconds",
        kind: "range",
        label: "Seconds per slide",
        info: "How long each slide stays before moving to the next one.",
        default: 6,
        min: 3,
        max: 15,
        step: 1,
        unit: "s",
      },
      {
        key: "height",
        kind: "select",
        label: "Height",
        info: "How tall the banner is. Full screen fills the whole window before any scrolling.",
        default: "large",
        options: [
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "full", label: "Full screen" },
        ],
      },
      {
        key: "overlayOpacity",
        kind: "range",
        label: "Image darkening",
        info: "Darkens the photo behind the text. Raise it if the headline is hard to read over a busy image.",
        default: 30,
        min: 0,
        max: 80,
        step: 5,
        unit: "%",
      },
    ],
    blocks: {
      key: "slides",
      label: "Slide",
      titleField: "headline",
      max: 8,
      fields: [
        image("Background image"),
        { key: "eyebrow", kind: "text", label: "Eyebrow", info: "Small line above the headline, e.g. \"New Season\". Optional.", default: "", placeholder: "New Season" },
        { key: "headline", kind: "text", label: "Headline", info: "The main line of this slide.", default: "Your headline" },
        { key: "subheading", kind: "textarea", label: "Subheading", info: "A sentence under the headline. Optional.", default: "" },
        ...ctaPair("Shop the Collection"),
      ],
    },
  },

  BANNER: {
    type: "BANNER",
    label: "Banner",
    description: "A single promotional image with a headline and button.",
    category: "Media",
    fields: [
      image("Background image"),
      heading("New banner", "Headline"),
      ...ctaPair(),
      {
        key: "textAlign",
        kind: "select",
        label: "Text position",
        info: "Which side of the banner the text sits on.",
        default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },

  CATEGORY_GRID: {
    type: "CATEGORY_GRID",
    label: "Category Grid",
    description: "Tiles linking to each collection. Always reflects your live categories.",
    category: "Commerce",
    fields: [
      heading("Shop by Category"),
      {
        key: "columns",
        kind: "range",
        label: "Columns",
        info: "How many tiles sit side by side on a desktop screen. Phones always show two.",
        default: 4,
        min: 2,
        max: 6,
        step: 1,
      },
    ],
  },

  FEATURED_PRODUCTS: {
    type: "FEATURED_PRODUCTS",
    label: "Featured Products",
    description: "Products you've marked as featured in the catalog.",
    category: "Commerce",
    fields: [
      heading("Best Sellers"),
      {
        key: "limit",
        kind: "range",
        label: "Products shown",
        info: "The maximum number of featured products to display here.",
        default: 8,
        min: 2,
        max: 16,
        step: 1,
      },
      {
        key: "columns",
        kind: "range",
        label: "Columns",
        info: "How many products sit side by side on a desktop screen. Phones always show two.",
        default: 4,
        min: 2,
        max: 5,
        step: 1,
      },
    ],
  },

  TEXT_BLOCK: {
    type: "TEXT_BLOCK",
    label: "Text Block",
    description: "A heading and paragraph, optionally with an image.",
    category: "Content",
    fields: [
      heading("Heading"),
      body(),
      image("Image (optional)"),
      {
        key: "textAlign",
        kind: "select",
        label: "Alignment",
        info: "Whether the text is left-aligned or centred.",
        default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
    ],
  },

  IMAGE_TEXT: {
    type: "IMAGE_TEXT",
    label: "Image + Text",
    description: "An image beside a block of text.",
    category: "Content",
    fields: [
      image(),
      heading("Heading"),
      body(),
      {
        key: "imagePosition",
        kind: "select",
        label: "Image side",
        info: "Which side the image sits on. The text takes the other half.",
        default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
      ...ctaPair(),
    ],
  },

  STORY: {
    type: "STORY",
    label: "Story",
    description: "Centred brand statement with a call to action.",
    category: "Content",
    fields: [heading("Our Story"), body(), ...ctaPair("Read our story")],
  },

  FAQ_LIST: {
    type: "FAQ_LIST",
    label: "FAQ List",
    description: "Expandable question and answer list.",
    category: "Content",
    fields: [heading("Frequently Asked Questions")],
    blocks: {
      key: "items",
      label: "Question",
      titleField: "question",
      fields: [
        { key: "question", kind: "text", label: "Question", info: "The question customers click to expand.", default: "New question" },
        { key: "answer", kind: "textarea", label: "Answer", info: "The answer shown when the question is expanded.", default: "" },
      ],
    },
  },

  /* ---------------------------------------------------------------- blog -- */

  ARTICLE_LIST: {
    type: "ARTICLE_LIST",
    label: "Blog posts",
    description: "Your latest posts, newest first.",
    category: "Content",
    fields: [
      heading("From the blog"),
      {
        key: "limit",
        kind: "range",
        label: "How many posts",
        info: "The most recent this many. Older posts stay on the blog page.",
        default: 3,
        min: 1,
        max: 12,
        step: 1,
      },
      {
        key: "columns",
        kind: "range",
        label: "Columns",
        info: "How many posts sit side by side on a wide screen.",
        default: 3,
        min: 1,
        max: 4,
        step: 1,
      },
      {
        key: "showExcerpt",
        kind: "checkbox",
        label: "Show a summary under each title",
        info: "Turn this off for a tighter list of headlines.",
        default: true,
      },
    ],
  },

  /* ---------------------------------------------------------- restaurant -- */

  MENU_LIST: {
    type: "MENU_LIST",
    label: "Menu",
    description: "Your dishes grouped by course and priced, with nothing to click.",
    category: "Content",
    fields: [
      heading("Our menu"),
      {
        key: "showDescriptions",
        kind: "checkbox",
        label: "Show a description under each dish",
        info: "Turn this off for a short menu that fits on one screen.",
        default: true,
      },
      {
        key: "showImages",
        kind: "checkbox",
        label: "Show a photo beside each dish",
        info: "Best kept off unless every dish has a good photo. A half photographed menu looks unfinished.",
        default: false,
      },
    ],
  },

  OPENING_HOURS: {
    type: "OPENING_HOURS",
    label: "Opening hours",
    description: "When you are open, with today highlighted.",
    category: "Content",
    fields: [
      heading("Opening hours"),
      {
        key: "note",
        kind: "text",
        label: "Note underneath",
        info: "Anything the hours alone do not say, like a holiday closure or last orders.",
        default: "",
      },
    ],
  },

  LOCATION_INFO: {
    type: "LOCATION_INFO",
    label: "Find us",
    description: "Your address and phone number, with a link to a map.",
    category: "Content",
    fields: [
      heading("Find us"),
      {
        key: "showPhone",
        kind: "checkbox",
        label: "Show the phone number",
        info: "Turn this off if you would rather people booked online.",
        default: true,
      },
    ],
  },
};

export const SECTION_TYPES = Object.keys(SECTION_SCHEMAS);

export function getSectionSchema(type: string): SectionSchema | undefined {
  return SECTION_SCHEMAS[type];
}

/** Human label for a section type, falling back to the raw type for unknown ones. */
export function sectionLabel(type: string): string {
  return SECTION_SCHEMAS[type]?.label ?? type;
}

/** Starting `data` for a newly added section, derived from its schema's defaults. */
export function defaultSectionData(type: string): Record<string, unknown> {
  const schema = SECTION_SCHEMAS[type];
  if (!schema) return {};
  const data: Record<string, unknown> = {};
  for (const field of schema.fields) data[field.key] = field.default;
  if (schema.blocks) data[schema.blocks.key] = [];
  data[STYLE_KEY] = { ...DEFAULT_SECTION_STYLE };
  return data;
}

/** Starting values for one new repeatable block. */
export function defaultBlockData(schema: BlockSchema): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of schema.fields) data[field.key] = field.default;
  return data;
}

/**
 * Merges stored `data` over its schema defaults.
 *
 * Sections persisted before a field existed simply don't have it, and a theme
 * may ship a section with fields this store has never set — in both cases the
 * renderer should see the default rather than `undefined`. Same
 * defaults-underneath approach as lib/site-text.ts and lib/global-edits.ts.
 */
export function resolveSectionData(type: string, stored: unknown): Record<string, unknown> {
  const raw = (stored ?? {}) as Record<string, unknown>;
  const schema = SECTION_SCHEMAS[type];
  if (!schema) return raw;

  const resolved: Record<string, unknown> = {};
  for (const field of schema.fields) {
    resolved[field.key] = raw[field.key] ?? field.default;
  }
  if (schema.blocks) {
    const blocks = Array.isArray(raw[schema.blocks.key]) ? (raw[schema.blocks.key] as unknown[]) : [];
    resolved[schema.blocks.key] = blocks.map((block) => {
      const b = (block ?? {}) as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const field of schema.blocks!.fields) out[field.key] = b[field.key] ?? field.default;
      return out;
    });
  }
  resolved[STYLE_KEY] = { ...DEFAULT_SECTION_STYLE, ...((raw[STYLE_KEY] as object) ?? {}) };
  return resolved;
}

export function resolveSectionStyle(stored: unknown): SectionStyle {
  const raw = (stored ?? {}) as Record<string, unknown>;
  return { ...DEFAULT_SECTION_STYLE, ...((raw[STYLE_KEY] as Partial<SectionStyle>) ?? {}) };
}
