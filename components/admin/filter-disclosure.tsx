"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The filter button in the action bar, and the filters it reveals.
 *
 * The filter chips used to sit permanently above every list, which on a screen
 * with two groups and a dozen options was a paragraph of controls to read past
 * before reaching the rows. Behind a button they cost one click, and the count
 * on the button means a merchant can still see at a glance that something is
 * applied without opening it.
 *
 * Opens by itself when a filter is already on, so arriving from a bookmarked
 * filtered URL never leaves the reason for a short list hidden.
 */
export function FilterDisclosure({
  activeCount = 0,
  children,
}: {
  activeCount?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(activeCount > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={activeCount ? `Filters — ${activeCount} applied` : "Filters"}
        title="Filters"
        className={cn(
          "relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-pill border transition-colors",
          open || activeCount > 0
            ? "border-transparent bg-brand-500 text-white"
            : "border-control-line bg-control text-control-ink hover:text-ink"
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {activeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        // Full width of the action bar, below the row it belongs to — the bar
        // wraps, so this simply becomes the next line of it.
        <div className="w-full border-t border-control-line px-1 pt-2">{children}</div>
      )}
    </>
  );
}
