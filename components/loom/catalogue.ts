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

export type CatalogueItem = {
  id: string;
  title: string;
  price: number;
  src: string;
  colours: Swatch[];
  sizes: (typeof SIZES)[number][];
  /** Lower is newer — the order "Newest" sorts by. */
  age: number;
  href: string;
  loved?: boolean;
};

export const SHOES: CatalogueItem[] = [
  { id: "casual", title: "Casual Shoe", price: 225, src: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png", colours: ["Navy Blue", "Clean White"], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], age: 3, href: "#", loved: true },
  { id: "skate-nb", title: "Skateboard Shoe", price: 125, src: "/loom/0b42775b5c482fd10ff96fad137ae5ca5aa7a561.png", colours: ["Dark Green", "Clean White"], sizes: ["US 8", "US 9", "US 10", "US 11", "US 12"], age: 1, href: "#" },
  { id: "skate-hi", title: "Skateboard Shoe", price: 125, src: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png", colours: ["Red Pastel", "Clean White"], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], age: 0, href: "/loom/product" },
  { id: "skate-stripe", title: "Skateboard Shoe", price: 125, src: "/loom/c8c225ce10fd34a19ed897401decf4c2dd4806d5.png", colours: ["Dark Green", "Clean White"], sizes: ["US 7", "US 9", "US 10", "US 12"], age: 4, href: "#" },
  { id: "basket", title: "Basket Shoe", price: 125, src: "/loom/6202a986df950869c406241f2f48f416d0807241.png", colours: ["Red Pastel", "Clean White"], sizes: ["US 8", "US 9", "US 10"], age: 2, href: "#" },
  { id: "sport", title: "Sportwear Shoe", price: 159, src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png", colours: ["Red Pastel", "Clean White"], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"], age: 5, href: "#" },
];

export const PRICE_BANDS = [
  { label: "Under $130", test: (p: number) => p < 130 },
  { label: "$130 – $200", test: (p: number) => p >= 130 && p <= 200 },
  { label: "Over $200", test: (p: number) => p > 200 },
] as const;

export const SORTS: { label: string; key: "sort.featured" | "sort.newest" | "sort.priceLow" | "sort.priceHigh"; by: (a: CatalogueItem, b: CatalogueItem) => number }[] = [
  // Featured is the order the collection arrives in; sort() keeps it for ties.
  { label: "Featured", key: "sort.featured", by: () => 0 },
  { label: "Newest", key: "sort.newest", by: (a: CatalogueItem, b: CatalogueItem) => a.age - b.age },
  { label: "Lowest price", key: "sort.priceLow", by: (a: CatalogueItem, b: CatalogueItem) => a.price - b.price },
  { label: "Highest price", key: "sort.priceHigh", by: (a: CatalogueItem, b: CatalogueItem) => b.price - a.price },
];
