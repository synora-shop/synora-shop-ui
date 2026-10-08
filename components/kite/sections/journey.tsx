import { cn } from "@/lib/utils";
import { str } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";

/**
 * Journey — "MacBook Pro 16" - 10" running into "- 11" in the file.
 *
 * The photograph is one crop window drawn in both screens — 679 wide at 525,
 * from 309 on the first screen to 130 into the next — so here it is one
 * photograph, 309 to 1247, and the section is 1247 high: the footer that
 * follows starts where it ends. The crop: the photo drawn 757.6x947, 39.3 to
 * the left (the paint transform's 0.8963 and 0.0519).
 *
 * Over it: the heading in Meddon 32 at 559,226; turned a quarter to read
 * upwards, Khand Light 128 — "A JOURNEY" from 403,667, "THROUGH TIME" from
 * 1120,1082 (the file's rotation, origin at those points); the caption in SF
 * Pro Light 12 at 557,1043, 346 wide.
 *
 * Desktop only, as the file draws it.
 */
export function KiteJourney({ data }: { data: Record<string, unknown> }) {
  const image = str(data, "image");
  const turned = (text: string, x: number, y: number) =>
    text ? (
      <p
        {...kt("khand", 128)}
        className={cn(kt("khand", 128).className, "absolute origin-top-left -rotate-90 whitespace-nowrap")}
        // Merged with the type's own variables — a style given separately
        // replaced them, and the 128px line drew at the body size.
        style={{ ...kt("khand", 128).style, left: `calc(${x}*var(--u))`, top: `calc(${y}*var(--u))` }}
      >
        {text}
      </p>
    ) : null;
  return (
    // Clipped sideways only: on a small laptop the reading floor lengthens the
    // caption a few pixels past the section's foot, into the footer's empty
    // top, rather than cutting its last line. The photograph clips itself.
    <section id="journey" data-k="journey" className="relative hidden h-[calc(1247*var(--u))] overflow-x-clip md:block">
      {image ? (
        <div className="absolute left-[calc(525*var(--u))] top-[calc(309*var(--u))] h-[calc(938*var(--u))] w-[calc(679*var(--u))] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute left-[calc(-39.3*var(--u))] top-0 h-[calc(947*var(--u))] w-[calc(757.6*var(--u))] max-w-none" />
        </div>
      ) : null}
      <p {...kt("script", 32)} className={cn(kt("script", 32).className, "absolute left-[calc(559*var(--u))] top-[calc(226*var(--u))] whitespace-nowrap")}>
        {str(data, "heading")}
      </p>
      {turned(str(data, "left"), 403, 667)}
      {turned(str(data, "right"), 1120, 1082)}
      {str(data, "caption") ? (
        <p {...kt("sans", 12)} className={cn(kt("sans", 12).className, "absolute left-[calc(557*var(--u))] top-[calc(1043*var(--u))] w-[calc(346*var(--u))]")}>
          {str(data, "caption")}
        </p>
      ) : null}
    </section>
  );
}
