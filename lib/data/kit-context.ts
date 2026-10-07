import { cache } from "react";
import type { KitContext, KitMenu, KitProduct, KitProductPage } from "@/lib/themes/kit";
import { getMenus, headerLinks, type MenuWithItems } from "@/lib/data/menus";
import { getSiteTextOverrides } from "@/lib/site-text";
import { effectivePrice } from "@/lib/data/products";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";
import { productHtmlToText } from "@/lib/product-html";
import { storeBase } from "@/lib/theme-store";
import type { KitLink, KitRoutes } from "@/lib/themes/kit";

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
  return { menus: kitMenus, routes, products: [], text, base, currency };
});
