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
    <div className="flex h-9 items-center gap-0.5 rounded-[10px] bg-white px-1 ring-1 ring-inset ring-[#0a0a0a]/[0.09]">
      <span className="px-2 text-[12px] text-[#0a0a0a]/45">Show</span>
      {PER_PAGE_OPTIONS.map((option) => {
        const active = option === current;
        return (
          <Link
            key={option ?? "all"}
            href={perPageHref(basePath, searchParams, option)}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-[7px] px-2.5 py-1 text-[12.5px] tabular-nums transition-colors",
              active ? "bg-[#ecebff] text-[#4b4bea] ring-1 ring-inset ring-[#6666ff]/25 font-semibold" : "text-[#0a0a0a]/55 hover:text-[#0a0a0a]"
            )}
          >
            {option ?? "All"}
          </Link>
        );
      })}
    </div>
  );
}
