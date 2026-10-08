import type { SectionSchema, SettingField } from "@/lib/section-schema";

/**
 * Settings for the home page's six sections — the ones the kit draws. Every
 * default is the file's own wording and photograph, so a shop that changes
 * nothing is the kit to the pixel (verify-loom.mjs measures it). Line breaks
 * in a heading are where the file breaks it.
 *
 * Photographs: while a setting holds the kit's own photo, the section keeps
 * the file's hand-made crop for it; any other image fills its card from the
 * centre. A merchant's upload never inherits a crop made for someone else's
 * photograph.
 */
const t = (key: string, label: string, info: string, def: string, extra: Partial<SettingField> = {}): SettingField => ({ key, kind: "text", label, info, default: def, ...extra });
const ta = (key: string, label: string, info: string, def: string): SettingField => ({ key, kind: "textarea", label, info, default: def });
const img = (key: string, label: string, info: string, def: string): SettingField => ({ key, kind: "image", label, info, default: def });
// Empty, not "#": the platform's link check refuses a link to nowhere, and an
// empty link is what "this goes nowhere yet" means. The section draws it as
// "#" until a merchant points it somewhere.
const url = (key: string, label: string, info: string, def = ""): SettingField => ({ key, kind: "url", label, info, default: def });
const flag = (key: string, label: string, info: string, def = true): SettingField => ({ key, kind: "checkbox", label, info, default: def });

export const KIT = {
  summer: "/loom/3071b1fc729091cd0452fb9d0b89106ceec16368.png",
  outdoor: "/loom/17aa3a2f29a85f64d93c41afa6b64d31b3a88038.png",
  casual: "/loom/837e11f00233936f837e7b69d6a545511b1ba132.png",
  shirt: "/loom/5e143183ca0df25c3d226a223269e70541e09760.png",
  funky: "/loom/b0b782c02a24c60e5479cec788203caf906828d8.png",
  testimonial: "/loom/57cd86eaec4b399b54263e873dd87745943b8f88.png",
  blog: "/loom/ff3c0bb419ab7a36a466902e4bb611c667f4c3c4.png",
};

export const heroSchema: SectionSchema = {
  type: "LOOM_HERO",
  label: "Hero",
  description: "The large photograph with the page's opening line, two category cards beside it, and a second band of copy and two wide cards.",
  category: "Media",
  fields: [
    img("image", "Main photograph", "The large card. Words sit over its top-left corner, in white.", KIT.summer),
    ta("headline", "Headline", "The opening line. Each new line here is a new line on the page.", "Color of\nSummer\nOutfit"),
    t("text", "Line under the headline", "Leave empty to show none.", "100+ Collections for your outfit inspirations in this summer"),
    t("buttonLabel", "Button", "The words on the button. Leave empty to hide it.", "View Collections"),
    url("buttonLink", "Button link", "Where the button goes.", "route:collection"),
    flag("showCards", "Show the two category cards", "The pair beside the main photograph — a row to swipe on the phone."),
    img("card1Image", "First card: photograph", "The upper card.", KIT.outdoor),
    ta("card1Caption", "First card: caption", "Each new line is a new line.", "Outdoor\nActive"),
    url("card1Link", "First card: link", "Where the card goes. Empty: the shop."),
    img("card2Image", "Second card: photograph", "The lower card.", KIT.casual),
    ta("card2Caption", "Second card: caption", "Each new line is a new line.", "Casual\nComfort"),
    url("card2Link", "Second card: link", "Where the card goes. Empty: the shop."),
    flag("showInspiration", "Show the second band", "The copy and two wide cards under the main photograph."),
    ta("inspirationHeading", "Second band: heading", "Each new line is a new line.", "Casual\nInspirations"),
    t("inspirationText", "Second band: line", "Under that heading.", "Our favorite combinations for casual outfit that can inspire you to apply on your daily activity."),
    t("inspirationButtonLabel", "Second band: button", "Leave empty to hide it.", "Browse Inpirations"),
    url("inspirationButtonLink", "Second band: button link", "Where it goes.", "route:collection"),
    img("wide1Image", "First wide card: photograph", "Desktop only.", KIT.shirt),
    ta("wide1Caption", "First wide card: caption", "Each new line is a new line.", "Say it\nwith Shirt"),
    url("wide1Link", "First wide card: link", "Where the card goes. Empty: the shop."),
    img("wide2Image", "Second wide card: photograph", "Desktop only.", KIT.funky),
    ta("wide2Caption", "Second wide card: caption", "Each new line is a new line.", "Funky never\nget old"),
    url("wide2Link", "Second wide card: link", "Where the card goes. Empty: the shop."),
  ],
};

