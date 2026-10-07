import { money } from "@/components/loom/money";
import { LoomButton, LoomSwipeRow, px, type Placement } from "@/components/loom/primitives";
import { menu, str, type LoomContext } from "@/components/loom/contract";
import { LoomProductCard } from "@/components/loom/product-card";

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

/** The file's hand-set chip widths, for the kit's own five labels; any other label hugs. */
const CHIP_WIDTHS: Record<string, { w: number; mw: number }> = {
  Shorts: { w: 115, mw: 104 },
  Hat: { w: 93, mw: 78 },
  Jackets: { w: 122, mw: 109 },
  Shoes: { w: 105, mw: 95 },
  "T-Shirt": { w: 115, mw: 115 },
};


/**
 * The kit's grid rhythm, by position: desktop widths and which cards are
 * full width on the phone. Any products fill it in order.
 */
const SLOTS: { w: number; wideOnPhone?: boolean }[] = [
  { w: 322 },
  { w: 322 },
  { w: 654, wideOnPhone: true },
  { w: 654 },
  { w: 324 },
  { w: 322, wideOnPhone: true },
];

/**
 * The file's hand-made crops, for the kit's own six photographs in the slot
 * the file puts each in. Any other product, or one of these in another slot,
 * fills its card from the centre.
 */
const CROPS: Record<string, { slot: number; img: Placement; mImg: Placement }> = {
  [IMG.casual]: { slot: 0, img: { w: 408, h: 572, x: -60, y: -99 }, mImg: { w: 196.8, h: 272.66, x: -29.3, y: -47.19 } },
  [IMG.skate1]: { slot: 1, img: { w: 360, h: 450, x: -11 }, mImg: { w: 208.99, h: 197, x: -29.2 } },
  [IMG.skate2]: { slot: 2, img: { w: 654, h: 436, y: -42 }, mImg: { w: 343, h: 228.49, y: -22.01 } },
  [IMG.skate3]: { slot: 3, img: { w: 770, h: 513, x: -53, y: -112 }, mImg: { w: 167, h: 164 } },
  [IMG.basket]: { slot: 4, img: { w: 474, h: 593, x: -80, y: -119 }, mImg: { w: 219, h: 222, x: -29.5, y: -25 } },
  [IMG.sport]: { slot: 5, img: { w: 527, h: 421, x: -91, y: -19 }, mImg: { w: 356, h: 237, x: -4, y: -21 } },
};

export function LoomTrending({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const count = typeof data.count === "number" ? data.count : 6;
  const products = ctx.products.slice(0, count);
  const chips = menu(data, "chipsMenu", ctx);
  const active = str(data, "activeChip").toLowerCase();
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
            {str(data, "heading")}
          </h2>
          <LoomSwipeRow data-m="trending-chips" className="gap-[calc(8*var(--u))] md:gap-[calc(10*var(--u))]">
            {chips.map((c) => (
              <LoomButton
                key={c.id}
                href={c.href}
                variant={c.label.toLowerCase() === active ? "solid" : "outlineLight"}
                /* Width is set by the file for its own labels, not by the label. */
                className={CHIP_WIDTHS[c.label] ? "min-w-[var(--mw)] md:min-w-[var(--w)]" : "min-w-0"}
                style={CHIP_WIDTHS[c.label] ? px(CHIP_WIDTHS[c.label]) : undefined}
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
          {products.map((p, i) => {
            const slot = SLOTS[i % SLOTS.length];
            const crop = CROPS[p.src]?.slot === i ? CROPS[p.src] : undefined;
            return (
              <LoomProductCard
                key={p.id}
                id={p.id}
                title={p.title}
                price={money(p.price, ctx.currency)} amount={p.price}
                href={p.href}
                src={p.src}
                w={slot.w}
                wideOnPhone={slot.wideOnPhone}
                img={crop?.img}
                mImg={crop?.mImg}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
