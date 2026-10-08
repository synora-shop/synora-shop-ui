import { cn } from "@/lib/utils";
import { href, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { KiteSectionHead } from "@/components/kite/section-head";

/**
 * About — "MacBook Pro 16" - 8" and "Mobile | About" in the file.
 *
 * Desktop (1728x1117): the bar (XVIII · ABOUT US); at 246,280 a centred
 * column 525 wide, 32 apart — "CRAFTED —— IN" (Khand 32, a 48 rule 8 each
 * side), the place in Meddon 64, the words (SF Pro Light 16), a 525x200
 * photograph, LEARN MORE underlined (16). The portrait, 679x947 at 1017,138,
 * carries words printed in black 12 at 32,32 (159 wide) and the signature in
 * Meddon 32, #040404, at 303,860 within it.
 *
 * Phone (440): the column at 16,146 on the screen — 39 into the section —
 * 408 wide, 16 apart: Khand 20, Meddon 40, the words at 14, no small
 * photograph, LEARN MORE; the portrait 408x500 at 16,440 (333 in), its words
 * at 20,20, 8px, 116 wide; no signature.
 */
export function KiteAbout({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const portrait = str(data, "portrait");
  return (
    <section id="about" data-k="about" className="relative h-[calc(849*var(--u))] overflow-hidden md:h-[calc(1117*var(--u))]">
      <KiteSectionHead numeral={str(data, "numeral")} title={str(data, "title")} />

      <div className="absolute left-[calc(16*var(--u))] top-[calc(39*var(--u))] flex w-[calc(408*var(--u))] flex-col items-center gap-[calc(16*var(--u))] text-center md:left-[calc(246*var(--u))] md:top-[calc(280*var(--u))] md:w-[calc(525*var(--u))] md:gap-[calc(32*var(--u))]">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-[calc(8*var(--u))]">
            <span {...kt("khand", 20, 32)} className={cn(kt("khand", 20, 32).className, "whitespace-nowrap")}>{str(data, "before")}</span>
            <span aria-hidden className="h-px w-[calc(48*var(--u))] bg-[#f4f3f1]" />
            <span {...kt("khand", 20, 32)} className={cn(kt("khand", 20, 32).className, "whitespace-nowrap")}>{str(data, "after")}</span>
          </div>
          <p {...kt("script", 40, 64)} className={cn(kt("script", 40, 64).className, "whitespace-nowrap")}>{str(data, "place")}</p>
        </div>
        <p {...kt("sans", 14, 16)}>{str(data, "text")}</p>
        {str(data, "image") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={str(data, "image")} alt="" className="hidden h-[calc(200*var(--u))] w-full object-cover md:block" />
        ) : null}
        {str(data, "linkLabel") ? (
          <a href={href(data, "link", ctx, "route:collection")} {...kt("sans", 16)} className={cn(kt("sans", 16).className, "underline")}>
            {str(data, "linkLabel")}
          </a>
        ) : null}
      </div>

      {portrait ? (
        <div className="absolute left-[calc(16*var(--u))] top-[calc(333*var(--u))] h-[calc(500*var(--u))] w-[calc(408*var(--u))] overflow-hidden md:left-[calc(1017*var(--u))] md:top-[calc(138*var(--u))] md:h-[calc(947*var(--u))] md:w-[calc(679*var(--u))]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portrait} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {str(data, "portraitText") ? (
            <p
              data-exact
              {...kt("sans", 8, 12, { exact: true })}
              className={cn(kt("sans", 8, 12, { exact: true }).className, "absolute left-[calc(20*var(--u))] top-[calc(20*var(--u))] w-[calc(116*var(--u))] text-black md:left-[calc(32*var(--u))] md:top-[calc(32*var(--u))] md:w-[calc(159*var(--u))]")}
            >
              {str(data, "portraitText")}
            </p>
          ) : null}
          {str(data, "signature") ? (
            <p {...kt("script", 32)} className={cn(kt("script", 32).className, "absolute left-[calc(303*var(--u))] top-[calc(860*var(--u))] hidden w-[calc(356*var(--u))] whitespace-nowrap text-[#040404] md:block")}>
              {str(data, "signature")}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
