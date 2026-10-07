import { LoomGallery } from "@/components/loom/product/gallery";
import { LoomBuyBox, type BuyBoxProduct } from "@/components/loom/product/buy-box";
import { on, type LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";

/** A product as its page shows it — the platform's KitProductPage. */
export type LoomProductPage = BuyBoxProduct;

/**
 * The product page's main section — Shopify's "main product". The photographs
 * on the left and the panel on the right (LoomBuyBox has the design); what the
 * product says comes from the product, the shared words from Site text, and
 * this section's own settings decide what shows.
 */
export function LoomProductMain({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const p = ctx.product;
  if (!p) return null;
  return (
    <section
      data-m="pdp-main"
      className="flex flex-col gap-[calc(32*var(--u))] px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:flex-row md:items-start md:gap-[calc(60*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(60*var(--u))]"
    >
      <LoomGallery views={p.photos} label={tx(ctx, "product.photographs")} thumbnails={on(data, "showThumbnails")} />
      <LoomBuyBox product={p} data={data} ctx={ctx} />
    </section>
  );
}
