"use client";

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
  // New admin (15 October): a black bar floating over the list, the way the
  // design draws it, clear of the rail on a desktop. The actions inside it
  // are the screen's own; they read as light buttons on the dark ground.
  return (
    <div
      role="region"
      aria-label={`${count} ${noun}${count === 1 ? "" : "s"} selected`}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4 lg:left-[15.5rem]",
        "bulk-rise"
      )}
    >
      <div className="bulk-bar-dark pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-2xl bg-[#0a0a0a] p-2 pl-4 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] sm:gap-3">
        <span className="text-[13.5px] font-semibold tabular-nums">
          {count} {noun}
          {count === 1 ? "" : "s"} selected
        </span>
        <div className="flex flex-wrap items-center gap-1.5">{children}</div>
        <button type="button" onClick={onClear} className="rounded-xl px-3 py-2 text-[13px] font-semibold text-white/70 hover:bg-white/10 hover:text-white">
          Clear
        </button>
      </div>
    </div>
  );
}

/** An action on the black bar: light on dark, red for the one that removes. */
export function BarButton({ onClick, disabled, danger = false, children }: { onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors hover:bg-white/10 disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4",
        danger ? "text-[#ffb4a1]" : "text-white"
      )}
    >
      {children}
    </button>
  );
}
