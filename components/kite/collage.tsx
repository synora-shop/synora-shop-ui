import { cn } from "@/lib/utils";

/** One placed photograph: the file's box, and for a crop window the drawn height and offset. */
export type KitePlaced = { x: number; y: number; w: number; h: number; crop?: { h: number; top: number } };

/**
 * Photographs placed by hand, as the file places them. Each covers its box;
 * a crop window (STRETCH in the file) draws the photograph at the height its
 * paint transform gives and shifts it by its offset, both in design pixels.
 */
export function KiteCollage({ boxes, srcs }: { boxes: KitePlaced[]; srcs: string[] }) {
  return (
    <>
      {boxes.map((b, i) =>
        srcs[i] ? (
          <div
            key={i}
            className="absolute overflow-hidden"
            style={{ left: `calc(${b.x}*var(--u))`, top: `calc(${b.y}*var(--u))`, width: `calc(${b.w}*var(--u))`, height: `calc(${b.h}*var(--u))` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={srcs[i]}
              alt=""
              className={cn("absolute left-0 w-full", b.crop ? "" : "top-0 h-full object-cover")}
              style={b.crop ? { height: `calc(${b.crop.h}*var(--u))`, top: `calc(${b.crop.top}*var(--u))` } : undefined}
            />
          </div>
        ) : null
      )}
    </>
  );
}
