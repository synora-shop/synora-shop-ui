import type { KiteContext, KiteMenu } from "@/components/kite/contract";
import type { KitProduct, KitProductPage } from "@/lib/themes/kit";
import { KITE_IMG } from "@/components/kite/assets";

const BLURB =
  "A placeholder text is a block of nonsensical or meaningless text that is temporarily used to fill a space where actual content will eventually appear.";

/** The file's pieces: "Piece Title", $875, its photographs and its placeholder blurb. */
const piece = (id: string, src: string, age: number): KitProduct => ({
  id, title: "Piece Title", price: 875, src, colours: [], sizes: [], age, href: "/kite", blurb: BLURB,
});
export const KITE_DEMO_PIECES: KitProduct[] = [piece("cloak", KITE_IMG.pieceCloak, 0), piece("wall", KITE_IMG.pieceWall, 1)];

/** "Style with": the file's three pieces, named and priced as it names them. */
export const KITE_DEMO_STYLE_WITH: KitProduct[] = [
  { ...piece("trousers", KITE_IMG.styleTrousers, 0), blurb: undefined },
  { ...piece("shirt", KITE_IMG.styleShirt, 1), blurb: undefined },
  { ...piece("coat", KITE_IMG.styleCoat, 2), blurb: undefined },
];

/** Two things in the bag — the count the file draws on the product and account pages. */
export const KITE_DEMO_BAG = [KITE_IMG.pieceCloak, KITE_IMG.pieceWall].map((src, i) => ({
  id: `bag-${i}`, title: "Piece Title", price: 875, src, colour: "", size: "", qty: 1, href: "/kite",
}));

/** The file's product: Leather Shoes by Angel Vaccaro, $1,200, black, seven sizes. */
export const KITE_DEMO_PRODUCT: KitProductPage = {
  id: "leather-shoes",
  eyebrow: "",
  vendor: "Angel Vaccaro",
  title: "LEATHER SHOES",
  price: "$1,200",
  description: BLURB,
  photos: [
    { src: KITE_IMG.shoe, alt: "Leather Shoes, worn" },
    { src: KITE_IMG.shoeSide, alt: "Leather Shoes, from the side" },
    { src: KITE_IMG.shoePair, alt: "Leather Shoes, the pair" },
    { src: KITE_IMG.shoeWorn, alt: "Leather Shoes, in step" },
  ],
  colours: [{ label: "black", color: "#040404" }],
  sizes: ["07", "7.5", "08", "8.5", "09", "9.5", "10"].map((label) => ({ label })),
  details: [],
  slug: "leather-shoes",
  amount: 1200,
  variants: [],
};

/**
 * What the reference build at /kite is drawn with — no shop behind it.
 *
 * The header's three links are the file's. "Shop" carries a chevron there,
 * which this format draws for an item with links under it; the file does not
 * say which, so its one link is a placeholder ("Shop all") to make the
 * chevron show, not a design.
 */
const m = (id: string, name: string, items: KiteMenu["items"]): KiteMenu => ({ id, name, items });

export const KITE_DEMO_MENUS: Record<string, KiteMenu> = {
  "main-menu": m("main-menu", "Main menu", [
    { id: "shop", label: "Shop", href: "/kite", children: [{ id: "shop-all", label: "Shop all", href: "/kite" }] },
    { id: "lookbook", label: "Lookbook", href: "/kite" },
    { id: "about", label: "About", href: "/kite" },
  ]),
};

KITE_DEMO_MENUS["footer-menu"] = m("footer-menu", "Footer menu", [
  { id: "shipping", label: "SHIPPING & RETURNS", href: "/kite" },
  { id: "privacy", label: "PRIVACY POLICY", href: "/kite" },
]);

export const KITE_DEMO_ROUTES: KiteContext["routes"] = {
  home: "/kite",
  collection: "/kite",
  search: "/kite",
  cart: "/kite",
  checkout: "/kite",
  account: "/kite",
  signIn: "/kite",
  wishlist: "/kite",
};

export function kiteDemoContext(extra: Partial<KiteContext> = {}): KiteContext {
  return { menus: KITE_DEMO_MENUS, routes: KITE_DEMO_ROUTES, products: KITE_DEMO_PIECES, ...extra };
}
