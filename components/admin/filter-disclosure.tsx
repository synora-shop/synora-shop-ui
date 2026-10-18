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
          "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] transition-colors",
          open || activeCount > 0
            ? "bg-[#ecebff] text-[#4b4bea] ring-1 ring-inset ring-[#6666ff]/25"
            : "bg-white text-[#0a0a0a]/65 ring-1 ring-inset ring-[#0a0a0a]/[0.09] hover:text-[#0a0a0a] hover:ring-[#0a0a0a]/25"
        )}
      >
        <SlidersHorizontal className="h-[var(--icon-box)] w-[var(--icon-box)]" />
        {activeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        // Full width of the action bar, below the row it belongs to — the bar
        // wraps, so this simply becomes the next line of it.
        <div className="w-full rounded-2xl bg-white p-2 ring-1 ring-[#0a0a0a]/[0.07]">{children}</div>
      )}
    </>
  );
}
