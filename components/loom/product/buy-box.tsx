"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton, LoomSwipeRow } from "@/components/loom/primitives";
import { LoomChevronDown, LoomHeartFill, LoomHeartOutline } from "@/components/loom/icons";
import { LoomPromises, LoomStepper } from "@/components/loom/commerce";
import { T } from "@/components/loom/type";
import { on, str, type LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";
import { useWishlist } from "@/components/loom/wishlist";

export type BuyBoxProduct = {
  /** The catalogue id — what the heart saves. */
  id: string;
  eyebrow: string;
  title: string;
  price: string;
  description: string;
  colours: { label: string; color: string }[];
  sizes: { label: string; soldOut?: boolean }[];
  details: { title: string; body: string }[];
};

/**
 * Everything to the right of the photographs. Not in the kit — built only
 * from what it has, so nothing here is a new kind of thing:
 *
 *   eyebrow     Single text 2, uppercase, at 80% — the button label style
 *   name        Heading 2 on desktop, Heading 3 on the phone — the sizes the
 *               kit sets its section statements in
 *   price       Heading 4 (Reguler), ink — the price is the second thing read
 *   copy        Body 4 / Body 6 at 80%, exactly like the blog's
 *   colour      the kit's own colour chip; chosen fills with ink, the way the
 *               chosen Trending chip does
 *   size        the Trending chips themselves
 *   quantity    a pill outlined #dddddd, the chips' own outline
 *   heart       the card's favourite button, at 50 to sit beside the name
 *   promises    the Service section's three glyphs and its three promises,
 *               said in a line each
 *   details     rows on the section rule, opened with the kit's chevron
 *
 * Desktop it is a 606 column, 60 from the photographs — the blog's split.
 * The phone stacks it under them in the 16px gutter.
 */
export function LoomBuyBox({ product, data, ctx }: { product: BuyBoxProduct; data: Record<string, unknown>; ctx: LoomContext }) {
  const wishlist = useWishlist();
  const [colour, setColour] = useState(0);
  const [size, setSize] = useState(product.sizes.findIndex((s) => !s.soldOut));
  const [qty, setQty] = useState(1);
  const loved = wishlist.has(product.id);

  return (
    <div data-m="pdp-buy" className="flex flex-col gap-[calc(32*var(--u))] md:w-[calc(606*var(--u))] md:shrink-0">
      {/* Name, price, copy */}
      <div className="flex flex-col gap-[calc(16*var(--u))] md:gap-[calc(24*var(--u))]">
        <div className="flex items-start justify-between gap-[calc(16*var(--u))]">
          <div className="flex flex-col gap-[calc(8*var(--u))]">
            {on(data, "showEyebrow") && <p className={cn(T.single2, "uppercase text-[#121212]/80")}>{product.eyebrow}</p>}
            <h1 data-m="pdp-title" className={cn(T.h3, "text-[#121212] md:text-[calc(60*var(--u))] md:leading-[calc(65*var(--u))]")}>
              {product.title}
            </h1>
          </div>
          <button
            type="button"
            aria-pressed={loved}
            aria-label={tx(ctx, loved ? "product.removeFromWishlist" : "product.addToWishlist")}
            onClick={() => wishlist.toggle(product.id)}
            className={cn(
              "mt-[calc(4*var(--u))] flex h-[max(calc(50*var(--u)),40px)] w-[max(calc(50*var(--u)),40px)] shrink-0 items-center justify-center rounded-full",
              loved ? "bg-[#f15353] text-white" : "border border-[#dddddd] text-[#121212]"
            )}
          >
            {loved ? (
              <LoomHeartFill className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)]" />
            ) : (
              <LoomHeartOutline className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)]" />
            )}
          </button>
        </div>
        <p data-m="pdp-price" className={cn(T.h4, "text-[#121212]")}>
          {product.price}
        </p>
        <p className={cn(T.body6, "text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)] md:w-[calc(566*var(--u))]")}>
          {product.description}
        </p>
      </div>

      {/* Options */}
      <div className={cn("flex flex-col gap-[calc(24*var(--u))] pt-[calc(32*var(--u))]", LOOM_RULE)}>
        <Option label={tx(ctx, "product.colourLabel")} value={product.colours[colour].label}>
          {/* A row to swipe on the phone, like the Trending chips: three of
              these do not fit 343 across, and wrapped they stood one per line. */}
          <LoomSwipeRow className="gap-[calc(6*var(--u))] md:flex-wrap md:gap-[calc(10*var(--u))]">
            {product.colours.map((c, i) => (
              <button
                key={c.label}
                type="button"
                aria-pressed={i === colour}
                onClick={() => setColour(i)}
                className={cn(
                  "flex h-[max(calc(48*var(--u)),40px)] shrink-0 items-center gap-[calc(12*var(--u))] rounded-[200px] border border-[#121212] pl-[calc(12*var(--u))] pr-[calc(20*var(--u))] md:h-[max(calc(57*var(--u)),40px)]",
                  i === colour ? "bg-[#121212] text-white" : "text-[#121212]"
                )}
              >
                <span
                  className="h-[calc(33*var(--u))] w-[calc(33*var(--u))] shrink-0 rounded-full"
                  style={{
                    backgroundColor: c.color,
                    // Clean White keeps the file's #dedede ring; on the ink
                    // fill of a chosen chip every swatch gets a white one.
                    boxShadow: i === colour ? "0 0 0 1px #ffffff" : c.color === "#ffffff" ? "inset 0 0 0 1px #dedede" : undefined,
                  }}
                />
                <span className="whitespace-nowrap text-[max(calc(14*var(--u)),11.2px)] font-semibold uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))] md:text-[max(calc(16*var(--u)),12.8px)]">
                  {c.label}
                </span>
              </button>
            ))}
          </LoomSwipeRow>
        </Option>

        <Option label={tx(ctx, "product.sizeLabel")} value={product.sizes[size]?.label ?? ""}>
          <div className="flex flex-wrap gap-[calc(8*var(--u))] md:gap-[calc(10*var(--u))]">
            {product.sizes.map((s, i) => (
              <LoomButton
                key={s.label}
                variant={i === size ? "solid" : "outlineLight"}
                className={cn("min-w-[calc(80*var(--u))]", s.soldOut && "text-[#121212]/30 line-through")}
                disabled={s.soldOut}
                onClick={() => setSize(i)}
                aria-pressed={i === size}
                aria-label={s.soldOut ? tx(ctx, "product.soldOut", { size: s.label }) : s.label}
              >
                {s.label}
              </LoomButton>
            ))}
          </div>
        </Option>
      </div>

      {/* Quantity and the one primary action */}
      <div className="flex gap-[calc(10*var(--u))]">
        <LoomStepper ctx={ctx} value={qty} onChange={setQty} />
        <LoomButton data-m="pdp-add" className="min-w-0 flex-1">
          {tx(ctx, "product.addToCart")}
        </LoomButton>
      </div>

      {on(data, "showPromises") && <LoomPromises ctx={ctx} />}

      {/* Details, on the section rule */}
      <div>
        {[
          ...product.details,
          ...(str(data, "shippingHeading") ? [{ title: str(data, "shippingHeading"), body: str(data, "shippingText") }] : []),
        ].map((d, i) => (
          <details key={d.title} open={i === 0} className={cn("group", LOOM_RULE)}>
            <summary
              className={cn(
                T.body3,
                "flex cursor-pointer list-none items-center justify-between py-[calc(20*var(--u))] text-[#121212] [&::-webkit-details-marker]:hidden"
              )}
            >
              {d.title}
              <LoomChevronDown className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)] transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className={cn(T.body6, "pb-[calc(24*var(--u))] text-[#121212]/80")}>{d.body}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

function Option({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-[calc(12*var(--u))]">
      <legend className={cn(T.single2, "mb-[calc(12*var(--u))] uppercase text-[#121212]/80")}>
        {label} <span className="text-[#121212]">— {value}</span>
      </legend>
      {children}
    </fieldset>
  );
}
