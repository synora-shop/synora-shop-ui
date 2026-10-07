"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoomCard, LoomSwipeRow } from "@/components/loom/primitives";
import type { KitPhoto } from "@/lib/themes/kit";

/** A photograph on the product page — the platform's KitPhoto. */
export type GalleryView = KitPhoto;

/**
 * The product's photographs. Not in the kit — designed here from its parts.
 *
 * Desktop: one 654x654 photograph at radius 40 — the width the kit gives its
 * blog image, and the left half of the 654 / 60 / 606 split the blog row
 * already uses — with four 156x156 thumbnails at radius 24 under it, 10 apart,
 * which is the kit's one gutter. The chosen thumbnail is ringed in ink, 1px,
 * the way every outlined control in the kit is drawn.
 *
 * Phone: the photographs become a row to swipe, 311 wide so the next one shows
 * 24px past the edge — the same "there is more this way" the phone hero's
 * category cards say. No thumbnails: on a phone the photo is the control.
 *
 * The kit has one photograph per product, so the views are the same photo at
 * different crops — a close-up of the sole, the wing, the midsole. A merchant's
 * real product would carry real views; the layout does not change.
 */
export function LoomGallery({
  views,
  label,
  thumbnails = true,
}: {
  views: GalleryView[];
  /** What a screen reader calls the row of thumbnails. */
  label: string;
  /** The four small photographs under the large one, on desktop. */
  thumbnails?: boolean;
}) {
  const [chosen, setChosen] = useState(0);

  return (
    <div className="flex flex-col gap-[calc(10*var(--u))] md:w-[calc(654*var(--u))] md:shrink-0">
      {/* Desktop: the chosen view, large. */}
      <LoomCard data-m="pdp-image" className="hidden md:block md:h-[calc(654*var(--u))] md:w-full">
        <View view={views[chosen]} />
      </LoomCard>

      {thumbnails && <div className="hidden gap-[calc(10*var(--u))] md:flex" role="tablist" aria-label={label}>
        {views.map((v, i) => (
          <button
            key={v.alt}
            type="button"
            role="tab"
            aria-selected={i === chosen}
            aria-label={v.alt}
            onClick={() => setChosen(i)}
            className={cn(
              "relative h-[calc(156*var(--u))] w-[calc(156*var(--u))] shrink-0 overflow-hidden rounded-[calc(24*var(--u))] bg-[#d9d9d9]",
              i === chosen && "after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_#121212]"
            )}
          >
            <View view={v} />
          </button>
        ))}
      </div>}

      {/* Phone: every view, to swipe. */}
      <LoomSwipeRow data-m="pdp-swipe" className="snap-x snap-mandatory scroll-pl-[calc((100cqw-375*var(--u))/2+16*var(--u))] gap-[calc(8*var(--u))] md:hidden">
        {views.map((v) => (
          <LoomCard key={v.alt} className="h-[calc(343*var(--u))] w-[calc(311*var(--u))] snap-start rounded-[calc(24*var(--u))]">
            <View view={v} />
          </LoomCard>
        ))}
      </LoomSwipeRow>
    </div>
  );
}

function View({ view }: { view: GalleryView }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={view.src}
      alt={view.alt}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: view.at ?? "50% 50%", transform: `scale(${view.zoom ?? 1})`, transformOrigin: view.at ?? "50% 50%" }}
    />
  );
}
