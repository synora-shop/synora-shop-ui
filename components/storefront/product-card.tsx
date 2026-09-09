import Image from "next/image";
import Link from "next/link";

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
import { formatMoney } from "@/lib/money";
import { CARD_ASPECT, THEME_LAYOUT_DEFAULTS, type CardLayout } from "@/lib/theme-layout";
import { QuickAdd } from "@/components/storefront/quick-add";
import { cn } from "@/lib/utils";

export type ProductCardProduct = {
  /** Needed to add to the basket without opening the product. */
  id?: string;
  slug: string;
  title: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  createdAt: Date | string;
  /**
   * Widened from `{ stock }` alone. Nothing new is fetched — every query that
   * feeds a card already includes whole variants — but the card could not see
   * the colours it was being asked to show, nor the id it needed to add one.
   */
  variants: {
    id?: string;
    size?: string;
    color?: string;
    stock: number;
    priceOverride?: number | null;
  }[];
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
  currency,
  product,
  saleBadgeLabel = "Sale",
  edits,
  layout,
  features,
}: {
  /** The store's own currency code. Passed in rather than looked up: a page
   *  renders thirty of these and already knows it. */
  currency: string;
  product: ProductCardProduct;
  saleBadgeLabel?: string;
  edits?: Partial<ProductCardEdits>;
  /** Which shape this theme wants. Defaults to what the storefront always did. */
  layout?: CardLayout;
  /** Behaviour the theme has switched on. Everything off is the original card. */
  features?: { hoverSwapImage?: boolean; quickAdd?: boolean; swatchesOnCard?: boolean };
}) {
  const money = (n: number) => formatMoney(n, currency);
  const shape = layout ?? THEME_LAYOUT_DEFAULTS.productCard;
  const f = features ?? {};
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

  /**
   * The colours this product comes in.
   *
   * Deduplicated and capped. A card is a thumbnail, not a variant picker: five
   * dots say "there are choices", and twenty say nothing at all while wrecking
   * the row they sit in.
   */
  const swatches = f.swatchesOnCard
    ? [...new Set(product.variants.map((v) => v.color).filter((c): c is string => !!c?.trim()))].slice(0, 5)
    : [];

  /**
   * The one variant quick-add is allowed to touch.
   *
   * Exactly one, in stock, with an id. A product with a choice to make goes to
   * its own page — see components/storefront/quick-add.tsx for why guessing a
   * size is worse than an extra click.
   */
  const soleVariant =
    f.quickAdd && !enquiryOnly && product.id && product.variants.length === 1 && product.variants[0].id && product.variants[0].stock > 0
      ? product.variants[0]
      : null;

  /** The photo shown on hover. Never the first one, or nothing appears to happen. */
  const hoverImage = f.hoverSwapImage && product.images[1] ? product.images[1] : null;

  // HIDE mode is applied upstream (the pages filter the list before it ever reaches
  // ProductCard, so the grid doesn't leave a gap) — this is just the belt-and-braces case.
  if (outOfStock && e.outOfStockDisplay === "HIDE") return null;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className={cn("relative overflow-hidden rounded-lg bg-brand-50", CARD_ASPECT[shape])}>
        {product.images[0] ? (
          <>
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className={cn(
                "object-cover transition-transform duration-300 group-hover:scale-105",
                // With a second photo the first fades out instead of zooming:
                // two images doing different things at once reads as a glitch.
                hoverImage && "transition-opacity group-hover:scale-100 group-hover:opacity-0"
              )}
            />
            {/* The swap is pure CSS. No JavaScript, no state, and on a phone —
                where there is no hover — the second image simply never shows,
                which is the correct behaviour rather than a fallback. */}
            {hoverImage && (
              <Image
                src={hoverImage}
                alt=""
                aria-hidden
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
            )}
          </>
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
        {/* Slides up on hover, and is always present on a touch screen, where
            there is no hover to reveal it with. */}
        {soleVariant && !outOfStock && (
          <div className="absolute inset-x-2 bottom-2 opacity-100 transition-all duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
            <QuickAdd
              product={{
                id: product.id!,
                slug: product.slug,
                title: product.title,
                image: product.images[0] ?? "",
              }}
              variant={{
                id: soleVariant.id!,
                size: soleVariant.size ?? "",
                color: soleVariant.color ?? "",
                stock: soleVariant.stock,
              }}
              price={soleVariant.priceOverride ?? price}
            />
          </div>
        )}
      </div>
      <div
        className={cn(
          "space-y-1",
          shape === "compact" ? "mt-2" : "mt-3",
          shape === "editorial" && "text-center"
        )}
      >
        {swatches.length > 0 && (
          <div
            className={cn(
              "flex items-center gap-1.5 pb-0.5",
              shape === "editorial" && "justify-center"
            )}
            aria-label={`Available in ${swatches.length} colours`}
          >
            {swatches.map((c) => (
              <span
                key={c}
                title={c}
                className="h-3 w-3 rounded-full border border-border"
                // The colour name straight from the variant. A name the browser
                // does not know renders as nothing, which is a plain circle —
                // wrong, but not broken, and better than dropping the row.
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
        <h3
          className={cn(
            "font-medium text-ink",
            shape === "editorial" && "text-xs uppercase tracking-[0.14em]",
            shape === "compact" ? "text-[13px] leading-snug" : "text-sm"
          )}
        >
          {product.title}
        </h3>
        <div
          className={cn(
            "flex items-center gap-2",
            shape === "editorial" && "justify-center",
            shape === "compact" ? "text-[13px]" : "text-sm"
          )}
        >
          {display.mode === "price" && (
            <>
              <span className="font-medium text-brand-600">{money(price)}</span>
              {onSale && (
                <span className="text-ink-soft line-through">{money(product.basePrice)}</span>
              )}
            </>
          )}
          {display.mode === "range" && (
            <span className="font-medium text-brand-600">
              {money(display.min)}, {money(display.max)}
            </span>
          )}
          {display.mode === "from" && (
            <span className="font-medium text-brand-600">From {money(display.unitPrice)}</span>
          )}
          {display.mode === "onRequest" && (
            <span className="font-medium text-ink-soft">{display.label}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
