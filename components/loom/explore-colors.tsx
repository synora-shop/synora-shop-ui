import { cn } from "@/lib/utils";
import { LOOM_RULE, px } from "@/components/loom/primitives";
import { href, str, type LoomContext } from "@/components/loom/contract";

/**
 * Explore by Colors — the title beside a wrapping row of swatch chips, on the
 * section's 1px top rule.
 *
 * Desktop, 1440x210: a 60/65 title in a 256 box (so it breaks after "by"),
 * 100 from an 841 block of chips, 40 above and below.
 *
 * Phone, 375x416: a 40/48 title on one line, 24 above the chips, which wrap
 * five rows deep at 6 apart, 40 above and below.
 *
 * The chips are the kit's colour-button component: radius 200, outlined
 * `#121212`, a 33px swatch inset 12, then the label 12 after it at Semi Bold
 * with +1px tracking — 57 tall at 16/24 on desktop, 48 tall at 14/24 on the
 * phone. Each chip's width is set by hand in the file, which is why they are
 * listed rather than hugged.
 *
 * It is one list that wraps, at both sizes. On desktop the two rows end at 767
 * and 801 inside the 841 box because the fifth chip does not fit after the
 * fourth — so wrapping, not two hand-built rows, is what reproduces them, and
 * it is what reproduces the phone's five rows too.
 *
 * The desktop label size is the component's own, not the instance's: the nine
 * chips override only their text, and the master sets 16px with +1 tracking.
 * Reading the instances alone suggests 14 and no tracking, which is what this
 * was built at first; the file's own laid-out width for "RED PASTEL" (104.81)
 * is the 16px one.
 *
 * The swatch colours are the component's nine variants, read from the file:
 * none of them is a token, and none of them appears anywhere else in the kit.
 */
/** The file's hand-set chip widths, for the kit's nine colours; any other label hugs. */
const WIDTHS: Record<string, { w: number; mw: number }> = {
  "Red Pastel": { w: 182, mw: 162 },
  "Lime Green": { w: 182, mw: 164 },
  "Navy Blue": { w: 175, mw: 155 },
  "Clean White": { w: 198, mw: 178 },
  "Blue Sky": { w: 162, mw: 152 },
  Purple: { w: 144, mw: 136 },
  Pink: { w: 118, mw: 113 },
  Yellow: { w: 149, mw: 141 },
  "Dark Green": { w: 188, mw: 175 },
};

export function LoomExploreColors({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const swatches = (Array.isArray(data.swatches) ? data.swatches : []) as Record<string, unknown>[];
  return (
    <section className="px-[calc(16*var(--u))] md:px-[calc(60*var(--u))]">
      <div
        className={cn(
          "flex flex-col gap-[calc(24*var(--u))] py-[calc(40*var(--u))] md:flex-row md:items-center md:gap-[calc(100*var(--u))]",
          LOOM_RULE
        )}
      >
        <h2
          data-m="explore-title"
          className="text-[calc(40*var(--u))] font-normal leading-[calc(48*var(--u))] tracking-[calc(-3*var(--u))] text-[#121212] md:w-[calc(256*var(--u))] md:shrink-0 md:text-[calc(60*var(--u))] md:leading-[calc(65*var(--u))]"
        >
          {str(data, "heading")}
        </h2>
        <div data-m="explore-chips" className="flex flex-wrap gap-[calc(6*var(--u))] md:w-[calc(841*var(--u))] md:gap-[calc(10*var(--u))]">
          {swatches.map((sw, n) => {
            const label = str(sw, "label");
            const color = str(sw, "color");
            const w = WIDTHS[label];
            return (
              <a
                key={`${label}-${n}`}
                href={href(sw, "link", ctx)}
                style={w ? px(w) : undefined}
                className={`flex h-[max(calc(48*var(--u)),40px)] shrink-0 items-center gap-[calc(12*var(--u))] rounded-[200px] border border-[#121212] pl-[calc(12*var(--u))] pr-[calc(12*var(--u))] md:h-[max(calc(57*var(--u)),40px)] ${w ? "min-w-[var(--mw)] md:min-w-[var(--w)]" : "pr-[calc(20*var(--u))]"}`}
              >
                {/* White carries the file's own #dedede ring, drawn inside the
                    circle; a colour that is not white has none. */}
                <span
                  className="h-[calc(33*var(--u))] w-[calc(33*var(--u))] shrink-0 rounded-full"
                  style={{
                    backgroundColor: color,
                    boxShadow: color.toLowerCase() === "#ffffff" ? "inset 0 0 0 1px #dedede" : undefined,
                  }}
                />
                <span className="whitespace-nowrap text-[max(calc(14*var(--u)),11.2px)] font-semibold uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))] text-[#121212] md:text-[max(calc(16*var(--u)),12.8px)]">
                  {label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
