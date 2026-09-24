/**
 * What each theme's demo shop sells.
 *
 * Two catalogues, not one shared one, and that is what the design file draws:
 * Loom demos a cosmetics brand and Kite demos streetwear. It is also the honest
 * arrangement — a photography-led theme with a tight grid and a roomy, text-led
 * one are not selling the same goods, and demoing both through the same forty
 * t-shirts would hide exactly the difference a merchant is trying to see.
 *
 * Data only, so `scripts/seed-theme-store.ts` stays readable and a third theme
 * is an entry here rather than a branch there.
 *
 * Photography is `picsum.photos` seeded by slug: deterministic, so the same
 * demo seeded twice is the same shop and a screenshot taken today still matches
 * next week. **Real photography is outstanding** — see docs/THEMES.md §5b.
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

/**
 * Loom: skincare, because Loom is the roomy, text-led theme.
 *
 * Large imagery, generous spacing and more words per page — which suits goods
 * that have to be explained rather than photographed. A serum sells on what is
 * in it; a jacket sells on what it looks like.
 */
const loom: DemoCatalogue = {
  storeName: "Loom Beauty",
  tagline: "Short ingredient lists, said plainly.",
  announcement: { text: "Two samples with every order · Free delivery over Rs 4,000", background: "#2f2a3d" },
  hero: {
    eyebrow: "The core range",
    headline: "Fewer things, better made.",
    subheading:
      "Eleven products. Every ingredient on the front of the bottle, at the percentage it is actually used.",
    cta: "Shop the range",
  },
  statement: "If it is on the label, it is in the bottle at a dose that does something.",
  story: {
    heading: "Why the range is small",
    body: "Most of what a shelf holds is the same four actives in different packaging. We make eleven products because that is how many we could formulate without repeating ourselves, and each one says what is in it and how much — on the front, not in six-point type around the back. Nothing is tested on animals, nothing is fragranced to cover a smell, and nothing is launched to fill a gap in a calendar.",
  },
  categories: [
    { name: "Cleansers", slug: "cleansers", description: "Two of them: one that foams and one that does not." },
    { name: "Serums", slug: "serums", description: "The actives, at the dose they were studied at." },
    { name: "Moisturisers", slug: "moisturisers", description: "Light, rich, and one for the eye area." },
    { name: "Sun care", slug: "sun-care", description: "SPF 50, every day, no white cast." },
    { name: "Lips", slug: "lips", description: "Balm and tint, in four colours between them." },
    { name: "Tools", slug: "tools", description: "The three things worth owning." },
  ],
  options: { name: "Size", values: ["30 ml", "50 ml", "100 ml"] },
  option2: {
    name: "Shade",
    values: [["Bare", "#e7c7b4"], ["Clay", "#c98b6f"], ["Plum", "#7d3f52"], ["Brick", "#a84b3a"]],
  },
  products: [
    { title: "Gentle Milk Cleanser", slug: "gentle-milk-cleanser", price: 3400, category: "cleansers", featured: true, blurb: "Removes the day without stripping anything. No foam, on purpose." },
    { title: "Clarifying Gel Wash", slug: "clarifying-gel-wash", price: 3100, sale: 2500, category: "cleansers", blurb: "A morning wash for skin that gets oily by noon." },
    { title: "Oil Cleansing Balm", slug: "oil-cleansing-balm", price: 4200, category: "cleansers", blurb: "Melts on contact, rinses without a film. The first step, not the only one." },
    { title: "Niacinamide 10% Serum", slug: "niacinamide-10-serum", price: 4800, category: "serums", featured: true, blurb: "Ten percent niacinamide with one percent zinc. For texture and oil." },
    { title: "Vitamin C 15% Serum", slug: "vitamin-c-15-serum", price: 6400, category: "serums", featured: true, blurb: "L-ascorbic acid at fifteen percent, in an opaque bottle because light ruins it." },
    { title: "Hyaluronic Layering Serum", slug: "hyaluronic-layering-serum", price: 4100, sale: 3300, category: "serums", blurb: "Three molecular weights, applied to damp skin or it does nothing." },
    { title: "Retinal 0.1% Night Serum", slug: "retinal-night-serum", price: 7200, category: "serums", blurb: "Retinaldehyde, which works faster than retinol and stings less. Start twice a week." },
    { title: "Everyday Light Moisturiser", slug: "everyday-light-moisturiser", price: 4600, category: "moisturisers", featured: true, blurb: "Gel-cream. Disappears under sunscreen instead of pilling under it." },
    { title: "Barrier Repair Cream", slug: "barrier-repair-cream", price: 5900, category: "moisturisers", blurb: "Ceramides and cholesterol in the ratio skin actually uses." },
    { title: "Eye Area Cream", slug: "eye-area-cream", price: 5200, sale: 4200, category: "moisturisers", blurb: "Thicker, fragrance-free, and safe to get in your lashes." },
    { title: "Invisible Fluid SPF 50", slug: "invisible-fluid-spf-50", price: 5400, category: "sun-care", featured: true, blurb: "Filters that do not leave a cast on any skin tone. Reapply at lunch." },
    { title: "Tinted Mineral SPF 30", slug: "tinted-mineral-spf-30", price: 4900, category: "sun-care", blurb: "Zinc with a hint of colour, for the days you wear nothing else." },
    { title: "Repair Lip Balm", slug: "repair-lip-balm", price: 1600, category: "lips", blurb: "Lanolin and shea. Nothing that tingles." },
    { title: "Sheer Lip Tint", slug: "sheer-lip-tint", price: 2400, sale: 1900, category: "lips", blurb: "Buildable colour that does not dry the lip out by three o'clock." },
    { title: "Jade Gua Sha", slug: "jade-gua-sha", price: 2800, category: "tools", blurb: "For five minutes in the evening, with oil, not dry." },
    { title: "Cotton Rounds, Washable", slug: "cotton-rounds-washable", price: 1800, category: "tools", blurb: "Twelve rounds and a wash bag. Replaces roughly a thousand disposables." },
    { title: "Facial Cleansing Cloth", slug: "facial-cleansing-cloth", price: 2200, category: "tools", featured: true, blurb: "Muslin on one side, terry on the other. Boil it weekly." },
  ],
};

/** Every demo catalogue, by the theme's URL slug. */
export const DEMO_CATALOGUES: Readonly<Record<string, DemoCatalogue>> = { kite, loom };
