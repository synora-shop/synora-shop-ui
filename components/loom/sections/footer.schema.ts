import type { SectionSchema } from "@/lib/section-schema";

/** The footer's settings. Its columns are blocks, each pointing at a menu. */
export const footerSchema: SectionSchema = {
  type: "LOOM_FOOTER",
  label: "Footer",
  category: "Layout",
  singleton: true,
  fields: [
    { key: "logoText", kind: "text", label: "Wordmark", info: "Shown when the shop has no logo uploaded on Home.", default: "ECOMMERCE" },
    { key: "blurb", kind: "textarea", label: "About the shop", info: "A line or two under the wordmark. Leave empty to show none.", default: "Ecommerce is a free UI Kit from Paperpillar that you can use for your personal or commercial project." },
    { key: "showNewsletter", kind: "checkbox", label: "Show the newsletter field", info: "The email field and button under the wordmark.", default: true },
    { key: "newsletterPlaceholder", kind: "text", label: "Newsletter hint", info: "The words inside the empty email field.", default: "Type your email address", disabledWhen: { field: "showNewsletter", equals: false, message: "The newsletter field is hidden." } },
    { key: "newsletterButton", kind: "text", label: "Newsletter button", info: "The words on the button beside it.", default: "Submit", disabledWhen: { field: "showNewsletter", equals: false, message: "The newsletter field is hidden." } },
  ],
  blocks: {
    key: "columns",
    label: "column",
    titleField: "heading",
    max: 4,
    fields: [
      { key: "heading", kind: "text", label: "Heading", info: "The small capitals over the column.", default: "Links" },
      { key: "menu", kind: "menu", label: "Menu", info: "The links in this column — any menu built under Menus.", default: "" },
    ],
  },
};
