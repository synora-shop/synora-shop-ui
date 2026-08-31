"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The "i" next to a setting, and the panel it opens.
 *
 * It used to expand inline, which pushed everything below it down — so reading
 * what a control does moved the control you were about to use. Now it floats
 * above the page instead: nothing reflows, and the thing you were looking at
 * stays where it was.
 *
 * Portalled to <body> for the same reason the toasts are. A popover rendered
 * inside a scrolling settings panel gets clipped by that panel's overflow, and
 * `position: fixed` inside a transformed ancestor is resolved against the
 * ancestor rather than the viewport. From <body> neither can happen.
 *
 * Closes on Escape, on an outside click, and on scroll — an anchored panel that
 * stays put while the page moves under it detaches from what it describes.
 */
export function InfoPopover({
  text,
  label = "What does this do?",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const anchor = buttonRef.current.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 24);

    // Prefer opening below-left of the trigger, then nudge back inside the
    // viewport, then flip above if there isn't room underneath. A tooltip that
    // opens off-screen is worse than no tooltip.
    let left = anchor.left;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    if (left < 12) left = 12;

    const estimated = 96;
    const below = anchor.bottom + 8;
    const top = below + estimated > window.innerHeight - 12 ? anchor.top - estimated - 8 : below;

    setPos({ top: Math.max(12, top), left, width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    const close = () => setOpen(false);

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          "inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors",
          open
            ? "bg-brand-600 text-white"
            : "text-ink-faint hover:bg-brand-50 hover:text-brand-600 active:bg-brand-100",
          className
        )}
      >
        <Info className="h-3 w-3" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="tooltip"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 2147483500 }}
            className="rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-ink-soft shadow-xl"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}
