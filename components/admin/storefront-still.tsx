"use client";

import { useEffect, useRef, useState } from "react";

/** The width the storefront is rendered at before being scaled down. A desktop
 *  width, because that is the layout a merchant is judging. */
const RENDER_WIDTH = 1440;

/**
 * A photograph of a storefront, taken by the browser.
 *
 * Not a window: it does not scroll and cannot be clicked, because scrolling
 * around inside a small frame is the worst of both — a merchant who wants to
 * move around has a button that opens the real thing at its real address.
 *
 * The scale is measured rather than guessed. It used to be a fixed 0.42, which
 * meant the picture was 605px wide inside whatever container it was given, and
 * on a desktop that left half the panel empty beside it.
 */
export function StorefrontStill({
  url,
  height,
  className,
}: {
  url: string;
  /** How much of the page to show, in pixels on screen. */
  height: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setScale(el.clientWidth / RENDER_WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={box}
      style={{ height }}
      className={"relative overflow-hidden bg-subtle " + (className ?? "")}
    >
      {/* Held back until the width is known: rendering at the wrong scale first
          and correcting it is a visible lurch on every page load. */}
      {scale !== null && (
        <iframe
          src={url}
          title=""
          loading="lazy"
          tabIndex={-1}
          aria-hidden
          style={{
            width: RENDER_WIDTH,
            height: Math.ceil(height / scale),
            transform: `scale(${scale})`,
          }}
          // `scrolling="no"` as well as pointer-events, and both are needed.
          // pointer-events stops a click reaching it; it does not stop the frame
          // showing its own scrollbar down the right-hand edge, and it does not
          // stop the page inside scrolling by other means. This is a
          // photograph — it should have no scrollbar to look at.
          scrolling="no"
          className="pointer-events-none absolute left-0 top-0 origin-top-left overflow-hidden border-0"
        />
      )}
    </div>
  );
}
