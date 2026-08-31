// Fixed utility routes that aren't Page rows (no Sections, nothing to rename) — offered
// alongside real Pages in the menu editor's picker so *every* menu item is still chosen
// from a list, never free-typed. Kept in its own Prisma-free file (like
// lib/product-pricing.ts) since the menu editor is a Client Component.
export const FIXED_MENU_ROUTES = [
  { href: "/shop", label: "Shop All" },
  { href: "/cart", label: "Cart" },
  { href: "/account/orders", label: "Track Order" },
  { href: "/contact", label: "Contact Us" },
] as const;
