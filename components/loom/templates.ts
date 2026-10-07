import type { LoomTemplate } from "@/components/loom/contract";

/**
 * Loom's templates — what each page is made of, as data. When the theme is
 * ported these are the defaults a shop starts with, stored per shop and edited
 * in the customizer; here they are the demo's.
 *
 * Settings left out take their defaults (the kit's own words), so a template
 * only says what differs. The header and footer are groups shared by every
 * page, as Shopify's are.
 */
export const HEADER_GROUP: LoomTemplate = {
  name: "Header",
  sections: [{ id: "header", type: "LOOM_HEADER" }],
};

export const FOOTER_GROUP: LoomTemplate = {
  name: "Footer",
  sections: [
    {
      id: "footer",
      type: "LOOM_FOOTER",
      data: {
        columns: [
          { heading: "Popular", menu: "popular" },
          { heading: "Menu", menu: "footer-menu" },
          { heading: "Other", menu: "other" },
        ],
      },
    },
  ],
};

/**
 * The home page — the kit's one drawn screen. Only the colours and the
 * promises are spelled out: they are blocks, and blocks have no defaults of
 * their own, so a new shop starts with the kit's.
 */
export const HOME: LoomTemplate = {
  name: "Home",
  sections: [
    { id: "hero", type: "LOOM_HERO" },
    { id: "trending", type: "LOOM_TRENDING" },
    {
      id: "colours",
      type: "LOOM_EXPLORE_COLORS",
      data: {
        swatches: [
          { label: "Red Pastel", color: "#e25f5f", link: "/loom/search?q=red" },
          { label: "Lime Green", color: "#b8e25f" },
          { label: "Navy Blue", color: "#233c6b", link: "/loom/search?q=navy" },
          { label: "Clean White", color: "#ffffff", link: "/loom/search?q=white" },
          { label: "Blue Sky", color: "#5fabe2" },
          { label: "Purple", color: "#b54ef4" },
          { label: "Pink", color: "#f44e8a" },
          { label: "Yellow", color: "#f4cf4e" },
          { label: "Dark Green", color: "#44936d", link: "/loom/search?q=green" },
        ],
      },
    },
    { id: "testimonial", type: "LOOM_TESTIMONIAL" },
    {
      id: "promises",
      type: "LOOM_SERVICE",
      data: {
        columns: [
          { icon: "love", title: "Take care with love", text: "We take care your package with full of attention and of course full of love. We want to make sure you’ll receive your package like you receive your birthday gift." },
          { icon: "phone", title: "Friendly Customer Service", text: "You do not need to worry when you want to check your package. We will always answer whatever your questions. Just click on the chat icon and we will talk." },
          { icon: "refund", title: "Refund Process", text: "Refund is a such bad experience and we don’t want that thing happen to you. But when it’s happen we will make sure you will through smooth and friendly process." },
        ],
      },
    },
    { id: "blog", type: "LOOM_BLOG" },
  ],
};

export const WISHLIST: LoomTemplate = {
  name: "Wishlist",
  sections: [
    { id: "wishlist", type: "LOOM_WISHLIST" },
    { id: "more", type: "LOOM_RECOMMENDATIONS", data: { heading: "You may also like" } },
  ],
};

export const ORDER: LoomTemplate = {
  name: "Order",
  sections: [{ id: "order", type: "LOOM_ORDER" }],
};

export const SEARCH: LoomTemplate = {
  name: "Search",
  sections: [
    { id: "search", type: "LOOM_SEARCH" },
    { id: "trending", type: "LOOM_RECOMMENDATIONS", data: { heading: "Trending now" } },
  ],
};

export const PRODUCT: LoomTemplate = {
  name: "Product",
  sections: [
    { id: "main", type: "LOOM_PRODUCT" },
    { id: "more", type: "LOOM_RECOMMENDATIONS", data: { heading: "You may also like" } },
  ],
};

export const COLLECTION: LoomTemplate = { name: "Collection", sections: [{ id: "main", type: "LOOM_COLLECTION" }] };
export const CART: LoomTemplate = { name: "Cart", sections: [{ id: "main", type: "LOOM_CART" }] };
export const CHECKOUT: LoomTemplate = { name: "Checkout", sections: [{ id: "main", type: "LOOM_CHECKOUT" }] };
export const ACCOUNT: LoomTemplate = { name: "Account", sections: [{ id: "main", type: "LOOM_ACCOUNT" }] };
export const SIGN_IN: LoomTemplate = { name: "Sign in", sections: [{ id: "main", type: "LOOM_SIGN_IN" }] };
