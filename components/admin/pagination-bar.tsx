import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  type SearchParams,
  pageHref,
  pageWindow,
  readPaging,
  totalPages,
} from "@/lib/paging";
import { cn } from "@/lib/utils";

/**
 * The pages of a long list.
 *
 * Drawn only when there is more than one page to reach — which means it
 * disappears entirely when the merchant chooses "show all", and never appears
 * on a list of nine products. That is the documented behaviour and it is also
 * the honest one: a bar offering page 1 of 1 is a control that does nothing.
 *
 * Server-rendered links, like the filters. A page of a list should survive a
 * reload, a bookmark and the back button.
 */
export function PaginationBar({
  basePath,
  searchParams,
  total,
}: {
  basePath: string;
  searchParams: SearchParams;
  /** How many rows there are in all, after filtering. */
  total: number;
}) {
  const { page, perPage } = readPaging(searchParams, total);
  if (perPage === null) return null;
  const pages = totalPages(total, perPage);
  if (pages <= 1) return null;

  return (
    <nav
      aria-label="Pages"
      className="inline-flex items-center gap-1.5 rounded-pill bg-panel p-2 shadow-panel"
    >
      <Step
        href={pageHref(basePath, searchParams, page - 1)}
        disabled={page === 1}
        label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Step>

      {pageWindow(page, pages).map((n, i) =>
        n === 0 ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-control-soft" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={n}
            href={pageHref(basePath, searchParams, n)}
            aria-current={n === page ? "page" : undefined}
            aria-label={`Page ${n}`}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-pill px-3 text-sm transition-colors",
              n === page
                ? "bg-brand-500 font-medium text-white"
                : "border border-control-line bg-control text-control-ink hover:text-ink"
            )}
          >
            {n}
          </Link>
        )
      )}

      <Step
        href={pageHref(basePath, searchParams, page + 1)}
        disabled={page === pages}
        label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Step>
    </nav>
  );
}

/**
 * Previous and next.
 *
 * At either end this is a span, not a link. A disabled anchor is still
 * clickable and still focusable, so "previous" on page one would quietly
 * reload the page a merchant is already looking at.
 */
function Step({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const shape = "flex h-9 w-9 items-center justify-center rounded-pill transition-colors";
  if (disabled) {
    return (
      <span
        aria-hidden
        className={cn(shape, "cursor-not-allowed bg-panel text-control-soft opacity-50")}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(shape, "border border-control-line bg-control text-control-ink hover:text-ink")}
    >
      {children}
    </Link>
  );
}
