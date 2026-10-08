import type { SectionSchema } from "@/lib/section-schema";

/** Kite's footer, as the live customizer offers it. */
export const kiteFooterSchema: SectionSchema = {
  type: "KITE_FOOTER",
  label: "Footer",
  description: "The shop's line, a sign-up for deals, links, the small print.",
  category: "Layout",
  singleton: true,
  fields: [
    { key: "name", kind: "text", label: "Shop name", info: "Starts the line, in capitals, with a short rule after.", default: "Trümung" },
    { key: "line1", kind: "text", label: "Line 1", info: "In the serif, in capitals.", default: "shop rare limited edition" },
    { key: "line2", kind: "text", label: "Line 2", info: "The second line of the large serif lines at the top.", default: "pieces in our la & nyc locations" },
    { key: "text", kind: "textarea", label: "Words", info: "Under the line.", default: "Placeholder text helps maintain the structure and appearance of the layout while the content is being developed. Here’s an extra line to create some length difference." },
    { key: "menu", kind: "menu", label: "Links", info: "Any menu built under Menus, underlined at the right.", default: "footer-menu" },
    { key: "smallPrint", kind: "text", label: "Small print", info: "At the bottom left.", default: "All rights reserved Trümung 2026" },
    { key: "contact", kind: "text", label: "Contact", info: "At the bottom right.", default: "trumung@fashion.com" },
  ],
};
