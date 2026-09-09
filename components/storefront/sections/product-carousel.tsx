import Link from "next/link";
import { ProductCard, type ProductCardProduct } from "@/components/storefront/product-card";
import type { GlobalEdits } from "@/lib/global-edits";
import type { CardLayout } from "@/lib/theme-layout";

const CARD_WIDTH: Record<string, string> = {
  small: "w-40 sm:w-48",
  medium: "w-52 sm:w-64",
  large: "w-64 sm:w-80",
};

/**
 * Products in one row that scrolls sideways.
 *
 * A grid of twelve products makes a page three screens longer; a row of twelve
 * makes it one screen and lets the rest of the page keep its shape. That is the
 * whole reason this exists beside the grid.
 *
 * Native overflow scrolling with snap points rather than arrow buttons and a
 * transform: it works with a trackpad, a touch screen, a scrollbar and the
 * keyboard on the day it ships, and none of that has to be written.
 */
export function ProductCarousel({
  heading,
  products,
  limit = 8,
  cardWidth = "medium",
  ctaLabel,
  ctaHref,
  currency,
  saleBadgeLabel,
  edits,
  cardLayout,
  features,
}: {
  heading?: string;
  products: ProductCardProduct[];
  limit?: number;
  cardWidth?: string;
  ctaLabel?: string;
  ctaHref?: string;
  currency: string;
  saleBadgeLabel?: string;
  edits?: Partial<GlobalEdits>;
  cardLayout?: CardLayout;
  features?: { hoverSwapImage?: boolean; quickAdd?: boolean; swatchesOnCard?: boolean };
}) {
  const shown = products.slice(0, Math.max(1, limit ?? 8));
  if (shown.length === 0) return null;

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4">
        {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}
        {ctaLabel && ctaHref && (
          <Link href={ctaHref} className="shrink-0 text-sm font-medium text-brand-600 underline-scribble">
            {ctaLabel}
          </Link>
        )}
      </div>

      {/* The negative margin and matching padding let the row bleed to the
          screen edge on a phone, so the last card is visibly cut off rather
          than sitting flush — which is what tells somebody it scrolls. */}
      <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        <div className="flex snap-x snap-mandatory gap-4">
          {shown.map((product) => (
            <div key={product.slug} className={`shrink-0 snap-start ${CARD_WIDTH[cardWidth] ?? CARD_WIDTH.medium}`}>
              <ProductCard
                currency={currency}
                product={product}
                saleBadgeLabel={saleBadgeLabel}
                edits={edits}
                layout={cardLayout}
                features={features}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
