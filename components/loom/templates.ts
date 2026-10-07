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
