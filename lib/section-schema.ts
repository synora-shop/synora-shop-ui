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

  /* ------------------------------------------------------------- media -- */

  VIDEO: {
    type: "VIDEO",
    label: "Video",
    description: "A video with optional words over it. Takes a YouTube, Vimeo or direct link.",
    category: "Media",
    fields: [
      {
        key: "url",
        kind: "url",
        label: "Video link",
        info: "A YouTube or Vimeo page link, or a direct link to an .mp4 file. Leave empty and nothing shows.",
        default: "",
        placeholder: "https://www.youtube.com/watch?v=…",
      },
      image("Cover image", "poster", "Shown before the video plays, and while it loads. Optional but worth setting — without one the area is black."),
      heading("", "Heading", "Large text over the video. Leave empty for no words at all."),
      body("", "Text", "A line under the heading."),
      {
        key: "height",
        kind: "select",
        label: "Height",
        info: "How tall the video area is.",
        default: "medium",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      {
        key: "overlayOpacity",
        kind: "range",
        label: "Darkening",
        info: "Darkens the video behind the words. Raise it if the heading is hard to read.",
        default: 30,
        min: 0,
        max: 80,
        step: 5,
        unit: "%",
      },
      ...ctaPair(""),
    ],
  },

  IMAGE_COMPARISON: {
    type: "IMAGE_COMPARISON",
    label: "Before and after",
    description: "Two photos with a slider between them. For anything you change, clean or restore.",
    category: "Media",
    fields: [
      heading("Before and after"),
      image("Before photo", "beforeImage", "The starting state. Both photos should be the same size and taken from the same spot, or the slider looks broken."),
      image("After photo", "afterImage", "The finished state."),
      {
        key: "beforeLabel",
        kind: "text",
        label: "Before label",
        info: "The small caption on the left half.",
        default: "Before",
      },
      {
        key: "afterLabel",
        kind: "text",
        label: "After label",
        info: "The small caption on the right half.",
        default: "After",
      },
      {
        key: "startAt",
        kind: "range",
        label: "Slider starting position",
        info: "Where the divider sits before anyone touches it.",
        default: 50,
        min: 10,
        max: 90,
        step: 5,
        unit: "%",
      },
    ],
  },

  GALLERY: {
    type: "GALLERY",
    label: "Gallery",
    description: "A grid of photos. For a lookbook, a workshop, or anything you want seen large.",
    category: "Media",
    fields: [
      heading("", "Heading", "Optional title above the photos."),
      {
        key: "columns",
        kind: "range",
        label: "Photos per row",
        info: "On a phone this is always two, whatever you choose here.",
        default: 3,
        min: 2,
        max: 5,
        step: 1,
      },
      {
        key: "shape",
        kind: "select",
        label: "Photo shape",
        info: "Every photo is cropped to this shape so the rows line up.",
        default: "square",
        options: [
          { value: "square", label: "Square" },
          { value: "portrait", label: "Portrait" },
          { value: "landscape", label: "Landscape" },
        ],
      },
    ],
    blocks: {
      key: "images",
      label: "Photo",
      titleField: "caption",
      max: 24,
      fields: [
        image("Photo"),
        {
          key: "caption",
          kind: "text",
          label: "Caption",
          info: "Shown under the photo. Optional.",
          default: "",
        },
        {
          key: "href",
          kind: "url",
          label: "Link",
          info: "Where clicking this photo goes. Leave empty and it is not clickable.",
          default: "",
          placeholder: "/shop",
        },
      ],
    },
  },

  MARQUEE: {
    type: "MARQUEE",
    label: "Scrolling text",
    description: "A band of text sliding across the page. For a promise, an offer, or a shipping note.",
    category: "Media",
    fields: [
      {
        key: "text",
        kind: "text",
        label: "Text",
        info: "The words that scroll. Short works best — this is read at a glance.",
        // Deliberately free of any currency. A default that names one is wrong
        // for every shop that does not trade in it, and the merchant editing
        // this line knows their own.
        default: "Free delivery on every order",
      },
      {
        key: "separator",
        kind: "text",
        label: "Separator",
        info: "Printed between each repeat of the text.",
        default: "•",
      },
      {
        key: "speed",
        kind: "range",
        label: "Speed",
        info: "Seconds for one full pass. Higher is slower.",
        default: 24,
        min: 8,
        max: 60,
        step: 2,
        unit: "s",
      },
      {
        key: "size",
        kind: "select",
        label: "Text size",
        info: "How large the scrolling words are.",
        default: "medium",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
    ],
  },

  COLLAGE: {
    type: "COLLAGE",
    label: "Collage",
    description: "A few images of different sizes, each linking somewhere. For a seasonal edit.",
    category: "Media",
    fields: [
      heading("", "Heading", "Optional title above the collage."),
      {
        key: "layout",
        kind: "select",
        label: "Arrangement",
        info: "Which tile is the large one.",
        default: "leftLarge",
        options: [
          { value: "leftLarge", label: "Large on the left" },
          { value: "rightLarge", label: "Large on the right" },
          { value: "even", label: "All the same size" },
        ],
      },
    ],
    blocks: {
      key: "tiles",
      label: "Tile",
      titleField: "label",
      max: 5,
      fields: [
        image("Image"),
        {
          key: "label",
          kind: "text",
          label: "Label",
          info: "The words over the image.",
          default: "",
          placeholder: "New in",
        },
        {
          key: "href",
          kind: "url",
          label: "Link",
          info: "Where this tile goes.",
          default: "",
          placeholder: "/shop",
        },
      ],
    },
  },

  LOGO_LIST: {
    type: "LOGO_LIST",
    label: "Logos",
    description: "A row of logos — brands you stock, press you have been in, payment methods.",
    category: "Media",
    fields: [
      heading("", "Heading", "Optional title, e.g. \u201cAs seen in\u201d."),
      {
        key: "grayscale",
        kind: "checkbox",
        label: "Grey them out",
        info: "Removes the colour from every logo so a row of mismatched brands looks deliberate.",
        default: true,
      },
      {
        key: "logoHeight",
        kind: "range",
        label: "Logo height",
        info: "Every logo is scaled to this height, so different shapes still line up.",
        default: 32,
        min: 16,
        max: 72,
        step: 4,
        unit: "px",
      },
    ],
    blocks: {
      key: "logos",
      label: "Logo",
      titleField: "alt",
      max: 12,
      fields: [
        image("Logo", "image", "A transparent PNG or SVG works best."),
        {
          key: "alt",
          kind: "text",
          label: "Name",
          info: "Read aloud by a screen reader, and shown if the image fails to load.",
          default: "",
        },
        {
          key: "href",
          kind: "url",
          label: "Link",
          info: "Optional. Where clicking this logo goes.",
          default: "",
        },
      ],
    },
  },

  /* ---------------------------------------------------------- commerce -- */

  PRODUCT_CAROUSEL: {
    type: "PRODUCT_CAROUSEL",
    label: "Product row",
    description: "Products in a single row that scrolls sideways. Fits more without making the page longer.",
    category: "Commerce",
    fields: [
      heading("New arrivals"),
      {
        key: "limit",
        kind: "range",
        label: "How many",
        info: "The most products to show in the row.",
        default: 8,
        min: 3,
        max: 20,
        step: 1,
      },
      {
        key: "cardWidth",
        kind: "select",
        label: "Card size",
        info: "How wide each product is, which decides how many are visible at once.",
        default: "medium",
        options: [
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
        ],
      },
      ...ctaPair("See everything"),
    ],
  },

  COLLECTION_SHOWCASE: {
    type: "COLLECTION_SHOWCASE",
    label: "Category spotlight",
    description: "One category, given the whole width — a photo, a few words, and its products.",
    category: "Commerce",
    fields: [
      {
        key: "collection",
        kind: "collection",
        label: "Category",
        info: "Which category to feature. Its own name and photo are used.",
        default: "",
      },
      heading("", "Heading", "Leave empty to use the category's own name."),
      body("", "Text", "A line about this category. Optional."),
      {
        key: "limit",
        kind: "range",
        label: "Products shown",
        info: "How many of its products to show beside it.",
        default: 4,
        min: 2,
        max: 8,
        step: 1,
      },
      {
        key: "imagePosition",
        kind: "select",
        label: "Photo side",
        info: "Which side the category photo sits on.",
        default: "left",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },

  CATEGORY_LIST: {
    type: "CATEGORY_LIST",
    label: "Category links",
    description: "Your categories as plain text links. Quiet, and quick to scan.",
    category: "Commerce",
    fields: [
      heading("Shop by category"),
      {
        key: "align",
        kind: "select",
        label: "Alignment",
        info: "Where the links sit.",
        default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
      {
        key: "showCount",
        kind: "checkbox",
        label: "Show how many products",
        info: "Puts the number of products beside each category name.",
        default: false,
      },
    ],
  },

  COMPARISON_TABLE: {
    type: "COMPARISON_TABLE",
    label: "Comparison",
    description: "A table comparing options side by side. For sizes, materials, or what is included.",
    category: "Commerce",
    fields: [
      heading("How they compare"),
      body("", "Text", "A line under the heading. Optional."),
      {
        key: "highlightColumn",
        kind: "range",
        label: "Highlight column",
        info: "Draws attention to one column. 0 highlights none.",
        default: 0,
        min: 0,
        max: 4,
        step: 1,
      },
    ],
    blocks: {
      key: "rows",
      label: "Row",
      titleField: "label",
      max: 20,
      fields: [
        {
          key: "label",
          kind: "text",
          label: "Row name",
          info: "What this row compares, e.g. \u201cFabric\u201d. The first row is used as the column headings.",
          default: "",
        },
        {
          key: "a",
          kind: "text",
          label: "Column 1",
          info: "The value in the first column. A tick or a cross works: \u2713 or \u2014.",
          default: "",
        },
        {
          key: "b",
          kind: "text",
          label: "Column 2",
          info: "The value in the second column.",
          default: "",
        },
        {
          key: "c",
          kind: "text",
          label: "Column 3",
          info: "Leave empty if you are only comparing two.",
          default: "",
        },
        {
          key: "d",
          kind: "text",
          label: "Column 4",
          info: "Leave empty if you are only comparing two or three.",
          default: "",
        },
      ],
    },
  },

  COUNTDOWN: {
    type: "COUNTDOWN",
    label: "Countdown",
    description: "A timer counting down to a date. For a sale ending or a drop landing.",
    category: "Commerce",
    fields: [
      heading("Sale ends in"),
      {
        key: "endsAt",
        kind: "text",
        label: "Ends at",
        info: "The moment it reaches zero, as YYYY-MM-DD HH:MM. Uses your store's time zone.",
        default: "",
        placeholder: "2026-12-31 23:59",
      },
      {
        key: "finishedText",
        kind: "text",
        label: "When it is over",
        info: "Shown once the time has passed, instead of the timer.",
        default: "This has ended.",
      },
      {
        key: "hideWhenFinished",
        kind: "checkbox",
        label: "Hide it once it is over",
        info: "Removes the whole section rather than showing the finished message. Safer if you might forget it is there.",
        default: false,
      },
      ...ctaPair(""),
    ],
  },

  TRUST_BADGES: {
    type: "TRUST_BADGES",
    label: "Reassurances",
    description: "Short promises with an icon — delivery, returns, genuine stock, payment.",
    category: "Commerce",
    fields: [
      heading("", "Heading", "Optional title above the row."),
      {
        key: "columns",
        kind: "range",
        label: "Per row",
        info: "On a phone these always stack two across.",
        default: 4,
        min: 2,
        max: 5,
        step: 1,
      },
    ],
    blocks: {
      key: "badges",
      label: "Reassurance",
      titleField: "title",
      max: 8,
      fields: [
        {
          key: "icon",
          kind: "select",
          label: "Icon",
          info: "A simple mark beside the words.",
          default: "truck",
          options: [
            { value: "truck", label: "Delivery" },
            { value: "returns", label: "Returns" },
            { value: "shield", label: "Secure" },
            { value: "badge", label: "Genuine" },
            { value: "support", label: "Support" },
            { value: "card", label: "Payment" },
          ],
        },
        {
          key: "title",
          kind: "text",
          label: "Title",
          info: "Two or three words.",
          default: "Free delivery",
        },
        {
          key: "text",
          kind: "text",
          label: "Detail",
          info: "One short line under the title.",
          default: "",
        },
      ],
    },
  },

  /* ----------------------------------------------------------- content -- */

  TESTIMONIALS: {
    type: "TESTIMONIALS",
    label: "Testimonials",
    description: "What customers said, in their own words.",
    category: "Content",
    fields: [
      heading("What people say"),
      {
        key: "columns",
        kind: "range",
        label: "Per row",
        info: "Quotes stack on a phone however many you choose.",
        default: 3,
        min: 1,
        max: 4,
        step: 1,
      },
      {
        key: "showRating",
        kind: "checkbox",
        label: "Show stars",
        info: "Displays the rating on each quote that has one.",
        default: true,
      },
    ],
    blocks: {
      key: "quotes",
      label: "Quote",
      titleField: "name",
      max: 12,
      fields: [
        {
          key: "quote",
          kind: "textarea",
          label: "What they said",
          info: "Their words. Shorter quotes are read; long ones are skipped.",
          default: "",
        },
        {
          key: "name",
          kind: "text",
          label: "Who said it",
          info: "A first name and a city is plenty.",
          default: "",
        },
        {
          key: "rating",
          kind: "range",
          label: "Stars",
          info: "0 shows no stars for this quote.",
          default: 5,
          min: 0,
          max: 5,
          step: 1,
        },
        image("Photo", "image", "Optional. A small round photo beside the name."),
      ],
    },
  },

  MULTICOLUMN: {
    type: "MULTICOLUMN",
    label: "Columns",
    description: "Two to four columns of icon, heading and text. For features or promises.",
    category: "Content",
    fields: [
      heading("", "Heading", "Optional title above the columns."),
      {
        key: "columns",
        kind: "range",
        label: "Per row",
        info: "How many sit across on a wide screen.",
        default: 3,
        min: 2,
        max: 4,
        step: 1,
      },
      {
        key: "align",
        kind: "select",
        label: "Alignment",
        info: "Where the text sits inside each column.",
        default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
    ],
    blocks: {
      key: "columnsList",
      label: "Column",
      titleField: "title",
      max: 8,
      fields: [
        image("Image or icon", "image", "Optional. A small picture above the heading."),
        {
          key: "title",
          kind: "text",
          label: "Heading",
          info: "A few words.",
          default: "",
        },
        {
          key: "text",
          kind: "textarea",
          label: "Text",
          info: "A sentence or two underneath.",
          default: "",
        },
        ...ctaPair(""),
      ],
    },
  },

  STEPS: {
    type: "STEPS",
    label: "How it works",
    description: "Numbered steps in order. For made-to-order, bookings, or anything with a process.",
    category: "Content",
    fields: [
      heading("How it works"),
      {
        key: "direction",
        kind: "select",
        label: "Direction",
        info: "Across the page, or down it.",
        default: "row",
        options: [
          { value: "row", label: "Across" },
          { value: "column", label: "Down" },
        ],
      },
    ],
    blocks: {
      key: "steps",
      label: "Step",
      titleField: "title",
      max: 8,
      fields: [
        {
          key: "title",
          kind: "text",
          label: "Step name",
          info: "What happens at this step.",
          default: "",
        },
        {
          key: "text",
          kind: "textarea",
          label: "Detail",
          info: "A sentence explaining it.",
          default: "",
        },
      ],
    },
  },

  TIMELINE: {
    type: "TIMELINE",
    label: "Timeline",
    description: "Dated milestones down the page. For a story, a history, a roadmap.",
    category: "Content",
    fields: [
      heading("Our story"),
    ],
    blocks: {
      key: "events",
      label: "Milestone",
      titleField: "title",
      max: 16,
      fields: [
        {
          key: "date",
          kind: "text",
          label: "When",
          info: "Any words you like — a year, a month, a season.",
          default: "",
          placeholder: "2019",
        },
        {
          key: "title",
          kind: "text",
          label: "What happened",
          info: "A short headline for this milestone.",
          default: "",
        },
        {
          key: "text",
          kind: "textarea",
          label: "Detail",
          info: "A sentence or two. Optional.",
          default: "",
        },
      ],
    },
  },

  STATS: {
    type: "STATS",
    label: "Numbers",
    description: "A few figures worth stating plainly — orders shipped, years open, cities covered.",
    category: "Content",
    fields: [
      heading("", "Heading", "Optional title above the numbers."),
      {
        key: "columns",
        kind: "range",
        label: "Per row",
        info: "How many figures sit across.",
        default: 3,
        min: 2,
        max: 4,
        step: 1,
      },
    ],
    blocks: {
      key: "stats",
      label: "Number",
      titleField: "label",
      max: 8,
      fields: [
        {
          key: "value",
          kind: "text",
          label: "The number",
          info: "Written how you want it read, e.g. 12,000+ or 4.9\u2605.",
          default: "",
        },
        {
          key: "label",
          kind: "text",
          label: "What it counts",
          info: "A few words under the number.",
          default: "",
        },
      ],
    },
  },

  HIGHLIGHT_TEXT: {
    type: "HIGHLIGHT_TEXT",
    label: "Statement",
    description: "One line, set large. For the thing you would say if you could only say one.",
    category: "Content",
    fields: [
      {
        key: "text",
        kind: "textarea",
        label: "The statement",
        info: "Kept short. This is set very large, so a paragraph here reads as shouting.",
        default: "Made in Pakistan, for the way you actually dress.",
      },
      {
        key: "size",
        kind: "select",
        label: "Size",
        info: "How large the words are set.",
        default: "large",
        options: [
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "huge", label: "Huge" },
        ],
      },
      {
        key: "align",
        kind: "select",
        label: "Alignment",
        info: "Where the statement sits.",
        default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
      ...ctaPair(""),
    ],
  },

  TEAM: {
    type: "TEAM",
    label: "People",
    description: "The people behind the shop, with photos.",
    category: "Content",
    fields: [
      heading("The people behind it"),
      {
        key: "columns",
        kind: "range",
        label: "Per row",
        info: "How many people sit across on a wide screen.",
        default: 3,
        min: 2,
        max: 4,
        step: 1,
      },
      {
        key: "shape",
        kind: "select",
        label: "Photo shape",
        info: "Round suits headshots; square suits anything else.",
        default: "round",
        options: [
          { value: "round", label: "Round" },
          { value: "square", label: "Square" },
        ],
      },
    ],
    blocks: {
      key: "people",
      label: "Person",
      titleField: "name",
      max: 12,
      fields: [
        image("Photo"),
        {
          key: "name",
          kind: "text",
          label: "Name",
          info: "How they should be listed.",
          default: "",
        },
        {
          key: "role",
          kind: "text",
          label: "Role",
          info: "What they do here.",
          default: "",
        },
        {
          key: "text",
          kind: "textarea",
          label: "About",
          info: "A line about them. Optional.",
          default: "",
        },
      ],
    },
  },

  /* ------------------------------------------------------------ layout -- */

  DIVIDER: {
    type: "DIVIDER",
    label: "Divider",
    description: "A line across the page, to separate what is above from what is below.",
    category: "Layout",
    fields: [
      {
        key: "style",
        kind: "select",
        label: "Line style",
        info: "How the line is drawn.",
        default: "solid",
        options: [
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
        ],
      },
      {
        key: "thickness",
        kind: "range",
        label: "Thickness",
        info: "How heavy the line is.",
        default: 1,
        min: 1,
        max: 6,
        step: 1,
        unit: "px",
      },
      {
        key: "widthPercent",
        kind: "range",
        label: "Line width",
        info: "How far across the page the line reaches.",
        default: 100,
        min: 10,
        max: 100,
        step: 5,
        unit: "%",
      },
    ],
  },

  SPACER: {
    type: "SPACER",
    label: "Space",
    description: "Empty room between two sections, when the spacing controls are not enough.",
    category: "Layout",
    fields: [
      {
        key: "height",
        kind: "range",
        label: "Height",
        info: "How much empty space to leave.",
        default: 48,
        min: 8,
        max: 240,
        step: 8,
        unit: "px",
      },
      {
        key: "showOnMobile",
        kind: "checkbox",
        label: "Keep it on phones",
        info: "Turn this off to remove the gap on small screens, where space is scarcer.",
        default: true,
      },
    ],
  },

  BUTTON_ROW: {
    type: "BUTTON_ROW",
    label: "Buttons",
    description: "A row of buttons on their own. For sending people to two or three places at once.",
    category: "Layout",
    fields: [
      heading("", "Heading", "Optional line above the buttons."),
      {
        key: "align",
        kind: "select",
        label: "Alignment",
        info: "Where the buttons sit.",
        default: "center",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Centre" },
        ],
      },
    ],
    blocks: {
      key: "buttons",
      label: "Button",
      titleField: "label",
      max: 4,
      fields: [
        {
          key: "label",
          kind: "text",
          label: "Label",
          info: "The words on the button.",
          default: "",
        },
        {
          key: "href",
          kind: "url",
          label: "Link",
          info: "Where it goes.",
          default: "",
          placeholder: "/shop",
        },
        {
          key: "style",
          kind: "select",
          label: "Style",
          info: "Filled draws the eye; outlined sits back beside it.",
          default: "filled",
          options: [
            { value: "filled", label: "Filled" },
            { value: "outline", label: "Outlined" },
          ],
        },
      ],
    },
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
