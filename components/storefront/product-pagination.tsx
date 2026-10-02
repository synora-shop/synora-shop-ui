import { StoreLink } from "@/components/storefront/store-link";
import { pageHref, pageWindow, totalPages, type SearchParams } from "@/lib/paging";
import { cn } from "@/lib/utils";

/**
 * Pages of a storefront product listing.
 *
 * The admin's bar (components/admin/pagination-bar.tsx) wears the panel's
 * colours and offers a rows-per-page control, and neither belongs on a
 * customer's shop page: a storefront must look like the merchant's shop, not
 * like this product's admin, and a shopper choosing "100 per page" is a
 * setting nobody wants. The arithmetic is shared — `lib/paging.ts` is pure and
 * already decides which numbers to draw — and only the markup differs.
 *
 * Every link goes through StoreLink, so a theme-store demo keeps its
 * `/theme-store/<theme>` prefix. A bare href would walk a visitor out of the
 * demo and into a shop that is not the one they were looking at.
 */
export function ProductPagination({
  basePath,
  searchParams,
  total,
  perPage,
}: {
  basePath: string;
  searchParams: SearchParams;
  /** Matching the filters, before paging. */
  total: number;
  perPage: number;
}) {
  const pages = totalPages(total, perPage);
  // One page is no pages. Drawing a disabled bar under every short catalogue
  // tells a customer about machinery they have no use for.
  if (pages <= 1) return null;

  const raw = searchParams.page;
  const current = Math.min(
    Math.max(1, Number(Array.isArray(raw) ? raw[0] : raw) || 1),
    pages
  );

  const item =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-pill px-3 text-sm transition-colors";

  return (
    <nav aria-label="Pages of products" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {current > 1 && (
        <StoreLink href={pageHref(basePath, searchParams, current - 1)} rel="prev" className={cn(item, "border border-border hover:bg-subtle")}>
          Previous
        </StoreLink>
      )}

      {pageWindow(current, pages).map((p, i) =>
        p === 0 ? (
          // A gap, not a button. Marked hidden from a screen reader because
          // "…" read aloud between two page numbers is noise.
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-ink-faint">
            &hellip;
          </span>
        ) : (
          <StoreLink
            key={p}
            href={pageHref(basePath, searchParams, p)}
            aria-current={p === current ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(
              item,
              p === current
                ? "bg-ink font-medium text-canvas"
                : "border border-border hover:bg-subtle"
            )}
          >
            {p}
          </StoreLink>
        )
      )}

      {current < pages && (
        <StoreLink href={pageHref(basePath, searchParams, current + 1)} rel="next" className={cn(item, "border border-border hover:bg-subtle")}>
          Next
        </StoreLink>
      )}
    </nav>
  );
}
