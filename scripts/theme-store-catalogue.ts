/**
 * What each theme's demo shop sells.
 *
 * Two catalogues, not one shared one, and that is what the design files draw:
 * Loom demos a shoe shop (its Figma file's) and Kite demos streetwear. It is also the honest
 * arrangement — a photography-led theme with a tight grid and a roomy, text-led
 * one are not selling the same goods, and demoing both through the same forty
 * t-shirts would hide exactly the difference a merchant is trying to see.
 *
 * Data only, so `scripts/seed-theme-store.ts` stays readable and a third theme
 * is an entry here rather than a branch there.
 *
 * Loom's products carry the design file's own photographs. A catalogue
 * without its own falls back to `picsum.photos` seeded by slug — deterministic,
 * but scenery, not goods — which is Kite's state; real photography for Kite
 * is outstanding (docs/THEMES.md §5b).
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

/**
 * Kite: streetwear, because Kite is the photography-led theme.
 *
 * Its tight grid, tall editorial card and hover image swap are all built for a
 * shop whose pictures do the selling, so the demo sells something photographed.
 */
const kite: DemoCatalogue = {
  storeName: "Kite Supply",
  tagline: "Heavyweight basics and outerwear, made in small runs.",
  announcement: { text: "Free delivery on orders over Rs 5,000", background: "#12463c" },
  hero: {
    eyebrow: "Autumn / Winter",
    headline: "Built heavy. Worn daily.",
    subheading:
      "Twelve-ounce cotton, boxed shoulders and a fit that holds its shape after the hundredth wash.",
    cta: "Shop the collection",
  },
  statement: "Small runs. No restocks. Nothing made twice.",
  story: {
    heading: "Made in small runs",
    body: "We cut sixty of a thing, not six thousand. It means a piece sells out and does not come back, and it means every run is made by people we can call by name. The cotton is milled in Faisalabad, the cut-and-sew is forty minutes from where we sit, and the fit is argued about at length before anything is made.",
  },
  categories: [
    { name: "T-shirts", slug: "t-shirts", description: "Heavyweight cotton, boxed shoulders, cut to hold its shape." },
    { name: "Hoodies", slug: "hoodies", description: "Brushed-back fleece with a hood that stands up on its own." },
    { name: "Outerwear", slug: "outerwear", description: "Coach jackets, bombers and overshirts for the six cold weeks." },
    { name: "Shirts", slug: "shirts", description: "Oxfords and overshirts, cut a little wider than they need to be." },
    { name: "Trousers", slug: "trousers", description: "Carpenter fits, wide legs and one pleated trouser." },
    { name: "Footwear", slug: "footwear", description: "Two silhouettes, made properly, resoleable." },
    { name: "Accessories", slug: "accessories", description: "Caps, belts, socks and the small things." },
  ],
  options: { name: "Size", values: ["S", "M", "L", "XL"] },
  option2: {
    name: "Colour",
    values: [["Black", "#111111"], ["Bone", "#e8e1d5"], ["Navy", "#1c2a44"], ["Olive", "#4a5340"], ["Rust", "#9c4a2a"]],
  },
  products: [
    { title: "Heavyweight Box Tee", slug: "heavyweight-box-tee", price: 4200, category: "t-shirts", featured: true, blurb: "Twelve-ounce cotton with a boxed shoulder and a hem that sits at the hip." },
    { title: "Everyday Pocket Tee", slug: "everyday-pocket-tee", price: 3600, sale: 2900, category: "t-shirts", blurb: "The lighter one, for the nine months a year it is too warm for anything else." },
    { title: "Long Sleeve Rib Tee", slug: "long-sleeve-rib-tee", price: 4800, category: "t-shirts", blurb: "Ribbed cuffs that stay where you push them." },
    { title: "Washed Crew Tee", slug: "washed-crew-tee", price: 4400, category: "t-shirts", featured: true, blurb: "Garment-dyed, so it arrives looking like you have had it a year." },
    { title: "Brushed Back Hoodie", slug: "brushed-back-hoodie", price: 11500, category: "hoodies", featured: true, blurb: "Four hundred grams, brushed inside, with a hood that stands up on its own." },
    { title: "Zip Through Hoodie", slug: "zip-through-hoodie", price: 12800, category: "hoodies", blurb: "A tooth-by-tooth metal zip and a collar high enough to matter." },
    { title: "Cropped Crewneck", slug: "cropped-crewneck", price: 9600, sale: 7700, category: "hoodies", blurb: "Shorter in the body, wider through the chest." },
    { title: "Coach Jacket", slug: "coach-jacket", price: 16400, category: "outerwear", featured: true, blurb: "Snap front, flannel lined, cut to go over a hoodie without a fight." },
    { title: "Quilted Bomber", slug: "quilted-bomber", price: 21900, category: "outerwear", blurb: "Diamond quilting, ribbed hem, warm out of proportion to its weight." },
    { title: "Waxed Overshirt", slug: "waxed-overshirt", price: 18600, category: "outerwear", featured: true, blurb: "Waxed cotton that sheds a shower and takes a patina." },
    { title: "Wide Oxford Shirt", slug: "wide-oxford-shirt", price: 8900, category: "shirts", blurb: "Woven in a heavier yarn than an oxford usually is, and better for it." },
    { title: "Camp Collar Shirt", slug: "camp-collar-shirt", price: 7800, sale: 6200, category: "shirts", blurb: "An open collar and a straight hem — untucked is the only way it is worn." },
    { title: "Flannel Overshirt", slug: "flannel-overshirt", price: 10400, category: "shirts", blurb: "Brushed twice, so it is soft on the first wear rather than the tenth." },
    { title: "Carpenter Trouser", slug: "carpenter-trouser", price: 11200, category: "trousers", featured: true, blurb: "A hammer loop nobody uses and a leg wide enough to sit down in." },
    { title: "Pleated Wide Trouser", slug: "pleated-wide-trouser", price: 12600, category: "trousers", blurb: "Two forward pleats and a break at the shoe." },
    { title: "Tapered Cargo", slug: "tapered-cargo", price: 10800, sale: 8600, category: "trousers", blurb: "Pockets placed where they do not add width." },
    { title: "Court Sneaker", slug: "court-sneaker", price: 17500, category: "footwear", featured: true, blurb: "Leather over a vulcanised sole. Resoleable, which is the whole point." },
    { title: "Suede Runner", slug: "suede-runner", price: 19200, category: "footwear", blurb: "A low, plain runner in one colour of suede." },
    { title: "Six Panel Cap", slug: "six-panel-cap", price: 3200, category: "accessories", blurb: "Unstructured, cotton twill, a brass buckle at the back." },
    { title: "Ribbed Crew Socks", slug: "ribbed-crew-socks", price: 1400, category: "accessories", blurb: "Sold in threes because nobody buys one pair of socks." },
    { title: "Webbing Belt", slug: "webbing-belt", price: 2600, category: "accessories", blurb: "A belt that does not need holes." },
    { title: "Canvas Tote", slug: "canvas-tote", price: 3800, sale: 2900, category: "accessories", blurb: "Sixteen-ounce canvas with a flat bottom, so it stands up on its own." },
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
 * photographs, not placeholder scenery). Prices in dollars, as the file has
 * them. The home page's photographs and words are the theme's own section
 * defaults; this is the catalogue behind them.
 */
const loom: DemoCatalogue = {
  storeName: "Ecommerce",
  tagline: "Ecommerce is a free UI Kit from Paperpillar that you can use for your personal or commercial project.",
  announcement: { text: "Free shipping on every order over $200", background: "#121212" },
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
  currency: "USD",
  products: [
    { title: "Casual Shoe", slug: "casual-shoe", price: 225, category: "sneakers", featured: true, images: [SHOE.casual], colours: [NAVY, WHITE], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], blurb: "A clean leather upper on a cushioned sole — the pair that goes with everything." },
    { title: "Skateboard Shoe", slug: "skateboard-shoe-low", price: 125, category: "skateboard", featured: true, images: [SHOE.skateLow], colours: [GREEN, WHITE], sizes: ["US 8", "US 9", "US 10", "US 11", "US 12"], blurb: "Low-cut suede with a vulcanised sole that grips the board and lasts the session." },
    { title: "Skateboard Shoe High", slug: "skateboard-shoe-high", price: 125, category: "skateboard", featured: true, images: [SHOE.skateHigh], colours: [RED, WHITE], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11"], blurb: "The high-top: a padded collar for the ankle, a toe cap for the ollie, and the wing on the side." },
    { title: "Skateboard Shoe Stripe", slug: "skateboard-shoe-stripe", price: 125, sale: 99, category: "skateboard", images: [SHOE.skateStripe], colours: [GREEN, WHITE], sizes: ["US 7", "US 9", "US 10", "US 12"], blurb: "Canvas and suede with the side stripe, on the same board-gripping sole." },
    { title: "Basket Shoe", slug: "basket-shoe", price: 125, category: "sneakers", images: [SHOE.basket], colours: [RED, WHITE], sizes: ["US 8", "US 9", "US 10"], blurb: "A court classic: a supportive mid-cut and a sole made for quick turns." },
    { title: "Sportwear Shoe", slug: "sportwear-shoe", price: 159, category: "sneakers", featured: true, images: [SHOE.sport], colours: [RED, WHITE], sizes: ["US 7", "US 8", "US 9", "US 10", "US 11", "US 12"], blurb: "Light mesh and a springy midsole, for the run and the rest of the day." },
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
