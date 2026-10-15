import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { columnSort, sortHref, type SearchParams } from "@/lib/sorting";
import { cn } from "@/lib/utils";

/**
 * A column heading on the black head of a list (a row of boxes, not a table, so a row can
 * still be swiped on a phone), that sorts the list on the
 * server (new admin, 15 October). A link rather than a button: the ordering
 * lives in the address, so it survives a refresh, paging and the back button,
 * and every page of a long list is in the same order.
 */
export function SortHeading({
  label, asc, desc, current, basePath, searchParams, options, align = "left", className,
}: {
  label: string;
  asc: string;
  desc: string;
  current: string;
  basePath: string;
  searchParams: SearchParams;
  options: readonly { value: string }[];
  align?: "left" | "right";
  className?: string;
}) {
  const { next, dir } = columnSort(current, asc, desc);
  const Arrow = dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ChevronsUpDown;
  return (
    <div role="columnheader" aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"} className={cn(align === "right" ? "text-right" : "text-left", className)}>
      <Link
        href={sortHref(basePath, searchParams, next, options)}
        scroll={false}
        title={dir ? `Sorted ${dir === "asc" ? "low to high" : "high to low"}. Click to turn round.` : `Sort by ${label.toLowerCase()}`}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors",
          align === "right" ? "-mr-2 flex-row-reverse" : "-ml-2",
          dir ? "bg-white/[0.12] text-white" : "text-white/55 hover:bg-white/[0.07] hover:text-white"
        )}
      >
        {label}
        <Arrow className={cn("h-3.5 w-3.5", dir ? "text-[#b7b9ff]" : "opacity-0 group-hover:opacity-60")} />
      </Link>
    </div>
  );
}

/** A heading in the same black row for a column that does not sort. */
export function PlainHeading({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div role="columnheader" className={cn("text-left text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white/55", className)}>{children}</div>;
}
