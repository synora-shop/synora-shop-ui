import type { SectionSchema, SettingField } from "@/lib/section-schema";

/**
 * Settings for Kite's pages the file does not draw — the collection, search,
 * bag, checkout, sign-in, order and wishlist (built in Kite's own parts,
 * decided 8 October). The words every kit shares ("Subtotal", "Sign in") are
 * Site text (components/kite/text.ts); these are the words and choices that
 * belong to one section.
 */
const flag = (key: string, label: string, info: string, def = true): SettingField => ({ key, kind: "checkbox", label, info, default: def });
const text = (key: string, label: string, info: string, def: string): SettingField => ({ key, kind: "text", label, info, default: def });

export const kiteCollectionSchema: SectionSchema = {
  type: "KITE_COLLECTION",
  label: "Collection",
  description: "A collection's pieces, with filters and a sort.",
  category: "Commerce",
  singleton: true,
  fields: [
    flag("showDescription", "Show the description", "The collection's own line under its name."),
    flag("showFilters", "Show filters", "Colour, size and price, behind FILTER."),
    text("addLabel", "Card button", "The words at the right of every piece.", "Add to cart"),
  ],
};

export const kiteSearchSchema: SectionSchema = {
  type: "KITE_SEARCH",
  label: "Search results",
  description: "The search field and what it found.",
  category: "Commerce",
  singleton: true,
  fields: [
    text("heading", "Heading", "Shown before anything has been searched for.", "Search"),
    text("resultsHeading", "Results heading", "Use {query} for what was typed.", "“{query}”"),
    text("countLabel", "Count", "Use {count} for the number found.", "{count} found"),
    text("placeholder", "Search hint", "The words inside the empty field.", "What are you looking for?"),
    text("emptyHeading", "Nothing found", "Use {query} for what was typed.", "Nothing found for “{query}”."),
    text("emptyText", "Nothing found: line", "Under that.", "Check the spelling, or see everything."),
    text("addLabel", "Card button", "The words at the right of every piece.", "Add to cart"),
  ],
};

export const kiteCartSchema: SectionSchema = {
  type: "KITE_CART",
  label: "Bag",
  description: "What is in the bag, and the summary with Checkout.",
  category: "Commerce",
  singleton: true,
  fields: [flag("showFreeDeliveryNote", "Say how far off free delivery is", "Only while the bag is under the free-delivery amount.")],
};

export const kiteCheckoutSchema: SectionSchema = {
  type: "KITE_CHECKOUT",
  label: "Checkout",
  description: "Contact, address, delivery and payment, beside the order.",
  category: "Commerce",
  singleton: true,
  fields: [],
};

export const kiteSignInSchema: SectionSchema = {
  type: "KITE_SIGN_IN",
  label: "Sign in",
  description: "Sign in, and make an account, with a code by email. Its words are in Site text.",
  category: "Commerce",
  singleton: true,
  fields: [],
};

export const kiteOrderSchema: SectionSchema = {
  type: "KITE_ORDER",
  label: "Order",
  description: "Where an order has got to, what is in it, and where it is going.",
  category: "Commerce",
  singleton: true,
  fields: [
    text("backLabel", "Back link", "Over the heading, to the account.", "Your account"),
    text("itemsHeading", "Items heading", "Over what was ordered.", "In this order"),
    text("addressHeading", "Address heading", "Over where it goes.", "Delivering to"),
    text("paymentHeading", "Payment heading", "Over how it was paid.", "Paid by"),
    flag("showProgress", "Show its progress", "Ordered, packed, on its way, delivered."),
  ],
};

export const kiteWishlistSchema: SectionSchema = {
  type: "KITE_WISHLIST",
  label: "Saved items",
  description: "The pieces a customer has saved, from Add to favorites.",
  category: "Commerce",
  singleton: true,
  fields: [
    text("heading", "Heading", "The page's name.", "Saved items"),
    text("emptyHeading", "When empty: heading", "Shown when nothing is saved.", "Nothing saved yet."),
    text("emptyText", "When empty: line", "Under that.", "Add to favorites on any piece and it waits here."),
    text("emptyButtonLabel", "When empty: button", "The way back to the shop.", "See the collection"),
    text("removeLabel", "Remove", "Under each piece.", "Remove"),
    text("addLabel", "Card button", "The words at the right of every piece.", "Add to cart"),
  ],
};
