import { cn } from "@/lib/utils";
import { LOOM_RULE, px } from "@/components/loom/primitives";

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
type Swatch = { label: string; color: string; w: number; mw: number };

const SWATCHES: Swatch[] = [
  { label: "Red Pastel", color: "#e25f5f", w: 182, mw: 162 },
  { label: "Lime Green", color: "#b8e25f", w: 182, mw: 164 },
  { label: "Navy Blue", color: "#233c6b", w: 175, mw: 155 },
  { label: "Clean White", color: "#ffffff", w: 198, mw: 178 },
  { label: "Blue Sky", color: "#5fabe2", w: 162, mw: 152 },
  { label: "Purple", color: "#b54ef4", w: 144, mw: 136 },
  { label: "Pink", color: "#f44e8a", w: 118, mw: 113 },
  { label: "Yellow", color: "#f4cf4e", w: 149, mw: 141 },
  { label: "Dark Green", color: "#44936d", w: 188, mw: 175 },
];

export function LoomExploreColors() {
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
          Explore by Colors
        </h2>
        <div data-m="explore-chips" className="flex flex-wrap gap-[calc(6*var(--u))] md:w-[calc(841*var(--u))] md:gap-[calc(10*var(--u))]">
          {SWATCHES.map((s) => (
            <button
              key={s.label}
              type="button"
              style={px({ w: s.w, mw: s.mw })}
              className="flex h-[max(calc(48*var(--u)),40px)] min-w-[var(--mw)] shrink-0 items-center gap-[calc(12*var(--u))] rounded-[200px] border border-[#121212] pl-[calc(12*var(--u))] pr-[calc(12*var(--u))] md:h-[max(calc(57*var(--u)),40px)] md:min-w-[var(--w)]"
            >
              {/* Clean White carries the file's own #dedede ring, drawn
                  inside the circle; the other eight have none. */}
              <span
                className="h-[calc(33*var(--u))] w-[calc(33*var(--u))] shrink-0 rounded-full"
                style={{
                  backgroundColor: s.color,
                  boxShadow: s.color === "#ffffff" ? "inset 0 0 0 1px #dedede" : undefined,
                }}
              />
              <span className="whitespace-nowrap text-[max(calc(14*var(--u)),11.2px)] font-semibold uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))] text-[#121212] md:text-[max(calc(16*var(--u)),12.8px)]">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
