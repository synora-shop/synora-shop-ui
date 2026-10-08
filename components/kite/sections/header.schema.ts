import type { SectionSchema } from "@/lib/section-schema";

/**
 * Kite's header, as the live customizer offers it. Kept apart from the
 * drawing so the server can read it (as Loom's header.schema.ts).
 */
export const kiteHeaderSchema: SectionSchema = {
  type: "KITE_HEADER",
  label: "Header",
  description: "The shop's name, its menu, and search, account and bag.",
  category: "Layout",
  singleton: true,
  fields: [
    { key: "logoText", kind: "text", label: "Shop name", info: "Set in the header's face. Shown in the middle.", default: "Trümung" },
    { key: "menu", kind: "menu", label: "Menu", info: "Any menu built under Menus. An item with links under it shows a chevron.", default: "main-menu" },
    { key: "showSearch", kind: "checkbox", label: "Show search", info: "The magnifier at the right, on the desktop.", default: true },
    { key: "showAccount", kind: "checkbox", label: "Show account", info: "The person at the right, on the desktop.", default: true },
  ],
};
