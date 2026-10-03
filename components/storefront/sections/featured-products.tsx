import { ProductCard, type ProductCardProduct } from "@/components/storefront/product-card";
import { StoreLink } from "@/components/storefront/store-link";
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
  links,
  products,
  saleBadgeLabel,
  currency,
  edits,
}: {
  heading?: string;
  limit?: number;
  columns?: number;
  /**
   * The chosen menu's items, drawn as a row of buttons beside the heading.
   *
   * Links, not filters — which is what they are. Each goes to the category
   * the merchant pointed it at, so the row is navigation rather than a
   * second, section-local idea of filtering that would have to be kept in
   * step with the real one on the shop page.
   */
  links?: { id: string; href: string; label: string }[];
  products: ProductCardProduct[];
  saleBadgeLabel: string;
  currency: string;
  edits: Partial<GlobalEdits>;
}) {
  if (products.length === 0) return null;
  const shown = products.slice(0, limit);

  const hasLinks = !!links && links.length > 0;

  return (
    <>
      {/* With a menu the heading moves left and the links sit opposite it, the
          way a section header reads when it has two things in it. Without one
          it stays centred, which is what every existing section does. */}
      <div
        className={cn(
          hasLinks
            ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            : undefined
        )}
      >
        <h2
          className={cn(
            "font-serif text-3xl font-semibold",
            hasLinks ? "text-left" : "text-center"
          )}
        >
          {heading || "Best Sellers"}
        </h2>

        {hasLinks && (
          // Scrolls rather than wraps: a shop with nine categories should not
          // push its own products down the page to show them all.
          <nav
            aria-label={`${heading || "Best Sellers"} categories`}
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
          >
            {links.map((link) => (
              <StoreLink
                key={link.id}
                href={link.href}
                className="shrink-0 rounded-pill border border-border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.08em] opacity-80 transition-colors hover:bg-ink hover:text-canvas hover:opacity-100"
              >
                {link.label}
              </StoreLink>
            ))}
          </nav>
        )}
      </div>
      <div className={cn("mt-10 grid grid-cols-2 gap-x-4 gap-y-10", COLUMN_CLASS[columns] ?? COLUMN_CLASS[4])}>
        {shown.map((p) => (
          <ProductCard
            key={p.slug}
            product={p}
            saleBadgeLabel={saleBadgeLabel}
            currency={currency}
            edits={edits}
          />
        ))}
      </div>
    </>
  );
}
