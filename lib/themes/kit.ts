import type { SectionSchema } from "@/lib/section-schema";
import { resolveSchemaData } from "@/lib/section-schema";

/**
 * A theme that brings its own sections — the platform's half of the contract.
 *
 * Decided 8 October 2026: a theme owns its sections, as on Shopify. A theme
 * used to be palette and layout variants over the platform's one shared set
 * of sections (docs/THEMES.md §1 said "a theme never owns a component"). That
 * could not make Loom look like Loom, and it cannot make any two themes truly
 * different, so a theme may now ship a *kit*: its own section types, each with
 * a SectionSchema the customizer builds its panel from, and its own default
 * templates — what each page is made of.
 *
 * What the platform promises every kit is the context below: the shop's data,
 * already fetched, in these shapes. What a kit promises the platform is that
 * its sections draw only from their settings and that context — never
 * fetching, never reading a database — so one render function serves the
 * storefront and the customizer's live preview alike, and a kit cannot reach
 * anything a theme should not.
 *
 * Kits are code shipped by Synora, like every theme here. There is no upload.
 */

/** One link in a menu, with its dropdown. MenuItem allows two levels and refuses a third. */
export type KitLink = { id: string; label: string; href: string; children?: KitLink[] };

/** A menu the merchant built under Admin → Menus, by the id a `menu` setting stores. */
export type KitMenu = { id: string; name: string; items: KitLink[] };

/** A product as a list shows it — a grid, a search, a recommendation. */
export type KitProduct = {
  id: string;
  title: string;
  /** In the shop's currency, whole units. */
  price: number;
  /** The first photograph. */
  src: string;
  /** Colour names, as the product's options spell them. */
  colours: string[];
  /** Size names, as the product's options spell them. */
  sizes: string[];
  /** Lower is newer — what "Newest" sorts by. */
  age: number;
  href: string;
};

/** A photograph on a product page. `at` and `zoom` let one photograph stand in for several views. */
export type KitPhoto = { src: string; alt: string; at?: string; zoom?: number };

/** A product as its own page shows it. */
export type KitProductPage = {
  id: string;
  /** The small line over the name — its category. */
  eyebrow: string;
  title: string;
  /** Formatted in the shop's currency. */
  price: string;
  description: string;
  photos: KitPhoto[];
  colours: { label: string; color: string }[];
  sizes: { label: string; soldOut?: boolean }[];
  /** The product's own fold-out details. Policies shared by every product are section settings. */
  details: { title: string; body: string }[];
  /** For the cart: the address part and every colour-and-size combination that exists. */
  slug: string;
  /** In the shop's currency, whole units — what the cart charges. */
  amount: number;
  variants: { id: string; size: string; color: string; stock: number }[];
};

/** One line in a cart. */
export type KitCartLine = {
  id: string;
  title: string;
  price: number;
  src: string;
  colour: string;
  size: string;
  qty: number;
  href: string;
};

/** An order as its own page shows it. */
export type KitOrder = {
  id: string;
  placed: string;
  /** Where it has got to, 0–3: ordered, packed, on its way, delivered. */
  stage: number;
  /** When each stage happened, or is expected. */
  dates: [string, string, string, string];
  arriving: string;
  lines: KitCartLine[];
  delivery: number;
  speed: string;
  address: string[];
  payment: string;
  tracking: string;
};

/** A signed-in customer: who they are, their orders, their addresses. */
export type KitCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  orders: {
    id: string;
    date: string;
    state: "shipped" | "delivered";
    total: number;
    items: { title: string; src: string }[];
    href: string;
  }[];
  addresses: { id: string; label: string; lines: string[]; main: boolean }[];
};

/**
 * Where the shop's own pages are. A kit never writes "/cart": the platform's
 * storefront and a theme's demo serve the same pages at different addresses.
 */
export type KitRoutes = {
  home: string;
  /** Every product. */
  collection: string;
  /** Searched with `?q=`. */
  search: string;
  cart: string;
  checkout: string;
  account: string;
  signIn: string;
  wishlist: string;
};
export type KitRoute = keyof KitRoutes;

const ROUTE_NAMES = ["home", "collection", "search", "cart", "checkout", "account", "signIn", "wishlist"] as const;

