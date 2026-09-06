import Link from "next/link";
import {
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  type SearchParams,
  perPageHref,
  readPerPage,
} from "@/lib/paging";
import { cn } from "@/lib/utils";

/**
 * How many rows fit on one page.
 *
 * Links rather than a <select>, so it works with JavaScript still loading and
 * so each choice is a real address a merchant can bookmark. "All" is one of the
 * choices, and choosing it takes the pagination bar off the screen — which is
 * the point of offering it.
 */
export function PerPageSelect({
  basePath,
  searchParams,
  total,
}: {
  basePath: string;
  searchParams: SearchParams;
  /** Below one page's worth there is nothing to choose between. */
  total: number;
}) {
  const current = readPerPage(searchParams);
  if (total <= DEFAULT_PER_PAGE) return null;

  return (
    <div className="flex items-center gap-1 rounded-pill border border-control-line bg-control px-1 py-1">
      <span className="px-2 text-xs text-control-soft">Show</span>
      {PER_PAGE_OPTIONS.map((option) => {
        const active = option === current;
        return (
          <Link
            key={option ?? "all"}
            href={perPageHref(basePath, searchParams, option)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-pill px-2.5 py-1 text-xs transition-colors",
              active ? "bg-brand-500 font-medium text-white" : "text-control-ink hover:bg-panel"
            )}
          >
            {option ?? "All"}
          </Link>
        );
      })}
    </div>
  );
}
