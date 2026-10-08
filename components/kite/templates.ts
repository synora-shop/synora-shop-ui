import type { KiteTemplate } from "@/components/kite/contract";
import { KITE_CITIES_DEFAULT } from "@/components/kite/sections/home.schema";

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
  ],
};
