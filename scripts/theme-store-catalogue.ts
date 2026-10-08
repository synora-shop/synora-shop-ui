/**
 * What each theme's demo shop sells.
 *
 * Two catalogues, not one shared one, and that is what the design files draw:
 * Loom demos a shoe shop (its Figma file's) and Kite a fashion label (its file's). It is also the honest
 * arrangement — a photography-led theme with a tight grid and a roomy, text-led
 * one are not selling the same goods, and demoing both through the same forty
 * t-shirts would hide exactly the difference a merchant is trying to see.
 *
 * Data only, so `scripts/seed-theme-store.ts` stays readable and a third theme
 * is an entry here rather than a branch there.
 *
 * Loom's products carry the design file's own photographs. A catalogue
 * without its own falls back to `picsum.photos` seeded by slug — deterministic,
 * but scenery, not goods — which no catalogue here is any more:
 * both demos sell their design file's own pieces.
 */

export type DemoProduct = {
  title: string;
  slug: string;
  /** In whole rupees, the way Product.basePrice is stored. */
  price: number;
  /** Optional sale price, so the theme's sale badge has something to show. */
  sale?: number;
  category: string;
  featured?: boolean;
  blurb: string;
  /**
   * Its own photographs, as paths under /public or full URLs. Without them a
   * product gets placeholder photography seeded by its slug.
   */
  images?: string[];
  /** Its own colours, [name, hex]; without them one is picked from the catalogue's option2. */
  colours?: [string, string][];
  /** Its own sizes; without them every one of the catalogue's options. */
  sizes?: string[];
  /** Who made it, when not the shop itself — Kite prints "by {vendor}". */
  vendor?: string;
};

/** A menu the demo shop holds, with dropdowns where an item has children. */
export type DemoMenu = {
  handle: string;
  name: string;
  items: { label: string; href: string; children?: { label: string; href: string }[] }[];
};

export type DemoCatalogue = {
  /** The shop's name, and what the storefront calls itself. */
  storeName: string;
  /** One line, used as the footer tagline and the meta description. */
  tagline: string;
  /**
   * The shop's own announcement bar.
   *
   * A real shop's announcement, not a warning about the demo — the Synora bar
   * above it already says that, and two stacked bars repeating each other read
   * as a mistake rather than as a design. This one is here because the
   * announcement bar is a feature a merchant is judging, and an empty one
   * demos nothing.
   *
   * Its colour comes from the theme, not from the platform default, which is a
   * dark red belonging to neither of these shops.
   */
  announcement: { text: string; background: string };
  /** The hero at the top of the home page. */
  hero: { eyebrow: string; headline: string; subheading: string; cta: string };
  /** The line set large, halfway down. */
  statement: string;
  /** The "our story" paragraph. */
  story: { heading: string; body: string };
  /** Categories, in the order the grid shows them. */
  categories: { name: string; slug: string; description: string }[];
  /** The option axes this catalogue varies on. */
  options: { name: string; values: string[] };
  /** The second axis, or null for a catalogue that has only one. */
  option2: { name: string; values: [string, string][] } | null;
  products: DemoProduct[];
  /** The shop's currency. PKR when not given. */
  currency?: string;
  /** A photograph per category slug; placeholders otherwise. */
  categoryImages?: Record<string, string>;
  /**
   * The menus the theme's sections read, by handle. Given, they replace the
   * default main and footer menus — a theme drawn with dropdowns and footer
   * columns shows them filled, not empty.
   */
  menus?: DemoMenu[];
};

/* ------------------------------------------------------------------ kite -- */

