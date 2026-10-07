import type { SectionSchema, SettingField } from "@/lib/section-schema";

/**
 * Settings for the wishlist, order and search pages' sections — what the live
 * customizer shows for each. Kept apart from the drawing so the server can
 * read them (see header.schema.ts).
 *
 * Every word on these pages is here with the kit-voiced default, and every
 * part that a shop might not want has a switch.
 */
const text = (key: string, label: string, info: string, def: string, extra: Partial<SettingField> = {}): SettingField => ({
  key,
  kind: "text",
  label,
  info,
  default: def,
  ...extra,
});
const flag = (key: string, label: string, info: string, def = true): SettingField => ({ key, kind: "checkbox", label, info, default: def });

export const wishlistSchema: SectionSchema = {
  type: "LOOM_WISHLIST",
  label: "Wishlist",
  description: "The products a customer has saved with the heart.",
  category: "Commerce",
  singleton: true,
  fields: [
    text("heading", "Heading", "The page's title.", "Wishlist"),
    { key: "text", kind: "textarea", label: "Line under the heading", info: "Leave empty to show none.", default: "The pairs you have saved for later. Hearts are kept here until you take them off." },
    flag("showCount", "Show the count", "“3 saved” beside the heading."),
    text("countLabel", "Count", "Use {count} for the number.", "{count} saved", { disabledWhen: { field: "showCount", equals: false, message: "The count is hidden." } }),
    flag("showAddToCart", "Show Add to cart", "A button under each saved product."),
    text("addToCartLabel", "Add to cart button", "The words on that button.", "Add to cart", { disabledWhen: { field: "showAddToCart", equals: false, message: "The button is hidden." } }),
    text("emptyHeading", "When empty: heading", "Shown when nothing is saved.", "Nothing saved yet."),
    text("emptyText", "When empty: line", "Under that heading.", "Tap the heart on anything you like and it waits for you here."),
    text("emptyButtonLabel", "When empty: button", "The way back to the products.", "Browse shoes"),
    { key: "emptyButtonLink", kind: "url", label: "When empty: button link", info: "Where that button goes.", default: "route:collection" },
  ],
};

export const recommendationsSchema: SectionSchema = {
  type: "LOOM_RECOMMENDATIONS",
  label: "Product recommendations",
  description: "A row of products under the section rule.",
  category: "Commerce",
  fields: [
    text("heading", "Heading", "The title over the row.", "You may also like"),
    { key: "count", kind: "range", label: "How many", info: "Products in the row — two to a row on the phone.", default: 4, min: 2, max: 4, step: 2 },
  ],
};

export const orderSchema: SectionSchema = {
  type: "LOOM_ORDER",
  label: "Order",
  description: "One order: where it has got to, what is in it, where it is going.",
  category: "Commerce",
  singleton: true,
  fields: [
    text("backLabel", "Back link", "The link to the list of orders.", "All orders"),
    flag("showProgress", "Show progress", "Ordered, packed, on its way, delivered — with dates."),
    text("trackLabel", "Track button", "Opens the courier's tracking. Hidden when there is no tracking number.", "Track package"),
    text("buyAgainLabel", "Buy again button", "Puts the same items in the cart again. Leave empty to hide.", "Buy again"),
    text("itemsHeading", "Items heading", "Over the list of what was ordered.", "What you ordered"),
    text("addressHeading", "Address heading", "Over the delivery address.", "Where it is going"),
    text("paymentHeading", "Payment heading", "Over how it was paid.", "How you paid"),
    flag("showHelp", "Show help", "A short block offering a way to get in touch."),
    text("helpHeading", "Help heading", "The help block's title.", "Something not right?", { disabledWhen: { field: "showHelp", equals: false, message: "The help block is hidden." } }),
    { key: "helpText", kind: "textarea", label: "Help text", info: "A line under that title.", default: "We will always answer whatever your questions. Tell us the order number and we will take it from there.", disabledWhen: { field: "showHelp", equals: false, message: "The help block is hidden." } },
    text("helpButtonLabel", "Help button", "The words on the help button.", "Contact us", { disabledWhen: { field: "showHelp", equals: false, message: "The help block is hidden." } }),
    { key: "helpButtonLink", kind: "url", label: "Help button link", info: "Where the help button goes.", default: "", disabledWhen: { field: "showHelp", equals: false, message: "The help block is hidden." } },
  ],
};

export const searchSchema: SectionSchema = {
  type: "LOOM_SEARCH",
  label: "Search results",
  description: "The search field, what it found, and suggestions when it found nothing.",
  category: "Commerce",
  singleton: true,
  fields: [
    text("heading", "Heading", "Shown before anything has been searched for.", "Search"),
    text("resultsHeading", "Results heading", "Use {query} for what was typed.", "Results for “{query}”"),
    text("countLabel", "Count", "Use {count} for the number found.", "{count} found"),
    text("placeholder", "Search hint", "The grey words inside the empty field.", "What are you looking for?"),
    text("emptyHeading", "Nothing found: heading", "Use {query} for what was typed.", "Nothing found for “{query}”."),
    text("emptyText", "Nothing found: line", "Under that heading.", "Check the spelling, or try one of these."),
    flag("showSuggestions", "Show suggestions", "A row of searches to try, under the field and when nothing is found."),
    text("suggestionsHeading", "Suggestions heading", "Over that row.", "Popular searches", { disabledWhen: { field: "showSuggestions", equals: false, message: "Suggestions are hidden." } }),
    { key: "suggestionsMenu", kind: "menu", label: "Suggestions", info: "Any menu built under Menus — each link is one search to try.", default: "popular-searches", disabledWhen: { field: "showSuggestions", equals: false, message: "Suggestions are hidden." } },
  ],
};
