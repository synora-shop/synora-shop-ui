"use client";

import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton } from "@/components/loom/primitives";
import { LoomProductCard } from "@/components/loom/product-card";
import { useWishlist } from "@/components/loom/wishlist";
import { fill, on, str, type LoomContext } from "@/components/loom/contract";
import { T } from "@/components/loom/type";
import { LoomPageHeading, PAGE_SECTION } from "@/components/loom/sections/page-heading";

/**
 * The wishlist — not in the kit. The page is the hearts made into a list: the
 * kit's own product card, on the 322 module four across (two on the phone),
 * the heart on each filled and pressing it takes the product off the list
 * there and then. Under each card, Add to cart in the Trending chip's outline —
 * the quiet button, because the page's job is remembering, not selling.
 *
 * Empty, it says so in Heading 4 and offers the way back, as the cart does.
 */
export function LoomWishlist({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const list = useWishlist();
  const saved = list.ids.map((id) => ctx.products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <section className={PAGE_SECTION}>
      <LoomPageHeading
        m="wishlist-title"
        title={
          <>
            {str(data, "heading")}
            {on(data, "showCount") && saved.length > 0 && (
              <span data-m="wishlist-count" className={cn(T.body6, "ml-[calc(16*var(--u))] align-middle text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")}>
                {fill(str(data, "countLabel"), { count: saved.length })}
              </span>
            )}
          </>
        }
        aside={str(data, "text") || undefined}
      />

      <div className={cn("pt-[calc(24*var(--u))] md:pt-[calc(32*var(--u))]", LOOM_RULE)}>
        {saved.length === 0 ? (
          <div className="flex flex-col items-start gap-[calc(16*var(--u))] py-[calc(24*var(--u))]">
            <p className={cn(T.h4, "text-[#121212]")}>{str(data, "emptyHeading")}</p>
            <p className={cn(T.body6, "text-[#121212]/80")}>{str(data, "emptyText")}</p>
            <LoomButton variant="outline" href={str(data, "emptyButtonLink")} className="mt-[calc(8*var(--u))]">
              {str(data, "emptyButtonLabel")}
            </LoomButton>
          </div>
        ) : (
          <ul
            data-m="wishlist-grid"
            className="grid grid-cols-2 gap-x-[calc(8*var(--u))] gap-y-[calc(24*var(--u))] md:grid-cols-4 md:gap-x-[calc(10*var(--u))] md:gap-y-[calc(32*var(--u))]"
          >
            {saved.map((p) => (
              <li key={p.id} className="flex flex-col gap-[calc(12*var(--u))]">
                <LoomProductCard id={p.id} title={p.title} price={`$${p.price}`} w={322.5} src={p.src} href={p.href} />
                {on(data, "showAddToCart") && (
                  <LoomButton variant="outlineLight" href="/loom/cart" className="relative z-[1] w-full min-w-0">
                    {str(data, "addToCartLabel")}
                  </LoomButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
