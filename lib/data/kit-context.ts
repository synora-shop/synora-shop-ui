import { cache } from "react";
import type { KitContext, KitMenu, KitProduct, KitProductPage } from "@/lib/themes/kit";
import { getMenus, headerLinks, type MenuWithItems } from "@/lib/data/menus";
import { getSiteTextOverrides } from "@/lib/site-text";
import { effectivePrice } from "@/lib/data/products";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";
import { productHtmlToText } from "@/lib/product-html";
import { storeBase } from "@/lib/theme-store";
import type { KitCheckout, KitCustomer, KitLink, KitOrder, KitRoutes } from "@/lib/themes/kit";
import { paymentMethodMeta } from "@/lib/payment-methods";
import { checkoutLabel, isGatewayProvider } from "@/lib/payments/providers";
import { getStoreSettings } from "@/lib/data/settings";
import { currentShopId, db } from "@/lib/data/shop";
import { shopSession } from "@/lib/auth-guard";
import { offerableGateways } from "@/lib/payments/offer";
import { checkoutMethods } from "@/lib/payment-methods";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { currentCustomer } from "@/lib/data/customer";
import { CITIES } from "@/lib/cities";

/**
 * The shop's data in the shapes a theme kit's sections read (lib/themes/kit.ts).
 *
 * Every section of every kit is handed this rather than reaching for it, so
 * these adapters are the whole of what a kit can see: no cost prices, no
 * customer other than the one signed in, nothing another shop owns.
 */

/**
 * Every menu, by its id and by its handle. A setting stores an id once a
 * merchant picks a menu; a kit's defaults name menus by handle ("main-menu"),
 * because those are the same in every shop and an id never is.
 */
export function toKitMenus(menus: MenuWithItems[]): Record<string, KitMenu> {
  const out: Record<string, KitMenu> = {};
  for (const m of menus) {
    const menu: KitMenu = { id: m.id, name: m.name, items: headerLinks(m.items) };
    out[m.id] = menu;
    if (m.handle && !out[m.handle]) out[m.handle] = menu;
  }
  return out;
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  createdAt: Date;
  variants: {
    id?: string;
    size: string;
    color: string;
    colorHex?: string | null;
    stock: number;
    trackInventory?: boolean;
    continueSellingWhenOutOfStock?: boolean;
  }[];
};

const unique = (xs: string[]) => Array.from(new Set(xs.map((x) => x.trim()).filter(Boolean)));

/** Whether a variant can be bought now — the same three facts the checkout weighs. */
const available = (v: ProductRow["variants"][number]) =>
  v.trackInventory === false || v.continueSellingWhenOutOfStock === true || v.stock > 0;

/** A product as a list shows it. `rank` orders "Newest": 0 is the newest of the list. */
export function toKitProduct(p: ProductRow, rank: number, base = ""): KitProduct {
  return {
    id: p.id,
    title: p.title,
    price: effectivePrice(p as never),
    src: p.images[0] ?? "",
    colours: unique(p.variants.map((v) => v.color)),
    sizes: unique(p.variants.map((v) => v.size)),
    age: rank,
    href: withBase(base, `/product/${p.slug}`),
  };
}

/** A list of products, newest ranked first. */
export function toKitProducts(rows: ProductRow[], base = ""): KitProduct[] {
  const byAge = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.map((p) => toKitProduct(p, byAge.indexOf(p), base));
}

/** A product as its own page shows it. */
export function toKitProductPage(
  p: ProductRow & {
    description: string | null;
    descriptionHtml?: string | null;
    categories: { name: string }[];
  },
  currency: string
): KitProductPage {
  const colours = unique(p.variants.map((v) => v.color)).map((label) => ({
    label,
    color: p.variants.find((v) => v.color === label)?.colorHex || "#d9d9d9",
  }));
  const sizes = unique(p.variants.map((v) => v.size)).map((label) => ({
    label,
    soldOut: !p.variants.some((v) => v.size === label && available(v)),
  }));
  const description = productHtmlToText(p.descriptionHtml) || p.description || "";
  return {
    id: p.id,
    eyebrow: p.categories.map((c) => c.name).join(" · "),
    title: p.title,
    price: formatMoney(effectivePrice(p as never), currency),
    description,
    photos: (p.images.length ? p.images : [""]).map((src, i) => ({ src, alt: i === 0 ? p.title : `${p.title}, photograph ${i + 1}` })),
    colours,
    sizes,
    details: [],
    slug: p.slug,
    amount: effectivePrice(p as never),
    variants: p.variants.map((v) => ({ id: v.id ?? "", size: v.size, color: v.color, stock: v.stock })),
  };
}

