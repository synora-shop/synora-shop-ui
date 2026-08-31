import { ProductCard, type ProductCardProduct } from "@/components/storefront/product-card";
import type { GlobalEdits } from "@/lib/global-edits";
import { cn } from "@/lib/utils";

// Literal class strings so Tailwind's scanner can see them.
const COLUMN_CLASS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  5: "sm:grid-cols-5",
};

/** Presentation only — see CategoryGridView for why this split exists. */
export function FeaturedProductsView({
  heading,
  limit = 8,
  columns = 4,
  products,
  saleBadgeLabel,
  edits,
}: {
  heading?: string;
  limit?: number;
  columns?: number;
  products: ProductCardProduct[];
  saleBadgeLabel: string;
  edits: Partial<GlobalEdits>;
}) {
  if (products.length === 0) return null;
  const shown = products.slice(0, limit);

  return (
    <>
      <h2 className="text-center font-serif text-3xl font-semibold">{heading || "Best Sellers"}</h2>
      <div className={cn("mt-10 grid grid-cols-2 gap-x-4 gap-y-10", COLUMN_CLASS[columns] ?? COLUMN_CLASS[4])}>
        {shown.map((p) => (
          <ProductCard key={p.slug} product={p} saleBadgeLabel={saleBadgeLabel} edits={edits} />
        ))}
      </div>
    </>
  );
}
