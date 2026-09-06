"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortChoice = { value: string; label: string; href: string };

/**
 * The sort control in the action bar.
 *
 * A menu rather than a row of chips: a list has five or six orderings and only
 * one can be true at a time, so laying them all out would spend most of the bar
 * on five things a merchant is not choosing. The button says which one is on,
 * which is the part they need at a glance.
 *
 * The options are links, built on the server. Clicking one is a navigation, so
 * the ordering is in the address and survives a reload — and with paging on,
 * ordering in the browser would only ever re-arrange the twenty-five rows
 * already on screen, which is not sorting.
 */
export function SortMenu({ options, current }: { options: SortChoice[]; current: string }) {
  const [open, setOpen] = useState(false);
  const chosen = options.find((o) => o.value === current) ?? options[0];

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Sort — ${chosen.label}`}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-pill border px-3 text-xs transition-colors",
          open
            ? "border-transparent bg-brand-500 text-white"
            : "border-control-line bg-control text-control-ink hover:text-ink"
        )}
      >
        <ArrowUpDown className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
        <span className="hidden whitespace-nowrap sm:inline">{chosen.label}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-xl border border-control-line bg-control py-1 shadow-lg">
            {options.map((option) => (
              <Link
                key={option.value}
                href={option.href}
                onClick={() => setOpen(false)}
                aria-current={option.value === current ? "true" : undefined}
                className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
              >
                {/* The tick keeps its space when absent, so the labels line up
                    down the column rather than shifting by the width of it. */}
                <Check
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 text-brand-500",
                    option.value === current ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden
                />
                {option.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
