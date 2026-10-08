import { LoomButton, LoomCard, LoomCover, LoomPhoto } from "@/components/loom/primitives";
import { href, str, type LoomContext } from "@/components/loom/contract";
import { KIT } from "@/components/loom/sections/home.schema";

/**
 * Blog — a 30/38 title, then one 654x367 image beside a 606 column, 60 apart.
 *
 * The desktop section's padding is lopsided on purpose: nothing above, 120
 * below. It is the last thing before the footer, and the file gives it the
 * breathing room rather than giving the footer a top margin.
 *
 * The phone is even, 40 above and below, and stacks: a 343x232 image at radius
 * 35 (the file's own odd number), 20 to a 40/48 headline, 16/26 body.
 *
 * No top rule here — this is the one section of the six without one.
 */
export function LoomBlog({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const photo = str(data, "image");
  return (
    <section className="px-[calc(16*var(--u))] py-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))] md:pt-0">
      <div className="flex flex-col gap-[calc(30*var(--u))]">
        <h2 className="text-[calc(30*var(--u))] font-normal leading-[calc(38*var(--u))] tracking-[calc(-1*var(--u))] text-[#121212]">
          {str(data, "heading")}
        </h2>
        <div className="flex flex-col gap-[calc(20*var(--u))] md:flex-row md:items-center md:gap-[calc(60*var(--u))]">
          <LoomCard data-m="blog-image" className="h-[calc(232*var(--u))] w-full rounded-[calc(35.09*var(--u))] md:h-[calc(367*var(--u))] md:w-[calc(654*var(--u))] md:rounded-[calc(40*var(--u))]">
            {photo === KIT.blog ? (
              <LoomPhoto src={photo} w={747} h={1121} x={-33} y={-139} m={{ w: 391.78, h: 708.64, x: -17.31, y: -87.87 }} />
            ) : (
              <LoomCover src={photo} />
            )}
          </LoomCard>
          <div data-m="blog-copy" className="flex shrink-0 flex-col gap-[calc(24*var(--u))] md:w-[calc(606*var(--u))]">
            <div className="flex flex-col gap-[calc(20*var(--u))]">
              <h3
                data-m="blog-headline"
                className="text-[calc(40*var(--u))] font-normal leading-[calc(48*var(--u))] tracking-[calc(-3*var(--u))] text-[#121212] md:text-[calc(60*var(--u))] md:leading-[calc(65*var(--u))]"
              >
                {str(data, "headline")}
              </h3>
              <p className="text-[max(calc(16*var(--u)),12.8px)] font-normal leading-[max(calc(26*var(--u)),20.8px)] tracking-[calc(-0.3*var(--u))] text-[#121212]/80 md:w-[calc(566*var(--u))] md:text-[max(calc(18*var(--u)),14.4px)]">
                {str(data, "text")}
              </p>
            </div>
            {str(data, "buttonLabel") && (
              <LoomButton variant="outline" href={href(data, "buttonLink", ctx, "route:collection")} className="min-w-[calc(170*var(--u))]">
                {str(data, "buttonLabel")}
              </LoomButton>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
