"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { cn } from "@/lib/utils";

/** One thing standing between the current draft and a save. */
export type Problem = {
  id: string;
  message: string;
  /** Called to take the user to whatever needs fixing. */
  onJump?: () => void;
  jumpLabel?: string;
};

/**
 * The save bar every editor shares.
 *
 * It only appears once there is something to save, and disappears again the
 * moment the draft matches what's stored — including when you undo a change
 * back to its original value, which is the behaviour that makes "is there
 * anything unsaved" trustworthy rather than a guess.
 *
 * Blocking problems are listed here rather than raised as toasts, because a
 * toast that vanishes is the wrong home for something you have to go and fix.
 */
export function StickySaveBar({
  dirty,
  saveState,
  onSave,
  onDiscard,
  problems = [],
  saveLabel = "Save changes",
  children,
}: {
  dirty: boolean;
  saveState: SaveState;
  onSave: () => void;
  onDiscard: () => void;
  problems?: Problem[];
  saveLabel?: string;
  /** Extra controls for this editor, e.g. a Draft/Published toggle. */
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const blocked = problems.length > 0;

  // Ctrl/Cmd+S saves. Esc collapses the problem list.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty && !blocked) onSave();
        return;
      }
      if (event.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, blocked, onSave]);

  // Nothing pending and nothing to report — stay out of the way entirely.
  if (!dirty && saveState !== "saved" && !blocked) return null;

  return (
    <StickyBarViewport>
      <div className="pointer-events-auto w-full max-w-3xl overflow-hidden rounded-lg border border-border bg-white shadow-lg">
        {blocked && expanded && (
          <ul className="divide-y divide-border border-b border-border bg-rose-bg/40">
            {problems.map((problem) => (
              <li key={problem.id} className="flex items-start gap-2 px-4 py-2.5 text-sm">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-rose" />
                <span className="min-w-0 flex-1 leading-snug text-ink-soft">{problem.message}</span>
                {problem.onJump && (
                  <button
                    type="button"
                    onClick={problem.onJump}
                    className="flex-shrink-0 rounded px-2 py-0.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100"
                  >
                    {problem.jumpLabel ?? "Fix"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          {blocked ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-rose transition-colors hover:bg-rose/10 active:bg-rose/20"
            >
              <AlertTriangle className="h-4 w-4" />
              {problems.length === 1 ? "1 thing to fix" : `${problems.length} things to fix`}
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className={cn("px-2 text-sm", dirty ? "text-ink" : "text-ink-soft")}>
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {children}
            {dirty && (
              <button
                type="button"
                onClick={onDiscard}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
              >
                Discard
              </button>
            )}
            <SaveButton
              state={blocked ? "error" : dirty ? (saveState === "saving" ? "saving" : "idle") : saveState}
              // While blocked, the button opens the list of what's wrong rather
              // than sitting there dead — a disabled control that won't say why
              // is the thing people get stuck on.
              onClick={blocked ? () => setExpanded(true) : onSave}
              idleLabel={saveLabel}
              errorLabel={blocked ? "Fix problems first" : "Retry"}
              size="sm"
            />
          </div>
        </div>
      </div>
    </StickyBarViewport>
  );
}

/**
 * Where the save bar is painted: pinned to the bottom of the *viewport*, on
 * every screen size, above everything else.
 *
 * Portalled to <body> for the same reason the toasts are — `position: fixed`
 * resolves against the nearest transformed or filtered ancestor rather than the
 * viewport, and the customizer's panels provide several. Rendered in place, the
 * bar could end up pinned to the bottom of a panel and scroll out of sight,
 * which defeats the entire point of a save bar you can always reach.
 *
 * Inset by the safe area so it clears a phone's home indicator.
 */
function StickyBarViewport({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[2147483400] flex justify-center p-3 sm:p-4"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
      }}
    >
      {children}
    </div>,
    document.body
  );
}
