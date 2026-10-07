import type { SectionSchema } from "@/lib/section-schema";

/**
 * The header's settings — what the customizer shows for it. The drawing is
 * components/loom/sections/header.tsx; kept apart because that file runs in
 * the browser, and a list of settings must be readable on the server too.
 */
export const headerSchema: SectionSchema = {
  type: "LOOM_HEADER",
  label: "Header",
  category: "Layout",
  singleton: true,
  fields: [
    { key: "logoText", kind: "text", label: "Wordmark", info: "Shown when the shop has no logo uploaded on Home.", default: "ECOMMERCE" },
    { key: "mainMenu", kind: "menu", label: "Menu", info: "The categories in the header and in the phone menu. Links with children open a dropdown.", default: "main-menu" },
    { key: "showUtility", kind: "checkbox", label: "Show the strip above", info: "The thin row of help links and language above the header. Desktop only.", default: true },
    { key: "utilityMenu", kind: "menu", label: "Strip menu", info: "The links on the right of the strip, and at the foot of the phone menu.", default: "help", disabledWhen: { field: "showUtility", equals: false, message: "The strip is hidden." } },
    { key: "languageLabel", kind: "text", label: "Language", info: "The language shown at the left of the strip.", default: "English" },
    { key: "currencyLabel", kind: "text", label: "Currency", info: "The currency shown beside the language.", default: "Dollar" },
    { key: "showSearch", kind: "checkbox", label: "Show search", info: "The search field in the header and at the top of the phone menu.", default: true },
    { key: "searchPlaceholder", kind: "text", label: "Search hint", info: "The grey words inside the empty search field.", default: "Search here" },
    { key: "showWishlist", kind: "checkbox", label: "Show wishlist", info: "The heart at the right of the header.", default: true },
    { key: "showAccount", kind: "checkbox", label: "Show account", info: "The person icon at the right of the header.", default: true },
    { key: "showCart", kind: "checkbox", label: "Show cart", info: "The cart icon at the right of the header.", default: true },
    { key: "menuButtonLabel", kind: "text", label: "Menu button", info: "What a screen reader says for the phone's menu button.", default: "Menu" },
  ],
};
