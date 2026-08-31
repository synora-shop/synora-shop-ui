"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Move-up/move-down fallback for reorderable lists. HTML5 drag-and-drop
 * (`draggable`) doesn't fire on touch devices, so anything the user can
 * reorder needs this as the real, always-usable control — drag is just a
 * bonus on desktop.
 */
export function ReorderButtons({
  index,
  count,
  onMove,
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        aria-label="Move up"
        className="rounded border border-border p-1 text-ink-soft transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 active:bg-brand-100 disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-ink-soft"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onMove(index, index + 1)}
        disabled={index === count - 1}
        aria-label="Move down"
        className="rounded border border-border p-1 text-ink-soft transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 active:bg-brand-100 disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-ink-soft"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