/** The photographs of Kite's design file (public/kite) that show pieces for sale. */
const K = (hash: string) => `/kite/${hash}.png`;
const PIECE = {
  cloak: K("ae520783ab263b34170ec82dfc91d3cb82b750e5"),
  wall: K("dce87de5cf3c53bcde4883753b09c9ea95288237"),
  coat1: K("cb7a6afb47928407f0f6226024e86f93e4bedcd7"),
  coat2: K("f8db06208f6028fbe106b1743683b11580105919"),
  coat3: K("7c0f70607818acbdb71e554bf56f6b8ef1634b0d"),
  bag1: K("86f9c437a168af86d6349e9a3a13deebe9b0b4f0"),
  bag2: K("f82cd67ab29fbf0113fa9c229fd9d7413bc61550"),
  bag3: K("77d4ad7f61fcf3ebab3cabe979ada4e23fb75aad"),
  trousers: K("14a06c3205245ddb6eaf6b05e1df32c85e953cee"),
  shirt: K("c0f4fe1ab275fd0abeb507d3075a4f8f13311af0"),
  coat: K("75d9d56acb3f97386aff47df406bcce831b31ed8"),
};
const SHOES = ["71cc03f852110d2ccf3863036a1a601233042e6d", "f6b572b9164f20ab93b60fe0f891cbc6a1cc3e06", "141bd5c292d12deb2aa9f152d488e468b3b70f02", "0b4eaa605b7da70d1cfd25fb025cb138f6a9241e"].map(K);
/** The file's placeholder words for a piece, kept as the file has them. */
const KITE_BLURB = "A placeholder text is a block of nonsensical or meaningless text that is temporarily used to fill a space where actual content will eventually appear.";
const piece = (n: number, image: string, category: string, featured = false): DemoProduct => ({
  title: "Piece Title",
  slug: `piece-title-${n}`,
  // The file's $875, in rupees at about 280 to the dollar, as Loom's are.
  price: 245000,
  category,
  featured,
  images: [image],
  sizes: ["One size"],
  colours: [],
  blurb: KITE_BLURB,
});

/**
 * Kite: the fashion label its design file draws, "Trümung" (decided 9 October,
 * as Loom's was — the demo sells what the theme was designed around, with the
 * file's own photographs and words, not placeholder scenery). The pieces are
 * the file's "Piece Title" at $875; the product page's Leather Shoes by Angel
 * Vaccaro at $1,200, in black, in its seven sizes. The categories are the
 * file's own groupings: the home page's Limited collection, the account's
 * coats and bags, and the shoes. The file gives the pieces no sizes or
 * colours, so each is one size and no colour.
 */
