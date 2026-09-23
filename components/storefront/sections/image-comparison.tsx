"use client";

import { useState } from "react";
import { SectionImage } from "@/components/storefront/section-image";

/**
 * Two photos with a divider that drags between them.
 *
 * Built as a range input rather than pointer maths, which buys three things
 * for free and they are the three that usually get missed: it works with a
 * keyboard, it works with touch, and a screen reader announces it as a slider
 * with a position. A div with a drag handler has none of those unless somebody
 * remembers to add them.
 */
export function ImageComparison({
  heading,
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  startAt = 50,
}: {
  heading?: string;
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
  startAt?: number;
}) {
  const [at, setAt] = useState(Math.min(90, Math.max(10, startAt ?? 50)));

  // Both halves are the point. With one photo there is nothing to compare, and
  // showing it alone would be a different section pretending to be this one.
  if (!beforeImage || !afterImage) return null;

  return (
    <div className="mx-auto max-w-4xl">
      {heading && <h2 className="mb-6 text-center font-serif text-3xl font-semibold">{heading}</h2>}

      <div className="relative aspect-[4/3] select-none overflow-hidden rounded-lg bg-subtle">
        <SectionImage
          src={afterImage}
          alt={afterLabel}
          className="object-cover"
          sizes="(min-width: 1024px) 56rem, 100vw"
        />
        {/* Clipped, not resized.
            
            The left photo has to stay the size of the *box* while the divider
            moves, or it squashes instead of being revealed. That was done by
            reading box.current?.clientWidth into the style — a ref read during
            render, which is wrong twice over: on the first render the ref is
            still null so the photo fell back to 100% of the clip and squashed
            exactly as described, and nothing re-measured it when the window
            resized.
            
            clip-path needs no measurement. The image stays full size in a
            full-size box and the box is clipped, which is what "revealed"
            means. */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }}>
          <SectionImage
            src={beforeImage}
            alt={beforeLabel}
            className="object-cover"
            sizes="(min-width: 1024px) 56rem, 100vw"
          />
        </div>

        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${at}%` }}>
          <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/30 backdrop-blur" />
        </div>

        <span className="absolute bottom-3 left-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-white">
          {beforeLabel}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-white">
          {afterLabel}
        </span>

        <input
          type="range"
          min={0}
          max={100}
          value={at}
          onChange={(e) => setAt(Number(e.target.value))}
          aria-label={`Reveal ${afterLabel} over ${beforeLabel}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
    </div>
  );
}
