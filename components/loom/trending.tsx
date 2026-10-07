import { LoomButton, LoomSwipeRow, px } from "@/components/loom/primitives";
import { LoomProductCard, type LoomProduct } from "@/components/loom/product-card";

/**
 * Trending — a filter row and an asymmetric product grid.
 *
 * Desktop: 1320 wide inside the 60px gutter, on the section's own 1px top rule
 * with 32 above and below; title and chips share one 50px row.
 *
 * Phone: 343 inside a 16px gutter, 40 above and below, no rule (the hero's
 * closing hairline is the separator). The title sits over the chips, 16
 * apart, 32 above the grid, and the chips run off the right edge as a row to
 * swipe.
 *
 * Two things here are behaviour rather than decoration, and both are the
 * reason this section is not just a grid:
 *
 * **The chips are a menu.** SHORTS / HAT / JACKETS / SHOES / T-SHIRT is a
 * link list a merchant builds and the section points at — the same shape as
 * Shopify's `link_list` setting. Each width is set by hand in the file
 * (115, 93, 122, 105, 115 on desktop; 104, 78, 109, 95, 115 on the phone)
 * rather than hugging its label, so they are set here too.
 *
 * **The grid mixes spans.** Desktop rows are 1320 of 322-ish and 654 cards
 * with a 10px gutter, the wide card alternating sides. The phone is two
 * columns, 8 apart, with a full-width card after every pair. It is the same
 * six products in the same order at both sizes — what changes is which of
 * them is wide (the third and fourth on desktop, the third and sixth on the
 * phone) — so it is one list with a span per breakpoint, not two grids.
 */
const IMG = {
  casual: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png",
  skate1: "/loom/0b42775b5c482fd10ff96fad137ae5ca5aa7a561.png",
  skate2: "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png",
  skate3: "/loom/c8c225ce10fd34a19ed897401decf4c2dd4806d5.png",
  basket: "/loom/6202a986df950869c406241f2f48f416d0807241.png",
  sport: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png",
};

const CHIPS = [
  { label: "Shorts", w: 115, mw: 104 },
  { label: "Hat", w: 93, mw: 78 },
  { label: "Jackets", w: 122, mw: 109 },
  { label: "Shoes", w: 105, mw: 95, active: true },
  { label: "T-Shirt", w: 115, mw: 115 },
];


// The phone file names the last one "Spotwear Shoe" and prices the fourth at
// $225. A product has one name and one price, so the desktop's are used for
// both — those are typos in the kit, not a design.
const PRODUCTS: LoomProduct[] = [
  { id: "casual", title: "Casual Shoe", price: "$225", w: 322, src: IMG.casual, img: { w: 408, h: 572, x: -60, y: -99 }, mImg: { w: 196.8, h: 272.66, x: -29.3, y: -47.19 }, loved: true },
  { id: "skate-nb", title: "Skateboard Shoe", price: "$125", w: 322, src: IMG.skate1, img: { w: 360, h: 450, x: -11 }, mImg: { w: 208.99, h: 197, x: -29.2 } },
  { id: "skate-hi", title: "Skateboard Shoe", price: "$125", w: 654, wideOnPhone: true, href: "/loom/product", src: IMG.skate2, img: { w: 654, h: 436, y: -42 }, mImg: { w: 343, h: 228.49, y: -22.01 } },
  { id: "skate-stripe", title: "Skateboard Shoe", price: "$125", w: 654, src: IMG.skate3, img: { w: 770, h: 513, x: -53, y: -112 }, mImg: { w: 167, h: 164 } },
  { id: "basket", title: "Basket Shoe", price: "$125", w: 324, src: IMG.basket, img: { w: 474, h: 593, x: -80, y: -119 }, mImg: { w: 219, h: 222, x: -29.5, y: -25 } },
  { id: "sport", title: "Sportwear Shoe", price: "$159", w: 322, wideOnPhone: true, src: IMG.sport, img: { w: 527, h: 421, x: -91, y: -19 }, mImg: { w: 356, h: 237, x: -4, y: -21 } },
];

export function LoomTrending() {
  return (
    <section className="px-[calc(16*var(--u))] py-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:py-0">
      <div
        data-m="trending-inner"
        className="flex flex-col md:gap-[calc(24*var(--u))] md:py-[calc(32*var(--u))] md:shadow-[inset_0_1px_0_rgba(0,0,0,0.1)]"
      >
        <header
          data-m="trending-header"
          className="flex flex-col gap-[calc(16*var(--u))] pb-[calc(32*var(--u))] md:min-h-[calc(50*var(--u))] md:flex-row md:items-center md:justify-between md:pb-0"
        >
          <h2 data-m="trending-title" className="text-[calc(30*var(--u))] font-normal leading-[calc(38*var(--u))] tracking-[calc(-1*var(--u))] text-[#121212]">
            Trending
          </h2>
          <LoomSwipeRow data-m="trending-chips" className="gap-[calc(8*var(--u))] md:gap-[calc(10*var(--u))]">
            {CHIPS.map((c) => (
              <LoomButton
                key={c.label}
                variant={c.active ? "solid" : "outlineLight"}
                /* Width is set by the file, not by the label. */
                className="min-w-[var(--mw)] md:min-w-[var(--w)]"
                style={px({ w: c.w, mw: c.mw })}
              >
                {c.label}
              </LoomButton>
            ))}
          </LoomSwipeRow>
        </header>

        <div
          data-m="trending-grid"
          className="grid grid-cols-2 gap-x-[calc(8*var(--u))] gap-y-[calc(16*var(--u))] md:flex md:flex-wrap md:gap-x-[calc(10*var(--u))] md:gap-y-[calc(20*var(--u))]"
        >
          {PRODUCTS.map((p, i) => (
            <LoomProductCard key={`${p.title}-${i}`} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