/** The storefront's own pages. */
export const STORE_ROUTES: KitRoutes = {
  home: "/",
  collection: "/shop",
  search: "/shop",
  cart: "/cart",
  checkout: "/checkout",
  account: "/account",
  signIn: "/account/login",
  wishlist: "/wishlist",
};

/**
 * A root-relative address with the storefront's base in front — "" on every
 * real shop, "/theme-store/loom" inside a theme's demo — so browsing a demo
 * stays inside it, exactly as StoreLink does for the platform's own links.
 */
export const withBase = (base: string, href: string) => (base && href.startsWith("/") && !href.startsWith("//") ? base + href : href);

const baseLinks = (base: string, items: KitLink[]): KitLink[] =>
  items.map((l) => ({ ...l, href: withBase(base, l.href), children: l.children ? baseLinks(base, l.children) : undefined }));

/** What every page of a kit storefront is handed: the menus, the page addresses and the shop's own Site text. */
export const kitBaseContext = cache(async (): Promise<KitContext> => {
  const [menus, text, base, currency] = await Promise.all([getMenus(), getSiteTextOverrides(), storeBase(), getCurrency()]);
  const kitMenus = toKitMenus(menus);
  for (const k of Object.keys(kitMenus)) kitMenus[k] = { ...kitMenus[k], items: baseLinks(base, kitMenus[k].items) };
  const routes = Object.fromEntries(Object.entries(STORE_ROUTES).map(([k, v]) => [k, withBase(base, v)])) as KitRoutes;
  return { live: true, menus: kitMenus, routes, products: [], text, base, currency };
});

/**
 * The checkout's terms as the shop has set them up — exactly what the
 * platform's own checkout page reads (app/(storefront)/checkout/page.tsx), so a
 * kit cannot offer a method, a city or a fee the order API would refuse.
 */
export async function kitCheckoutTerms(): Promise<KitCheckout> {
  const settings = await getStoreSettings();
  const shopId = await currentShopId();
  const staff = await shopSession();
  const gateways = await offerableGateways(shopId, resolveStoreDefaults(settings).currency, !!staff && staff.shop.id === shopId);
  const methods = checkoutMethods(settings.enabledPaymentMethods, settings, gateways);

  const me = await currentCustomer();
  const customer = me
    ? await (await db()).customer.findFirst({
        where: { id: me.id },
        include: { addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }], take: 1 } },
      })
    : null;
  const address = customer?.addresses[0];
  const [first, ...rest] = (customer?.name ?? "").trim().split(/\s+/);

  return {
    methods: methods.map((m) => ({ value: m.value, label: m.label, hint: m.hint, instructions: m.instructions, redirects: m.redirects })),
    shippingFee: settings.shippingFee,
    freeShippingFrom: settings.freeShippingThreshold ?? null,
    cities: CITIES.map((c) => c.name),
    initial: customer
      ? {
          firstName: first ?? "",
          lastName: rest.join(" "),
          email: customer.email,
          phone: address?.phone ?? customer.phone ?? "",
          line1: address?.line1 ?? "",
          city: address?.city ?? "",
          postcode: address?.postalCode ?? "",
        }
      : undefined,
  };
}

/** A date as a customer reads it: "8 Oct 2026". */
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const STATE: Record<string, KitCustomer["orders"][number]["state"]> = {
  PENDING: "ordered",
  CONFIRMED: "ordered",
  PACKED: "packed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};
const STAGE: Record<string, number> = { PENDING: 0, CONFIRMED: 0, PACKED: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: 0 };

const nameParts = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  return { firstName: first ?? "", lastName: rest.join(" ") };
};

