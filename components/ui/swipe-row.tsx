"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { cn } from "@/lib/utils";

export type SwipeAction = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  /** Destructive actions (delete/permanently delete) render in rose; positive/reversible
   * actions (restore) render in green. Defaults to ink. */
  tone?: "default" | "danger" | "success";
};

const ACTION_WIDTH = 72; // px, mobile full-bleed action button width

/**
 * A list row with per-row actions (Edit/Delete/Restore/etc.) that reveal two different
 * ways depending on input method — both driven by the same `actions` array:
 *   - Touch (below the `lg` breakpoint): swipe the row left to reveal full-bleed action
 *     buttons behind it, iOS Mail/Reminders-style. Tapping the row while open closes it
 *     first instead of triggering navigation.
 *   - Mouse (`lg` and up): small icon buttons at the row's end, invisible until hover —
 *     this is the standard "hover affordance" for every admin/cart list row.
 */
export function SwipeRow({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  actions: SwipeAction[];
  className?: string;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isTouchLayout, setIsTouchLayout] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startDragX = useRef(0);
  const axis = useRef<"x" | "y" | null>(null);
  // Velocity tracking for flick-to-open/close, independent of how far the
  // finger travelled — a fast short flick should behave like a slow long
  // drag, not require crossing the same distance threshold.
  const lastMoveX = useRef(0);
  const lastMoveT = useRef(0);
  const velocity = useRef(0);
  const maxDrag = -(actions.length * ACTION_WIDTH);
  // Rubber-band resistance once dragged past either bound, so the row still
  // tracks the finger (feels alive) instead of hard-stopping (feels broken).
  const RESISTANCE = 0.35;
  function withResistance(x: number) {
    if (x > 0) return x * RESISTANCE;
    if (x < maxDrag) return maxDrag + (x - maxDrag) * RESISTANCE;
    return x;
  }

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    // Deliberately set after mount, not via a lazy useState initializer — `window` isn't
    // available during SSR, and computing this on the client's first render instead would
    // risk a hydration mismatch. One extra render after mount is the safer trade-off.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsTouchLayout(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsTouchLayout(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  if (actions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startDragX.current = dragX;
    axis.current = null;
    lastMoveX.current = e.touches[0].clientX;
    lastMoveT.current = e.timeStamp;
    velocity.current = 0;
  }
  function onTouchMove(e: React.TouchEvent) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Decide the gesture's axis once, on the first meaningful movement — a
    // vertical intent hands the gesture back to the page's native scroll
    // (we simply stop touching dragX) instead of fighting it, which is what
    // made swiping feel janky/imprecise before.
    if (axis.current === null) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      axis.current = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
      if (axis.current === "x") setDragging(true);
    }
    if (axis.current !== "x") return;

    const now = e.timeStamp;
    const dt = now - lastMoveT.current;
    if (dt > 0) velocity.current = (touch.clientX - lastMoveX.current) / dt;
    lastMoveX.current = touch.clientX;
    lastMoveT.current = now;

    setDragX(withResistance(startDragX.current + deltaX));
  }
  function onTouchEnd() {
    setDragging(false);
    if (axis.current !== "x") return;
    // A decisive flick (fast enough) opens/closes regardless of distance
    // travelled; otherwise fall back to the halfway-distance rule.
    const FLICK_VELOCITY = 0.5; // px/ms
    setDragX((x) => {
      if (velocity.current < -FLICK_VELOCITY) return maxDrag;
      if (velocity.current > FLICK_VELOCITY) return 0;
      return x < maxDrag * 0.4 ? maxDrag : 0;
    });
  }

  const isOpen = dragX !== 0;

  function runAction(fn: () => void) {
    setDragX(0);
    fn();
  }

  return (
    <div className={cn("group relative overflow-hidden", className)}>
      {/* Mobile: full-bleed buttons behind the row, revealed by the swipe transform below. */}
      <div
        className="absolute inset-y-0 right-0 flex lg:hidden"
        style={{ width: actions.length * ACTION_WIDTH }}
      >
        {actions.map(({ key, label, icon: Icon, onClick, tone }) => (
          <button
            key={key}
            type="button"
            aria-label={label}
            onClick={() => runAction(onClick)}
            style={{ width: ACTION_WIDTH }}
            className={cn(
              "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-white transition-colors active:brightness-90",
              tone === "danger" ? "bg-rose" : tone === "success" ? "bg-green" : "bg-ink"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClickCapture={(e) => {
          if (isOpen) {
            e.preventDefault();
            e.stopPropagation();
            setDragX(0);
          }
        }}
        style={{
          transform: isTouchLayout ? `translateX(${dragX}px)` : undefined,
          touchAction: "pan-y",
          willChange: isTouchLayout ? "transform" : undefined,
          transition: dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="relative flex items-stretch bg-white"
      >
        <div className="min-w-0 flex-1">{children}</div>

        {/* Desktop: small icon buttons at the row's end, revealed on hover (or keyboard focus). */}
        <div className="hidden flex-shrink-0 items-center gap-1 pl-2 pr-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 lg:flex">
          {actions.map(({ key, label, icon: Icon, onClick, tone }) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              onClick={() => runAction(onClick)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                tone === "danger"
                  ? "text-ink-soft hover:bg-rose-bg hover:text-rose active:bg-rose-bg active:text-rose"
                  : tone === "success"
                    ? "text-ink-soft hover:bg-green-bg hover:text-green active:bg-green-bg active:text-green"
                    : "text-ink-soft hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