/** Whether a link setting holds one of the shop's own pages by name — "route:cart". */
export function isKitRoute(value: unknown): boolean {
  const m = typeof value === "string" ? /^route:(\w+)$/.exec(value.trim()) : null;
  return !!m && (ROUTE_NAMES as readonly string[]).includes(m[1]);
}

/**
 * A link setting's value, as a real address. A setting may hold
 * "route:cart" — Shopify's "shopify://…" — so a kit's defaults point at the
 * shop's own cart wherever that is; anything else is an address already.
 */
export function kitHref(ctx: Pick<KitContext, "routes">, value: string): string {
  const m = /^route:(\w+)$/.exec(value);
  if (!m) return value || "#";
  return ctx.routes[m[1] as KitRoute] ?? "#";
}

/** What a checkout offers, as the shop has set it up. */
export type KitCheckout = {
  /** The ways to pay this shop takes, in the order the shop lists them. */
  methods: { value: string; label: string; hint: string; instructions: string | null; redirects: boolean }[];
  /** In the shop's currency, whole units. */
  shippingFee: number;
  /** Free delivery from this subtotal; null when there is no such threshold. */
  freeShippingFrom: number | null;
  /** The cities this shop delivers to. The order is refused for any other. */
  cities: string[];
  /** A signed-in customer's details, to start the form from. */
  initial?: { firstName: string; lastName: string; email: string; phone: string; line1: string; city: string; postcode: string };
};

/** The shop's data every section may read. Handed in, never fetched by a section. */
export type KitContext = {
  /**
   * True on a real storefront, where the platform's cart, checkout and
   * sign-in are behind the kit's actions; absent in a theme's own reference
   * build, which shows how things look with nothing behind them.
   */
  live?: boolean;
  /** The checkout's terms, on the cart and checkout pages. */
  checkout?: KitCheckout;
  /** Which half of the sign-in page to open on. */
  authMode?: "in" | "up";
  /** Where to go once signed in. */
  afterSignIn?: string;
  /** Which tab of the account to open on. */
  accountTab?: "orders" | "addresses" | "details";
  menus: Record<string, KitMenu>;
  routes: KitRoutes;
  /** The products the page is about — a collection's, a search's, the shop's featured. */
  products: KitProduct[];
  /** The search page's query. */
  query?: string;
  /** The product page's product. */
  product?: KitProductPage;
  /** The collection page's collection. */
  collection?: { title: string; description: string };
  /** The order page's order. */
  order?: KitOrder;
  /** The signed-in customer, on the account pages. */
  customer?: KitCustomer;
  /** The cart, on the cart and checkout pages. */
  cart?: KitCartLine[];
  /** The shop's own Site text edits, by key. A kit falls back to its own wording. */
  text?: Record<string, string>;
  /** Put in front of a root-relative product or page address — "" except inside a theme demo. */
  base?: string;
  /** The shop's currency code; prices are formatted in it. */
  currency?: string;
  /** A wishlist to draw before the browser's own is read — the demo's; nothing on a real shop. */
  wishlist?: Pick<KitProduct, "id" | "title" | "price" | "src" | "href">[];
};

/** A section's definition: what it can be set to, and how it draws. */
export type KitSectionDef = {
  schema: SectionSchema;
  Render: (props: { data: Record<string, unknown>; ctx: KitContext }) => React.ReactNode;
};

/** One section in a template: its type, its stored settings, whether it is shown. */
export type KitSectionEntry = { id: string; type: string; visible?: boolean; data?: Record<string, unknown> };

/** A page — or the header or footer group — as an ordered list of sections. Shopify's JSON template. */
export type KitTemplate = { name: string; sections: KitSectionEntry[] };

/**
 * The templates every kit provides, by the name a stored edit is kept under.
 * "header" and "footer" are groups: drawn on every page, edited once.
 */
export const TEMPLATE_NAMES = [
  "index",
  "product",
  "collection",
  "search",
  "cart",
  "checkout",
  "account",
  "sign-in",
  "order",
  "wishlist",
  "header",
  "footer",
] as const;
export type TemplateName = (typeof TEMPLATE_NAMES)[number];

/** Settings with every default filled, by the platform's own rules. */
export const resolveKitSection = (def: KitSectionDef, stored?: Record<string, unknown>) => resolveSchemaData(def.schema, stored);
