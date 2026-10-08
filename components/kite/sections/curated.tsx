import { cn } from "@/lib/utils";
import { href, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { WHOLE, isFilePhoto } from "@/components/kite/assets";

/**
 * Curated by — "MacBook Pro 16" - 6" in the file, 1728x1117.
 *
 * Seven photographs placed by hand, the file's boxes exactly, each covering
 * its box (the first is a crop window at the photo's own proportions, 3.4
 * up — read from its paint transform). Over them, two bands of pure black
 * (#000, not the ground's #040404) as the file has them: 0–150 and 870 to the
 * bottom, so the collage is cut at both lines. Centred at 331,421 in a 1066
 * column: "NEW RELEASES — CURATED BY" in Khand Light 32 with a 48 rule
 * between (4 each side), the name in Meddon 96, the link underlined in SF Pro
 * Light 20.
 *
 * Desktop only, as the file draws it.
 */
const BOXES = [
  { x: 32, y: 32, w: 439, h: 419, crop: { h: 585.3, top: -3.41 } },
  { x: 1016, y: 32, w: 324, h: 389 },
  { x: 1372, y: 172, w: 324, h: 419 },
  { x: 32, y: 934, w: 324, h: 419 },
  { x: 387, y: 794, w: 324, h: 419 },
  { x: 1016, y: 737, w: 283, h: 348 },
  { x: 1331, y: 808, w: 365, h: 348 },
];

const box = (x: number, y: number, w: number, h: number) => ({
  left: `calc(${x}*var(--u))`,
  top: `calc(${y}*var(--u))`,
  width: `calc(${w}*var(--u))`,
  height: `calc(${h}*var(--u))`,
});

export function KiteCurated({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  return (
    <section data-k="curated" className="relative hidden h-[calc(1117*var(--u))] overflow-hidden md:block">
      {BOXES.map((b, i) => {
        const src = str(data, `image${i + 1}`);
        if (!src) return null;
        return (
          <div key={i} className="absolute overflow-hidden" style={box(b.x, b.y, b.w, b.h)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className={cn("absolute left-0 w-full", !isFilePhoto(src) ? cn("top-0 h-full", WHOLE) : b.crop ? "" : "top-0 h-full object-cover")}
              style={b.crop && isFilePhoto(src) ? { height: `calc(${b.crop.h}*var(--u))`, top: `calc(${b.crop.top}*var(--u))` } : undefined}
            />
          </div>
        );
      })}

      <div className="absolute flex w-[calc(1066*var(--u))] flex-col items-center" style={{ left: "calc(331*var(--u))", top: "calc(421*var(--u))" }}>
        <div className="flex items-center gap-[calc(4*var(--u))]">
          <p {...kt("khand", 32)} className={cn(kt("khand", 32).className, "whitespace-nowrap")}>{str(data, "before")}</p>
          <span aria-hidden className="h-px w-[calc(48*var(--u))] bg-[#f4f3f1]" />
          <p {...kt("khand", 32)} className={cn(kt("khand", 32).className, "whitespace-nowrap")}>{str(data, "after")}</p>
        </div>
        <p {...kt("script", 96)} className={cn(kt("script", 96).className, "whitespace-nowrap")}>{str(data, "name")}</p>
        {str(data, "linkLabel") ? (
          <a href={href(data, "link", ctx, "route:collection")} {...kt("sans", 20)} className={cn(kt("sans", 20).className, "whitespace-nowrap underline")}>
            {str(data, "linkLabel")}
          </a>
        ) : null}
      </div>

      <div aria-hidden className="absolute inset-x-0 top-0 h-[calc(150*var(--u))] bg-black" />
      <div aria-hidden className="absolute inset-x-0 top-[calc(870*var(--u))] h-[calc(580*var(--u))] bg-black" />
    </section>
  );
}