const kite: DemoCatalogue = {
  storeName: "Trümung",
  tagline: "Shop rare limited edition pieces in our LA & NYC locations.",
  announcement: { text: "Shop rare limited edition pieces in our LA & NYC locations", background: "#040404" },
  hero: {
    eyebrow: "East Village",
    headline: "New York",
    subheading: "Shop rare limited edition pieces in our LA & NYC locations.",
    cta: "Shop collection",
  },
  statement: "This collection is limited to 350 pieces.",
  story: {
    heading: "Crafted in Paris, France",
    body: "Temporarily used to fill a space where actual content will eventually appear. It serves as a visual placeholder to help designers and developers visualize.",
  },
  categories: [
    { name: "Limited collection", slug: "limited-collection", description: "This collection is limited to 350 pieces." },
    { name: "Coats", slug: "coats", description: "Saved coats." },
    { name: "Bags", slug: "bags", description: "Saved bags." },
    { name: "Shoes", slug: "shoes", description: "Leather shoes." },
  ],
  categoryImages: { "limited-collection": PIECE.cloak, coats: PIECE.coat1, bags: PIECE.bag1, shoes: SHOES[0] },
  options: { name: "Size", values: ["07", "7.5", "08", "8.5", "09", "9.5", "10"] },
  option2: { name: "Colour", values: [["black", "#040404"]] },
  products: [
    {
      title: "Leather Shoes",
      slug: "leather-shoes",
      vendor: "Angel Vaccaro",
      price: 336000,
      category: "shoes",
      featured: true,
      images: SHOES,
      colours: [["black", "#040404"]],
      sizes: ["07", "7.5", "08", "8.5", "09", "9.5", "10"],
      blurb: KITE_BLURB,
    },
    piece(1, PIECE.cloak, "limited-collection", true),
    piece(2, PIECE.wall, "limited-collection", true),
    piece(3, PIECE.trousers, "limited-collection"),
    piece(4, PIECE.shirt, "limited-collection"),
    piece(5, PIECE.coat1, "coats"),
    piece(6, PIECE.coat2, "coats"),
    piece(7, PIECE.coat3, "coats"),
    piece(8, PIECE.coat, "coats"),
    piece(9, PIECE.bag1, "bags"),
    piece(10, PIECE.bag2, "bags"),
    piece(11, PIECE.bag3, "bags"),
  ],
  // The file's header and footer links. Shop opens onto the categories;
  // Lookbook and About (named by the file, never drawn as pages) go to the
  // home page's Journey and About; Shipping & returns to the shop's FAQ. The
  // platform has no privacy-policy page yet, so that one is words, not a link.
  menus: [
    {
      handle: "main-menu",
      name: "Main menu",
      items: [
        {
          label: "Shop",
          href: "/shop",
          children: [
            { label: "Limited collection", href: "/collections/limited-collection" },
            { label: "Coats", href: "/collections/coats" },
            { label: "Bags", href: "/collections/bags" },
            { label: "Shoes", href: "/collections/shoes" },
          ],
        },
        { label: "Lookbook", href: "/#journey" },
        { label: "About", href: "/#about" },
      ],
    },
    {
      handle: "footer-menu",
      name: "Footer menu",
      items: [
        { label: "SHIPPING & RETURNS", href: "/faq" },
        { label: "PRIVACY POLICY", href: "" },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ loom -- */

/** The six shoes in Loom's design file, photographed for it (public/loom). */
const SHOE = {
  casual: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png",
  skateLow: "/loom/0b42775b5c482fd10ff96fad137ae5ca5aa7a561.png",
  skateHigh: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png",
  skateStripe: "/loom/c8c225ce10fd34a19ed897401decf4c2dd4806d5.png",
  basket: "/loom/6202a986df950869c406241f2f48f416d0807241.png",
  sport: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png",
};
const NAVY: [string, string] = ["Navy Blue", "#233c6b"];
const WHITE: [string, string] = ["Clean White", "#ffffff"];
const GREEN: [string, string] = ["Dark Green", "#12463c"];
const RED: [string, string] = ["Red Pastel", "#e25f5f"];

/**
 * Loom: the shoe shop its design file draws (decided 8 October — the demo
 * sells what the theme was designed around, with the design's own
 * photographs, not placeholder scenery). Prices are the file's dollars in
 * rupees, at about 280 to the dollar, rounded — the shop trades in PKR like
 * every other. The home page's photographs and words are the theme's own section
 * defaults; this is the catalogue behind them.
 */
const loom: DemoCatalogue = {
  storeName: "Ecommerce",
  tagline: "Ecommerce is a free UI Kit from Paperpillar that you can use for your personal or commercial project.",
  announcement: { text: "Free delivery on every order over Rs 50,000", background: "#121212" },
  hero: {
    eyebrow: "Summer",
    headline: "Color of Summer Outfit",
    subheading: "100+ Collections for your outfit inspirations in this summer",
    cta: "View collections",
  },
  statement: "We will always answer whatever your questions.",
  story: {
    heading: "Shoes for every step",
    body: "Skateboard, basket, casual and sportswear — six pairs, each made to be worn hard and look right doing it.",
  },
  categories: [
    { name: "Shoes", slug: "shoes", description: "Every pair in the shop." },
    { name: "Skateboard", slug: "skateboard", description: "Flat soles and padded collars, built for the board." },
    { name: "Sneakers", slug: "sneakers", description: "Casual, basket and sportswear pairs for every day." },
  ],
  categoryImages: { shoes: SHOE.skateHigh, skateboard: SHOE.skateStripe, sneakers: SHOE.sport },
  options: { name: "Size", values: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"] },
  option2: { name: "Colour", values: [NAVY, WHITE, GREEN, RED] },
  products: [
    { title: "Casual Shoe", slug: "casual-shoe", price: 63000, category: "sneakers", featured: true, images: [SHOE.casual], colours: [NAVY, WHITE], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], blurb: "A clean leather upper on a cushioned sole — the pair that goes with everything." },
    { title: "Skateboard Shoe", slug: "skateboard-shoe-low", price: 35000, category: "skateboard", featured: true, images: [SHOE.skateLow], colours: [GREEN, WHITE], sizes: ["US 8", "US 9", "US 10", "US 11", "US 12"], blurb: "Low-cut suede with a vulcanised sole that grips the board and lasts the session." },
    { title: "Skateboard Shoe High", slug: "skateboard-shoe-high", price: 35000, category: "skateboard", featured: true, images: [SHOE.skateHigh], colours: [RED, WHITE], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], blurb: "The high-top: a padded collar for the ankle, a toe cap for the ollie, and the wing on the side." },
    { title: "Skateboard Shoe Stripe", slug: "skateboard-shoe-stripe", price: 35000, sale: 27500, category: "skateboard", images: [SHOE.skateStripe], colours: [GREEN, WHITE], sizes: ["US 7", "US 9", "US 10", "US 12"], blurb: "Canvas and suede with the side stripe, on the same board-gripping sole." },
    { title: "Basket Shoe", slug: "basket-shoe", price: 35000, category: "sneakers", images: [SHOE.basket], colours: [RED, WHITE], sizes: ["US 8", "US 9", "US 10"], blurb: "A court classic: a supportive mid-cut and a sole made for quick turns." },
    { title: "Sportwear Shoe", slug: "sportwear-shoe", price: 44500, category: "sneakers", featured: true, images: [SHOE.sport], colours: [RED, WHITE], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"], blurb: "Light mesh and a springy midsole, for the run and the rest of the day." },
  ],
  // The design file's menus: three categories with dropdowns in the header, the
  // help strip, the footer's three columns, the trending chips and the popular
  // searches — each pointing somewhere real in this shop.
  menus: [
    {
      handle: "main-menu",
      name: "Main menu",
      items: [
        {
          label: "All Category",
          href: "/shop",
          children: [
            { label: "Shoes", href: "/collections/shoes" },
            { label: "Skateboard", href: "/collections/skateboard" },
            { label: "Sneakers", href: "/collections/sneakers" },
          ],
        },
        { label: "Gift Cards", href: "/shop", children: [{ label: "Digital gift card", href: "/shop" }] },
        {
          label: "Special Event",
          href: "/shop",
          children: [
            { label: "Summer Outfit", href: "/shop" },
            { label: "New Arrivals", href: "/shop?sort=newest" },
          ],
        },
      ],
    },
    { handle: "help", name: "Help", items: [{ label: "FAQ", href: "/faq" }, { label: "About Us", href: "/about" }, { label: "Contact Us", href: "/contact" }] },
    {
      handle: "popular",
      name: "Popular",
      items: [
        { label: "Shoes", href: "/collections/shoes" },
        { label: "Skateboard", href: "/collections/skateboard" },
        { label: "Sneakers", href: "/collections/sneakers" },
      ],
    },
    {
      handle: "footer-menu",
      name: "Footer menu",
      items: [
        { label: "All Category", href: "/shop" },
        { label: "Wishlist", href: "/wishlist" },
        { label: "Your account", href: "/account" },
      ],
    },
    {
      handle: "other",
      name: "Other",
      items: [
        { label: "Tracking Package", href: "/account" },
        { label: "FAQ", href: "/faq" },
        { label: "About Us", href: "/about" },
        { label: "Contact Us", href: "/contact" },
      ],
    },
    {
      handle: "trending-chips",
      name: "Trending chips",
      items: [
        { label: "Shoes", href: "/collections/shoes" },
        { label: "Skateboard", href: "/collections/skateboard" },
        { label: "Sneakers", href: "/collections/sneakers" },
      ],
    },
    {
      handle: "popular-searches",
      name: "Popular searches",
      items: [
        { label: "Skateboard", href: "/shop?q=skateboard" },
        { label: "Red", href: "/shop?q=red" },
        { label: "White", href: "/shop?q=white" },
        { label: "Basket", href: "/shop?q=basket" },
      ],
    },
  ],
};

/** Every demo catalogue, by the theme's URL slug. */
export const DEMO_CATALOGUES: Readonly<Record<string, DemoCatalogue>> = { kite, loom };
