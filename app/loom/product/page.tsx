import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { LoomShell } from "@/components/loom/shell";
import { LOOM_RULE } from "@/components/loom/primitives";
import { LoomGallery } from "@/components/loom/product/gallery";
import { LoomBuyBox, type BuyBoxProduct } from "@/components/loom/product/buy-box";
import { LoomProductCard, type LoomProduct } from "@/components/loom/product-card";
import { T } from "@/components/loom/type";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";

export const metadata: Metadata = { title: "Skateboard Shoe — Loom reference build" };

/**
 * The product page — the first page the kit does not draw.
 *
 * Built only from the kit's own parts and numbers (see the comment on
 * LoomBuyBox for which part became which), so it reads as the same design
 * rather than a neighbour of it. Its grid is the blog row's: 654 of
 * photograph, 60, 606 of words. Under it, "You may also like" is the Trending
 * section's header and its own product card, four across at the narrow card's
 * 322 — which is exactly the 1318 the Trending section's first row spans.
 *
 * Like the blog, the last section before the footer carries the breathing
 * room: 120 under it on desktop.
 */
const SHOE = "/loom/7150a0e902536ab1a554d315fc11f4ef6f9c1302.png";

const PRODUCT: BuyBoxProduct = {
  eyebrow: "Shoes",
  title: "Skateboard Shoe",
  price: "$125",
  description:
    "A high-top made for the board and worn everywhere else. Full-grain leather that softens with every wear, a padded collar that holds the ankle, and a rubber sole that grips without getting in the way.",
  colours: [
    { label: "Red Pastel", color: "#e25f5f" },
    { label: "Clean White", color: "#ffffff" },
    { label: "Navy Blue", color: "#233c6b" },
  ],
  sizes: [{ label: "US 7" }, { label: "US 8" }, { label: "US 9" }, { label: "US 10" }, { label: "US 11" }, { label: "US 12", soldOut: true }],
  details: [
    {
      title: "Details",
      body: "Full-grain leather upper. Padded collar and tongue. Vulcanised rubber sole. Flat cotton laces, with a spare pair in the box.",
    },
    {
      title: "Shipping & Returns",
      body: "Ships in one to two working days, wrapped the way we would want to receive it. Not the right fit? Send it back within 30 days and we refund it in full.",
    },
  ],
};

const RELATED: LoomProduct[] = [
  { title: "Casual Shoe", price: "$225", w: 322, src: "/loom/5a88e5962507976b1988e6d9a08599fcba5247bd.png", loved: true },
  { title: "Skateboard Shoe", price: "$125", w: 322, src: "/loom/0b42775b5c482fd10ff96fad137ae5ca5aa7a561.png" },
  { title: "Basket Shoe", price: "$125", w: 322, src: "/loom/6202a986df950869c406241f2f48f416d0807241.png" },
  { title: "Sportwear Shoe", price: "$159", w: 322, src: "/loom/f8ae4065476b2a224ae85cd40fd6b1c7d34bc9ae.png" },
];

export default function LoomProductPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb
        trail={[
          { label: "Home", href: "/loom" },
          { label: "Shoes", href: "/loom/collection" },
        ]}
        current={PRODUCT.title}
      />

      <section
        data-m="pdp-main"
        className="flex flex-col gap-[calc(32*var(--u))] px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:flex-row md:items-start md:gap-[calc(60*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(60*var(--u))]"
      >
        <LoomGallery
          src={SHOE}
          views={[
            { at: "42% 50%", zoom: 1, alt: "Skateboard Shoe, both shoes" },
            { at: "22% 72%", zoom: 1.9, alt: "The sole" },
            { at: "50% 33%", zoom: 2.2, alt: "The collar and wing logo" },
            { at: "78% 74%", zoom: 2.1, alt: "The toe" },
          ]}
        />
        <LoomBuyBox product={PRODUCT} />
      </section>

      <section className="px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
        <div className={cn("flex flex-col gap-[calc(16*var(--u))] pt-[calc(32*var(--u))] md:gap-[calc(24*var(--u))]", LOOM_RULE)}>
          <h2 className={cn(T.h4, "text-[#121212]")}>You may also like</h2>
          <div
            data-m="pdp-related"
            className="grid grid-cols-2 gap-x-[calc(8*var(--u))] gap-y-[calc(16*var(--u))] md:flex md:gap-[calc(10*var(--u))]"
          >
            {RELATED.map((p, i) => (
              <LoomProductCard key={`${p.title}-${i}`} {...p} />
            ))}
          </div>
        </div>
      </section>
    </LoomShell>
  );
}