/** How many orders the account lists — the platform's own order history pages by the same. */
const ACCOUNT_ORDERS = 20;

/**
 * The signed-in customer as a kit's account page shows them: their latest
 * orders and their saved addresses. Null for a guest.
 */
export async function kitCustomer(base = ""): Promise<KitCustomer | null> {
  const me = await currentCustomer();
  if (!me) return null;
  const client = await db();
  const [customer, orders, addresses] = await Promise.all([
    client.customer.findFirst({ where: { id: me.id }, select: { name: true, email: true, phone: true } }),
    client.order.findMany({
      where: { customerId: me.id, deletedAt: null },
      include: { items: { include: { product: { select: { images: true } } } } },
      orderBy: { createdAt: "desc" },
      take: ACCOUNT_ORDERS,
    }),
    client.address.findMany({ where: { customerId: me.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
  ]);
  if (!customer) return null;
  return {
    ...nameParts(customer.name),
    email: customer.email,
    phone: customer.phone ?? "",
    orders: orders.map((o) => ({
      id: o.id,
      date: day(o.createdAt),
      state: STATE[o.orderStatus] ?? "ordered",
      total: o.total,
      items: o.items.slice(0, 2).map((i) => ({ title: i.title, src: i.product?.images[0] ?? "" })),
      href: withBase(base, `/order-confirmation/${o.id}`),
    })),
    addresses: addresses.map((a, i) => ({
      id: a.id,
      label: a.label,
      lines: [a.line1, a.line2, [a.city, a.postalCode].filter(Boolean).join(" "), a.phone].filter((x): x is string => !!x),
      main: a.isDefault || i === 0,
    })),
  };
}

type OrderRow = {
  id: string;
  customerId: string | null;
  createdAt: Date;
  orderStatus: string;
  paymentMethod: string;
  shippingFee: number;
  discountCode: string | null;
  discountAmount: number;
  customerName: string;
  customerPhone: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostalCode: string | null;
  items: { id: string; title: string; size: string; color: string; price: number; quantity: number; product: { slug: string; images: string[] } | null }[];
};

/**
 * One order as a kit's order page shows it. The delivery address goes only to
 * the signed-in customer who placed it: an order's page opens from its id,
 * and an id is not a password.
 */
export async function kitOrder(o: OrderRow, notice: string | undefined, base = ""): Promise<KitOrder> {
  const me = await currentCustomer();
  const owner = !!me && o.customerId === me.id;
  return {
    id: o.id,
    placed: day(o.createdAt),
    stage: STAGE[o.orderStatus] ?? 0,
    cancelled: o.orderStatus === "CANCELLED",
    dates: [day(o.createdAt), null, null, null],
    arriving: null,
    lines: o.items.map((i) => ({
      id: i.id,
      title: i.title,
      price: i.price,
      src: i.product?.images[0] ?? "",
      colour: i.color,
      size: i.size,
      qty: i.quantity,
      href: i.product ? withBase(base, `/product/${i.product.slug}`) : "",
    })),
    delivery: o.shippingFee,
    discount: o.discountAmount > 0 ? { code: o.discountCode ?? "", saving: o.discountAmount } : null,
    speed: null,
    address: owner
      ? [o.customerName, o.shippingLine1, o.shippingLine2, [o.shippingCity, o.shippingPostalCode].filter(Boolean).join(" "), o.customerPhone].filter(
          (x): x is string => !!x
        )
      : null,
    payment: isGatewayProvider(o.paymentMethod) ? checkoutLabel(o.paymentMethod) : (paymentMethodMeta(o.paymentMethod)?.label ?? o.paymentMethod),
    notice,
    tracking: "",
  };
}

/**
 * Whether a page may stand a kit's sample data in for the shop's own: in the
 * customizer's preview, for this shop's own staff. The preview parameter
 * alone is something anyone can type, and a shopper who types it should see
 * their own storefront, not a made-up account.
 */
export async function showsSamples(preview: boolean): Promise<boolean> {
  if (!preview) return false;
  const staff = await shopSession();
  return !!staff && staff.shop.id === (await currentShopId());
}
