import type { KiteContext, KiteMenu } from "@/components/kite/contract";
import type { KitProduct } from "@/lib/themes/kit";
import { KITE_IMG } from "@/components/kite/assets";

const BLURB =
  "A placeholder text is a block of nonsensical or meaningless text that is temporarily used to fill a space where actual content will eventually appear.";

/** The file's pieces: "Piece Title", $875, its photographs and its placeholder blurb. */
const piece = (id: string, src: string, age: number): KitProduct => ({
  id, title: "Piece Title", price: 875, src, colours: [], sizes: [], age, href: "/kite", blurb: BLURB,
});
export const KITE_DEMO_PIECES: KitProduct[] = [piece("cloak", KITE_IMG.pieceCloak, 0), piece("wall", KITE_IMG.pieceWall, 1)];

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