export const trendingSchema: SectionSchema = {
  type: "LOOM_TRENDING",
  label: "Trending",
  description: "A menu of categories as chips beside the title, then products in the kit's mixed-width grid.",
  category: "Commerce",
  fields: [
    t("heading", "Heading", "The title at the left.", "Trending"),
    { key: "chipsMenu", kind: "menu", label: "Chips", info: "Any menu built under Menus — each link is one chip.", default: "trending-chips" },
    t("activeChip", "Chip shown as chosen", "The chip drawn filled: the name of the one whose products are showing.", "Shoes"),
    { key: "count", kind: "range", label: "How many products", info: "Up to six. The grid keeps the kit's rhythm of narrow and wide cards.", default: 6, min: 2, max: 6, step: 1 },
  ],
};

export const exploreSchema: SectionSchema = {
  type: "LOOM_EXPLORE_COLORS",
  label: "Explore by colour",
  description: "A title beside a wrapping row of colour chips.",
  category: "Commerce",
  fields: [t("heading", "Heading", "The title at the left.", "Explore by Colors")],
  blocks: {
    key: "swatches",
    label: "colour",
    titleField: "label",
    max: 12,
    fields: [
      t("label", "Name", "The words on the chip.", "Colour"),
      { key: "color", kind: "color", label: "Colour", info: "The swatch's colour. White gets a hairline ring so it does not vanish.", default: "#121212" },
      url("link", "Link", "Where the chip goes. Empty: the shop, showing this colour only."),
    ],
  },
};

export const testimonialSchema: SectionSchema = {
  type: "LOOM_TESTIMONIAL",
  label: "Testimonial",
  description: "One customer's words over a photograph.",
  category: "Content",
  fields: [
    img("image", "Photograph", "Behind the words, which are white.", KIT.testimonial),
    t("eyebrow", "Small line above", "Leave empty to show none.", "What people said"),
    ta("quote", "Quote", "The large words.", "Love the way they handle the order."),
    ta("text", "More of what they said", "Under the quote.", "Very professional and friendly at the same time. They packed the order on schedule and the detail of their wrapping is top notch. One of my best experience for buying online items. Surely will come back for another purchase."),
    t("name", "Name", "Who said it.", "Samantha William"),
    t("role", "About them", "A word or two under the name. Leave empty to show none.", "Fashion Enthusiast"),
    flag("showPortrait", "Show their portrait on the phone", "A round crop of the photograph above the name, on the phone only, as the kit draws it."),
  ],
};

export const serviceSchema: SectionSchema = {
  type: "LOOM_SERVICE",
  label: "Promises",
  description: "A statement, then columns of an icon, a title and a line each.",
  category: "Content",
  fields: [ta("heading", "Heading", "The statement over the columns.", "Why you’ll love to shop on our website")],
  blocks: {
    key: "columns",
    label: "column",
    titleField: "title",
    max: 4,
    fields: [
      {
        key: "icon",
        kind: "select",
        label: "Icon",
        info: "The kit's own glyphs, in an ink circle.",
        default: "love",
        options: [
          { value: "love", label: "Heart" },
          { value: "phone", label: "Phone" },
          { value: "refund", label: "Refund" },
        ],
      },
      t("title", "Title", "The column's heading.", "A promise"),
      ta("text", "Text", "A line or two under it.", ""),
    ],
  },
};

export const blogSchema: SectionSchema = {
  type: "LOOM_BLOG",
  label: "Blog",
  description: "A title, then one story: its photograph beside its headline, a line and a button.",
  category: "Content",
  fields: [
    t("heading", "Heading", "The small title over the story.", "From The Blog"),
    img("image", "Photograph", "The story's picture.", KIT.blog),
    ta("headline", "Headline", "The story's title.", "How to combine your daily outfit to looks fresh and cool."),
    ta("text", "Text", "A line or two under it.", "Maybe you don’t need to buy new clothes to have nice, cool, fresh looking outfit everyday. Maybe what you need is to combine your clothes collections. Mix and match is the key."),
    t("buttonLabel", "Button", "Leave empty to hide it.", "Read More"),
    url("buttonLink", "Button link", "Where it goes — usually the post. Empty: the shop.", "route:collection"),
  ],
};
