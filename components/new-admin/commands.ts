import { NAV, ORDERS, PRODUCTS, SETTINGS } from "@/lib/new-admin/sample";

/**
 * Everything the command bar (⌘K) can find or do (preview, 15 October).
 * Screens, every settings section, actions, and the store's own records, so
 * "1048", "kajal", "invite" and "domain" all land somewhere useful.
 */
export type Command = { group: "Go to" | "Do" | "Settings" | "Orders" | "Products"; label: string; hint?: string; href: string; keys?: string };

const A = "/new-admin";

export const COMMANDS: Command[] = [
  ...NAV.flatMap((g) => [
    { group: "Go to" as const, label: g.label, href: g.href, keys: { home: "G H", orders: "G O", products: "G P", customers: "G C", discounts: "G D", content: "G F", analytics: "G A", store: "G T" }[g.id] },
    ...(g.items ?? []).map((i) => ({ group: "Go to" as const, label: i.label, hint: g.label, href: i.href })),
  ]),
  { group: "Go to", label: "Settings", href: `${A}/settings`, keys: "G S" },
  { group: "Go to", label: "Bin", hint: "Deleted in the last 30 days", href: `${A}/bin` },
  { group: "Do", label: "Create a product", href: `${A}/products/zohra`, keys: "C P" },
  { group: "Do", label: "Create an order by hand", hint: "For a WhatsApp or phone order", href: `${A}/orders/drafts` },
  { group: "Do", label: "Create a discount code", href: `${A}/discounts` },
  { group: "Do", label: "Add a page", href: `${A}/online-store/pages` },
  { group: "Do", label: "Invite someone to the team", href: `${A}/settings#users` },
  { group: "Do", label: "Import products from a Shopify file", href: `${A}/products?import=1` },
  { group: "Do", label: "Export orders", hint: "As a spreadsheet", href: `${A}/orders` },
  { group: "Do", label: "Customise the live theme", href: `${A}/online-store` },
  { group: "Do", label: "Close the store for a while", hint: "Shows your holding page", href: `${A}/online-store/preferences#access` },
  { group: "Do", label: "Connect a domain", href: `${A}/settings#domains` },
  ...SETTINGS.map((s) => ({ group: "Settings" as const, label: s.label, hint: s.blurb, href: `${A}/settings#${s.slug}` })),
  ...ORDERS.map((o) => ({ group: "Orders" as const, label: `#${o.id} · ${o.customer}`, hint: `${o.stage} · ${o.city}`, href: `${A}/orders/${o.id}` })),
  ...PRODUCTS.map((p) => ({ group: "Products" as const, label: p.name, hint: p.collection, href: `${A}/products/${p.slug}` })),
];

/** Two-key shortcuts: G, then the letter. */
export const GOTO: Record<string, string> = {
  h: A, o: `${A}/orders`, p: `${A}/products`, c: `${A}/customers`, d: `${A}/discounts`, f: `${A}/content`, a: `${A}/analytics`, t: `${A}/online-store`, s: `${A}/settings`,
};
