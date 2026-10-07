import { money } from "@/components/loom/money";
import { cn } from "@/lib/utils";
import { LOOM_RULE } from "@/components/loom/primitives";
import { LoomProductCard } from "@/components/loom/product-card";
import type { LoomContext } from "@/components/loom/contract";
import { str } from "@/components/loom/contract";
import { T } from "@/components/loom/type";

/**
 * A row of products under the section rule — the Trending section's header and
 * the kit's card, at the narrow card's 322, four across (two on the phone).
 * The product page's "You may also like" and the empty search's "Trending now"
 * are both this, with a different heading.
 */
export function LoomRecommendations({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const count = typeof data.count === "number" ? data.count : 4;
  // Never recommend the product the page is about.
  const products = ctx.products.filter((p) => p.id !== ctx.product?.id).slice(0, count);
  return (
    <section className="px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
      <div className={cn("flex flex-col gap-[calc(16*var(--u))] pt-[calc(32*var(--u))] md:gap-[calc(24*var(--u))]", LOOM_RULE)}>
        <h2 className={cn(T.h4, "text-[#121212]")}>{str(data, "heading")}</h2>
        <div className="grid grid-cols-2 gap-x-[calc(8*var(--u))] gap-y-[calc(16*var(--u))] md:grid-cols-4 md:gap-x-[calc(10*var(--u))]">
          {products.map((p) => (
            <LoomProductCard key={p.id} id={p.id} title={p.title} price={money(p.price, ctx.currency)} amount={p.price} w={322.5} src={p.src} href={p.href} />
          ))}
        </div>
      </div>
    </section>
  );
}
