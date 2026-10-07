import { cn } from "@/lib/utils";
import { LoomHeartFill, LoomPhoneIcon, LoomRefreshIcon } from "@/components/loom/icons";
import { LOOM_RULE, LoomLines } from "@/components/loom/primitives";
import { str, type LoomContext } from "@/components/loom/contract";

/**
 * Service — 1440x558: a 60/65 heading, then three 410 columns 45 apart.
 *
 * The icons are 120px circles of `#121212` with a 48px white glyph centred —
 * the kit's own `Icon` component in its "Black background" variant, and the
 * glyphs are the file's own heart, phone and refresh paths rather than
 * look-alikes.
 *
 * Note the column text: 30/40 **Medium** for the title against the 60/65
 * Regular above it. The kit uses weight to separate a column head from a
 * section head, not size alone.
 *
 * Phone, 375x1020: the columns stack, 32 apart, under a 40/48 heading 24
 * above them; the circles are the component's Mobile variant, 80 with a 32
 * glyph, and the column text drops to 24/40 and 16/26.
 */
const ICONS = { love: LoomHeartFill, phone: LoomPhoneIcon, refund: LoomRefreshIcon } as const;

export function LoomService({ data }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const columns = (Array.isArray(data.columns) ? data.columns : []) as Record<string, unknown>[];
  return (
    <section className={cn("flex flex-col gap-[calc(24*var(--u))] px-[calc(16*var(--u))] py-[calc(40*var(--u))] md:gap-[calc(56*var(--u))] md:px-[calc(60*var(--u))]", LOOM_RULE)}>
      <h2 data-m="service-heading" className="text-[calc(40*var(--u))] font-normal leading-[calc(48*var(--u))] tracking-[calc(-3*var(--u))] text-[#121212] md:w-[calc(558*var(--u))] md:text-[calc(60*var(--u))] md:leading-[calc(65*var(--u))]">
        <LoomLines text={str(data, "heading")} />
      </h2>
      <div data-m="service-row" className="flex flex-col gap-[calc(32*var(--u))] md:flex-row md:items-center md:gap-[calc(45*var(--u))]">
        {columns.map((c, n) => {
          const Icon = ICONS[str(c, "icon") as keyof typeof ICONS] ?? LoomHeartFill;
          return (
          <div key={`${str(c, "title")}-${n}`} className="flex shrink-0 flex-col gap-[calc(24*var(--u))] md:w-[calc(410*var(--u))]">
            <span className="flex h-[calc(80*var(--u))] w-[calc(80*var(--u))] items-center justify-center rounded-full bg-[#121212] md:h-[calc(120*var(--u))] md:w-[calc(120*var(--u))]">
              <Icon className="h-[calc(32*var(--u))] w-[calc(32*var(--u))] text-white md:h-[calc(48*var(--u))] md:w-[calc(48*var(--u))]" />
            </span>
            <div className="flex flex-col gap-[calc(4*var(--u))]">
              <h3 data-m="service-title" className="text-[max(calc(24*var(--u)),19.2px)] font-medium leading-[calc(40*var(--u))] tracking-[calc(-1*var(--u))] text-[#121212] md:text-[calc(30*var(--u))]">
                {str(c, "title")}
              </h3>
              <p className="text-[max(calc(16*var(--u)),12.8px)] font-normal leading-[max(calc(26*var(--u)),20.8px)] tracking-[calc(-0.3*var(--u))] text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]">
                {str(c, "text")}
              </p>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
