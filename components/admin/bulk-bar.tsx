"use client";

import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * The bar that appears when rows are ticked.
 *
 * It floats over the bottom of the screen rather than sitting at the top of
 * the list, because by the time a merchant has ticked the fifth thing the top
 * of the list is somewhere above them. It says how many are selected before it
 * says anything else, since that is the fact they are about to act on, and it
 * carries its own way out — a selection you cannot clear is a mode you are
 * stuck in.
 */
export function BulkBar({
  count,
  noun,
  onClear,
  children,
}: {
  count: number;
  /** Singular, lower case: "product", "order". */
  noun: string;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="region"
      aria-label={`${count} ${noun}${count === 1 ? "" : "s"} selected`}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4",
        // Comes up from below rather than appearing: the movement is what says
        // "this is new", so it is not mistaken for part of the page. The class
        // is in globals.css, where reduced motion turns it off.
        "bulk-rise"
      )}
    >
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-pill border border-border bg-panel/95 px-2 py-2 shadow-lg backdrop-blur sm:gap-3 sm:px-3">
        <span className="pl-1.5 text-sm font-medium tabular-nums text-ink sm:pl-2">
          {count} {noun}
          {count === 1 ? "" : "s"}
        </span>
        <span className="h-5 w-px flex-shrink-0 bg-border" aria-hidden />
        <div className="flex flex-wrap items-center gap-1.5">{children}</div>
        <span className="h-5 w-px flex-shrink-0 bg-border" aria-hidden />
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
