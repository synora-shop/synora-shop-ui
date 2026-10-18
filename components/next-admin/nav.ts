import { CUSTOMERS, NAV, ORDERS, PRODUCTS, SETTINGS, slugOf } from "@/lib/new-admin/sample";

/**
 * Where everything is in the third design (/next-admin, 18 October).
 *
 * The pages and options are the preview's (/new-admin), read from the same
 * sample data; only the addresses change. "Your account" is not a store
 * setting: it is about the person signed in, so it opens from the store
 * button at the foot of the rail and has its own page, /next-admin/account.
 */
export const A = "/next-admin";

/** A preview address, moved under /next-admin. */
export const to = (href: string) =>
  href === "/new-admin/settings/account" ? `${A}/account` : href.replace(/^\/new-admin(?=\/|$)/, A);

export const RAIL = NAV.map((g) => ({ ...g, href: to(g.href), items: g.items?.map((i) => ({ ...i, href: to(i.href) })) }));

/** The store's settings. The person's own account is not among them. */
export const STORE_SETTINGS = SETTINGS.filter((s) => s.slug !== "account");

export type Command = { group: "Go to" | "Do" | "Settings" | "Orders" | "Products" | "Customers"; label: string; hint?: string; href: string; keys?: string };

const KEYS: Record<string, string> = { home: "G H", orders: "G O", products: "G P", customers: "G C", discounts: "G D", content: "G F", analytics: "G A", store: "G T" };

export const COMMANDS: Command[] = [
  ...RAIL.flatMap((g) => [
    { group: "Go to" as const, label: g.label, href: g.href, keys: KEYS[g.id] },
    ...(g.items ?? []).map((i) => ({ group: "Go to" as const, label: i.label, hint: g.label, href: i.href })),
  ]),
  { group: "Go to", label: "Settings", href: `${A}/settings`, keys: "G S" },
  { group: "Go to", label: "Your account", hint: "Profile, password, devices", href: `${A}/account` },
  { group: "Go to", label: "Bin", hint: "Deleted in the last 30 days", href: `${A}/bin` },
  { group: "Do", label: "Create a product", href: `${A}/products/zohra`, keys: "C" },
  { group: "Do", label: "Create an order by hand", hint: "For a WhatsApp or phone order", href: `${A}/orders/drafts` },
  { group: "Do", label: "Create a discount code", href: `${A}/discounts/new` },
  { group: "Do", label: "Write a blog post", href: `${A}/content/blog/new` },
  { group: "Do", label: "Add a page", href: `${A}/online-store/pages` },
  { group: "Do", label: "Invite someone to the team", href: `${A}/settings/users` },
  { group: "Do", label: "Import products from a Shopify file", href: `${A}/products` },
  { group: "Do", label: "Export orders", hint: "As a spreadsheet", href: `${A}/orders` },
  { group: "Do", label: "Customise the live theme", href: `${A}/online-store` },
  { group: "Do", label: "Close the store for a while", hint: "Shows your holding page", href: `${A}/online-store/preferences#access` },
  { group: "Do", label: "Connect a domain", href: `${A}/settings/domains` },
  ...STORE_SETTINGS.map((s) => ({ group: "Settings" as const, label: s.label, hint: s.blurb, href: `${A}/settings/${s.slug}` })),
  ...ORDERS.map((o) => ({ group: "Orders" as const, label: `#${o.id} · ${o.customer}`, hint: `${o.stage} · ${o.city}`, href: `${A}/orders/${o.id}` })),
  ...CUSTOMERS.map((c) => ({ group: "Customers" as const, label: c.name, hint: `${c.city} · ${c.email}`, href: `${A}/customers/${slugOf(c.name)}` })),
  ...PRODUCTS.map((p) => ({ group: "Products" as const, label: p.name, hint: p.collection, href: `${A}/products/${p.slug}` })),
];

/** Two-key shortcuts: G, then the letter. */
export const GOTO: Record<string, string> = {
  h: A, o: `${A}/orders`, p: `${A}/products`, c: `${A}/customers`, d: `${A}/discounts`, f: `${A}/content`, a: `${A}/analytics`, t: `${A}/online-store`, s: `${A}/settings`,
};
