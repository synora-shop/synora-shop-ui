import { cn } from "@/lib/utils";
import { kitHref } from "@/lib/themes/kit";
import type { KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";

type City = { image?: string; imagePosition?: string; eyebrow?: string; title?: string; link?: string; phoneShade?: number };

/**
 * Cities — "Frame 17" (desktop) and "Frame 84" (phone) in the file.
 *
 * Desktop: two 864x966 halves side by side under the header. Phone: the same
 * two stacked, 424.5 and 421 high — the file's own two heights. Each
 * photograph covers its box; the file keeps New York's middle and Los
 * Angeles' top in view (a crop window at the photo's own proportions, read
 * from the paint's transform), which is the "Keep in view" setting.
 *
 * Over each, centred both ways, the place in SF Pro Light capitals (20, 32
 * on the desktop) and the city in the serif (48, 96), the two overlapping by
 * 16 as the file's auto-layout gap of −16 makes them.
 */
export function KiteCities({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const cities = (Array.isArray(data.cities) ? (data.cities as City[]) : []).slice(0, 2);
  return (
    <section data-k="cities" className="flex flex-col md:h-[calc(966*var(--u))] md:flex-row">
      {cities.map((c, i) => {
        // A city with no link of its own goes to the shop rather than nowhere.
        const href = kitHref(ctx, c.link ?? "", "route:collection");
        const Box = href ? "a" : "div";
        return (
          <Box
            key={i}
            {...(href ? { href } : {})}
            data-k={`city-${i}`}
            className={cn(
              "relative block w-full overflow-hidden md:h-full md:w-[calc(864*var(--u))]",
              i === 0 ? "h-[calc(424.5*var(--u))]" : "h-[calc(421*var(--u))]"
            )}
          >
            {c.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.image} alt="" className={cn("absolute inset-0 h-full w-full object-cover", c.imagePosition === "top" ? "object-top" : "object-center")} />
            ) : null}
            {c.phoneShade ? <div aria-hidden className="absolute inset-0 bg-black md:hidden" style={{ opacity: c.phoneShade / 100 }} /> : null}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {c.eyebrow ? (
                <p {...kt("sans", 20, 32)} className={cn(kt("sans", 20, 32).className, "relative whitespace-nowrap uppercase")}>
                  {c.eyebrow}
                </p>
              ) : null}
              {c.title ? (
                <p {...kt("serif", 48, 96)} className={cn(kt("serif", 48, 96).className, "relative -mt-[calc(16*var(--u))] whitespace-nowrap")}>
                  {c.title}
                </p>
              ) : null}
            </div>
          </Box>
        );
      })}
    </section>
  );
}
