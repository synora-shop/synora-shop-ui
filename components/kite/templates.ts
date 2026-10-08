import type { KiteTemplate } from "@/components/kite/contract";
import { KITE_CITIES_DEFAULT, KITE_NEWSLETTER_DEFAULT } from "@/components/kite/sections/home.schema";

/** Kite's pages as section lists — what a shop starts from before editing (THEMES.md §1). */
export const HEADER_GROUP: KiteTemplate = {
  name: "Header",
  sections: [{ id: "header", type: "KITE_HEADER", data: {} }],
};

export const HOME: KiteTemplate = {
  name: "Home page",
  sections: [
    { id: "cities", type: "KITE_CITIES", data: KITE_CITIES_DEFAULT },
    { id: "limited", type: "KITE_LIMITED", data: {} },
    { id: "curated", type: "KITE_CURATED", data: {} },
    { id: "newsletter", type: "KITE_NEWSLETTER", data: KITE_NEWSLETTER_DEFAULT },
    { id: "about", type: "KITE_ABOUT", data: {} },
    { id: "upcoming", type: "KITE_UPCOMING", data: {} },
    { id: "journey", type: "KITE_JOURNEY", data: {} },
  ],
};

export const FOOTER_GROUP: KiteTemplate = {
  name: "Footer",
  sections: [{ id: "footer", type: "KITE_FOOTER", data: {} }],
};

export const PRODUCT: KiteTemplate = {
  name: "Product",
  sections: [{ id: "main", type: "KITE_PRODUCT", data: {} }],
};

export const ACCOUNT: KiteTemplate = {
  name: "Account",
  sections: [{ id: "main", type: "KITE_ACCOUNT", data: {} }],
};
