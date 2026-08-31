import Image from "next/image";
import Link from "next/link";
import { formatPKR } from "@/lib/utils";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";
import {
  isEnquiryOnly,
  priceDisplay,
  PRODUCT_KIND_META,
  type ProductKind,
} from "@/lib/product-kind";
// Imported from the Prisma-free pricing module, not lib/data/products, so this
// component stays usable from the customizer's client-side live preview.
import { effectivePrice } from "@/lib/product-pricing";
import { GLOBAL_EDITS_DEFAULTS, isNewArrival, totalStock, type GlobalEdits } from "@/lib/global-edits";

export type ProductCardProduct = {
  slug: string;
  title: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  createdAt: Date | string;
  variants: { stock: number }[];
  kind?: string | null;
  bulkPricing?: string | null;
  bulkPriceMin?: number | null;
  bulkPriceMax?: number | null;
  bulkTiers?: unknown;
};

type ProductCardEdits = Pick<
  GlobalEdits,
  "saleBadge" | "newArrivalBadge" | "newArrivalBadgeText" | "newArrivalWindowDays" | "outOfStockDisplay"
>;

export function ProductCard({
  product,
  saleBadgeLabel = "Sale",
  edits,
}: {
  product: ProductCardProduct;
  saleBadgeLabel?: string;
  edits?: Partial<ProductCardEdits>;
}) {
  const e = { ...GLOBAL_EDITS_DEFAULTS, ...edits };
  const price = effectivePrice(product);
  const enquiryOnly = isEnquiryOnly(product.kind);
  const kindMeta = enquiryOnly ? PRODUCT_KIND_META[product.kind as ProductKind] : null;
  const display = priceDisplay(product);
  const onSale =
    !enquiryOnly && product.salePrice != null && product.salePrice < product.basePrice;
  // Stock is a standard-product idea. A made-to-order piece has no stock to run
  // out of, so it must never be dimmed or hidden as "sold out".
  const outOfStock = !enquiryOnly && totalStock(product.variants) <= 0;
  const isNew = e.newArrivalBadge && !onSale && isNewArrival(product.createdAt, e.newArrivalWindowDays);

  // HIDE mode is applied upstream (the pages filter the list before it ever reaches
  // ProductCard, so the grid doesn't leave a gap) — this is just the belt-and-braces case.
  if (outOfStock && e.outOfStockDisplay === "HIDE") return null;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-50">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // A product with no photo was a plain coloured rectangle, which reads
          // as a broken image rather than an empty slot. That is every card on
          // the day a shop opens.
          <ImagePlaceholder
            kind="product"
            variant={product.slug.length}
            className="absolute inset-0 h-full w-full"
          />
        )}
        {onSale && e.saleBadge && !kindMeta && (
          <span className="absolute left-3 top-3 rounded-full bg-rose px-2.5 py-1 text-xs font-medium text-white">
            {saleBadgeLabel}
          </span>
        )}
        {kindMeta && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {kindMeta.badge}
          </span>
        )}
        {isNew && !kindMeta && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-medium text-white">
            {e.newArrivalBadgeText}
          </span>
        )}
        {outOfStock && e.outOfStockDisplay === "SOLD_OUT" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink">Sold Out</span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-ink">{product.title}</h3>
        <div className="flex items-center gap-2 text-sm">
          {display.mode === "price" && (
            <>
              <span className="font-medium text-brand-600">{formatPKR(price)}</span>
              {onSale && (
                <span className="text-ink-soft line-through">{formatPKR(product.basePrice)}</span>
              )}
            </>
          )}
          {display.mode === "range" && (
            <span className="font-medium text-brand-600">
              {formatPKR(display.min)}, {formatPKR(display.max)}
            </span>
          )}
          {display.mode === "from" && (
            <span className="font-medium text-brand-600">From {formatPKR(display.unitPrice)}</span>
          )}
          {display.mode === "onRequest" && (
            <span className="font-medium text-ink-soft">{display.label}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
