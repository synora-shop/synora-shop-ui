import { cn } from "@/lib/utils";
import { href, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { KiteSectionHead } from "@/components/kite/section-head";
import { KiteCollage, type KitePlaced } from "@/components/kite/collage";

/**
 * Upcoming — "MacBook Pro 16" - 9" in the file, 1728x1117.
 *
 * The bar (XVIIII · UPCOMING); six photographs placed by hand, two of them
 * crop windows, two running past the screen's right and bottom edges and cut
 * there as the file cuts them. Centred at 607.5,355, a 514 column, 32 apart:
 * SPECIALS (SF Pro Light 20); "NEW YORK FASHION —— WEEK" (Khand 32, a 48 rule
 * 8 each side) over "w/ Ralph Lauren" (Meddon 48); a double rule 356 wide,
 * 4 apart; the words (SF Pro Light 16, centred, 356 wide); LEARN MORE
 * underlined (20).
 *
 * Desktop only, as the file draws it.
 */
const BOXES: KitePlaced[] = [
  { x: 32, y: 138, w: 280, h: 340 },
  { x: 1274, y: 321, w: 298, h: 229 },
  { x: 172, y: 575, w: 348, h: 267, crop: { h: 471.9, top: -200.1 } },
  { x: 32, y: 939, w: 655, h: 267, crop: { h: 1098.2, top: -330.3 } },
  { x: 1556, y: 720, w: 312, h: 239 },
  { x: 1034, y: 806, w: 422, h: 279 },
];

export function KiteUpcoming({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  return (
    <section data-k="upcoming" className="relative hidden h-[calc(1117*var(--u))] overflow-hidden md:block">
      <KiteCollage boxes={BOXES} srcs={BOXES.map((_, i) => str(data, `image${i + 1}`))} />
      <div className="absolute flex w-[calc(514*var(--u))] flex-col items-center gap-[calc(32*var(--u))] text-center" style={{ left: "calc(607.5*var(--u))", top: "calc(355*var(--u))" }}>
        <p {...kt("sans", 20)}>{str(data, "eyebrow")}</p>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-[calc(8*var(--u))]">
            <span {...kt("khand", 32)} className={cn(kt("khand", 32).className, "whitespace-nowrap")}>{str(data, "before")}</span>
            <span aria-hidden className="h-px w-[calc(48*var(--u))] bg-[#f4f3f1]" />
            <span {...kt("khand", 32)} className={cn(kt("khand", 32).className, "whitespace-nowrap")}>{str(data, "after")}</span>
          </div>
          <p {...kt("script", 48)} className={cn(kt("script", 48).className, "whitespace-nowrap")}>{str(data, "with")}</p>
        </div>
        <div aria-hidden className="relative h-[calc(4*var(--u))] w-[calc(356*var(--u))]">
          <span className="absolute inset-x-0 top-[calc(-0.5*var(--u))] h-px bg-[#f4f3f1]" />
          <span className="absolute inset-x-0 top-[calc(3.5*var(--u))] h-px bg-[#f4f3f1]" />
        </div>
        <p {...kt("sans", 16)} className={cn(kt("sans", 16).className, "w-[calc(356*var(--u))]")}>{str(data, "text")}</p>
        {str(data, "linkLabel") ? (
          <a href={href(data, "link", ctx)} {...kt("sans", 20)} className={cn(kt("sans", 20).className, "underline")}>
            {str(data, "linkLabel")}
          </a>
        ) : null}
      </div>
      <KiteSectionHead numeral={str(data, "numeral")} title={str(data, "title")} />
    </section>
  );
}
