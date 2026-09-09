import Link from "next/link";
import { ProductCard, type ProductCardProduct } from "@/components/storefront/product-card";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";
import type { GlobalEdits } from "@/lib/global-edits";
import type { CardLayout } from "@/lib/theme-layout";
import type { CategoryTile } from "./category-grid";

/**
 * One category given the whole width: its photo, a few words, its products.
 *
 * The heading falls back to the category's own name rather than to nothing, so
 * a merchant who picks a category and writes no copy still gets a finished
 * section. Copy they do write wins, because they wrote it for this page.
 */
export function CollectionShowcase({
  collection,
  categories,
  heading,
  body,
  products,
  limit = 4,
  imagePosition = "left",
  currency,
  saleBadgeLabel,
  edits,
  cardLayout,
  features,
}: {
  collection?: string;
  categories: CategoryTile[];
  heading?: string;
  body?: string;
  products: ProductCardProduct[];
  limit?: number;
  imagePosition?: string;
  currency: string;
  saleBadgeLabel?: string;
  edits?: Partial<GlobalEdits>;
  cardLayout?: CardLayout;
  features?: { hoverSwapImage?: boolean; quickAdd?: boolean; swatchesOnCard?: boolean };
}) {
  const category =
    categories.find((c) => c.slug === collection || c.id === collection) ?? categories[0];
  if (!category) return null;

  const shown = products.slice(0, Math.max(2, limit ?? 4));
  const title = heading?.trim() || category.name;

  const photo = (
    <Link href={`/collections/${category.slug}`} className="block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-subtle">
        {category.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- merchant URL of unknown size
          <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
        ) : (
          <ImagePlaceholder kind="collection" variant={category.slug.length} className="absolute inset-0 h-full w-full" />
        )}
      </div>
    </Link>
  );

  return (
    <div className="grid items-start gap-8 lg:grid-cols-5">
      <div className={`lg:col-span-2 ${imagePosition === "right" ? "lg:order-2" : ""}`}>{photo}</div>
      <div className="lg:col-span-3">
        <h2 className="font-serif text-3xl font-semibold">{title}</h2>
        {body && <p className="mt-2 max-w-prose whitespace-pre-line text-ink-soft">{body}</p>}
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
          {shown.map((product) => (
            <ProductCard
              key={product.slug}
              currency={currency}
              product={product}
              saleBadgeLabel={saleBadgeLabel}
              edits={edits}
              layout={cardLayout}
              features={features}
            />
          ))}
        </div>
        <Link
          href={`/collections/${category.slug}`}
          className="mt-6 inline-block text-sm font-medium text-brand-600 underline-scribble"
        >
          See all {category.name}
        </Link>
      </div>
    </div>
  );
}
