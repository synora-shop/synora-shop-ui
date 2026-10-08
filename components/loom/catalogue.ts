import type { KitProduct } from "@/lib/themes/kit";
/**
 * The demo catalogue the pages the kit does not draw are filled with: the
 * kit's six shoes, with the facts a collection page filters on.
 *
 * Names and prices are the kit's own (three of them really are all called
 * "Skateboard Shoe"). Colours are the kit's nine swatch names, assigned by
 * looking at each photograph; sizes are invented, one or two missing per shoe
 * so that a size filter has something to do.
 */
export const SWATCHES = {
  "Red Pastel": "#e25f5f",
  "Lime Green": "#b8e25f",
  "Navy Blue": "#233c6b",
  "Clean White": "#ffffff",
  "Blue Sky": "#5fabe2",
  Purple: "#b54ef4",
  Pink: "#f44e8a",
  Yellow: "#f4cf4e",
  "Dark Green": "#44936d",
} as const;

export type Swatch = keyof typeof SWATCHES;

export const SIZES = ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"] as const;

/** A product as Loom's lists show it — the platform's KitProduct, plus the kit's starting heart. */
export type CatalogueItem = KitProduct & { loved?: boolean };

export const SHOES: CatalogueItem[] = [
  { id: "casual", title: "Casual Shoe", price: 225, src: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png", colours: ["Navy Blue", "Clean White"], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], age: 3, href: "#", loved: true },
  { id: "skate-nb", title: "Skateboard Shoe", price: 125, src: "/loom/0b42775b5c482fd10ff96fad137ae5ca5aa7a561.png", colours: ["Dark Green", "Clean White"], sizes: ["US 8", "US 9", "US 10", "US 11", "US 12"], age: 1, href: "#" },
  { id: "skate-hi", title: "Skateboard Shoe", price: 125, src: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png", colours: ["Red Pastel", "Clean White"], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], age: 0, href: "/loom/product" },
  { id: "skate-stripe", title: "Skateboard Shoe", price: 125, src: "/loom/c8c225ce10fd34a19ed897401decf4c2dd4806d5.png", colours: ["Dark Green", "Clean White"], sizes: ["US 7", "US 9", "US 10", "US 12"], age: 4, href: "#" },
  { id: "basket", title: "Basket Shoe", price: 125, src: "/loom/6202a986df950869c406241f2f48f416d0807241.png", colours: ["Red Pastel", "Clean White"], sizes: ["US 8", "US 9", "US 10"], age: 2, href: "#" },
  { id: "sport", title: "Sportwear Shoe", price: 159, src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png", colours: ["Red Pastel", "Clean White"], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"], age: 5, href: "#" },
];

/**
 * The design file's price bands, in its dollars — for the reference build,
 * which has no shop and no currency behind it.
 */
const FIGMA_BANDS: PriceBand[] = [
  { label: "Under $130", test: (p: number) => p < 130 },
  { label: "$130 – $200", test: (p: number) => p >= 130 && p <= 200 },
  { label: "Over $200", test: (p: number) => p > 200 },
];

export type PriceBand = { label: string; test: (p: number) => boolean };

/** A tidy number near n: two significant figures ("27,500", "130", "4,500"). */
const tidy = (n: number) => {
  const step = 10 ** Math.max(0, Math.floor(Math.log10(Math.max(n, 1))) - 1);
  return Math.round(n / step) * step;
};

/**
 * Price bands for the products on the page, in the shop's currency: the
 * cheaper third, the middle, the dearer third, cut at tidy numbers. A real
 * shop's prices are whatever it charges in whatever it trades in — dollar
 * bands were wrong for every one of them. No bands at all where the prices do
 * not spread enough to split.
 */
export function priceBands(items: { price: number }[], currency: string | undefined, fmt: (n: number, c?: string) => string): PriceBand[] {
  if (!currency) return FIGMA_BANDS;
  const prices = items.map((p) => p.price).sort((a, b) => a - b);
  if (prices.length < 3) return [];
  const low = tidy(prices[Math.floor(prices.length / 3)]);
  const high = tidy(prices[Math.floor((prices.length * 2) / 3)]);
  if (!(low < high) || low <= prices[0] || high > prices[prices.length - 1]) return [];
  return [
    { label: `Under ${fmt(low, currency)}`, test: (p) => p < low },
    { label: `${fmt(low, currency)} – ${fmt(high, currency)}`, test: (p) => p >= low && p <= high },
    { label: `Over ${fmt(high, currency)}`, test: (p) => p > high },
  ];
}

/** The sizes some product on the page has: the design's order first, then the shop's own, as they come. */
export function offeredSizes(items: { sizes: readonly string[] }[]): string[] {
  const all = Array.from(new Set(items.flatMap((p) => p.sizes)));
  const known = (SIZES as readonly string[]).filter((s) => all.includes(s));
  return [...known, ...all.filter((s) => !known.includes(s))];
}

/** The colours some product on the page has, each with its shade — the design's, else the shop's own, else grey. */
export function offeredColours(items: { colours: string[]; colourHex?: Record<string, string> }[]): { name: string; hex: string }[] {
  const names = Array.from(new Set(items.flatMap((p) => p.colours)));
  return names.map((name) => ({
    name,
    hex: (SWATCHES as Record<string, string>)[name] ?? items.find((p) => p.colourHex?.[name])?.colourHex?.[name] ?? "#d9d9d9",
  }));
}

export const SORTS: { label: string; key: "sort.featured" | "sort.newest" | "sort.priceLow" | "sort.priceHigh"; by: (a: CatalogueItem, b: CatalogueItem) => number }[] = [
  // Featured is the order the collection arrives in; sort() keeps it for ties.
  { label: "Featured", key: "sort.featured", by: () => 0 },
  { label: "Newest", key: "sort.newest", by: (a: CatalogueItem, b: CatalogueItem) => a.age - b.age },
  { label: "Lowest price", key: "sort.priceLow", by: (a: CatalogueItem, b: CatalogueItem) => a.price - b.price },
  { label: "Highest price", key: "sort.priceHigh", by: (a: CatalogueItem, b: CatalogueItem) => b.price - a.price },
];
