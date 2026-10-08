import { cn } from "@/lib/utils";
import { href, str, type KiteContext } from "@/components/kite/contract";
import { kitHref } from "@/lib/themes/kit";
import { kt } from "@/components/kite/type";
import { KiteSectionHead } from "@/components/kite/section-head";

type Story = { image?: string; number?: string; left?: string; right?: string; text?: string; link?: string };

/** A headline with a short rule in it — the file's "NEW YORK —— FASHION WEEK": Khand Light 20, a 48 rule, 8 each side. */
function RuledLine({ left, right }: { left?: string; right?: string }) {
  return (
    <div className="flex items-center gap-[calc(8*var(--u))]">
      {left ? <span {...kt("khand", 20)} className={cn(kt("khand", 20).className, "whitespace-nowrap")}>{left}</span> : null}
      <span aria-hidden className="h-px w-[calc(48*var(--u))] shrink-0 bg-[#f4f3f1]" />
      {right ? <span {...kt("khand", 20)} className={cn(kt("khand", 20).className, "whitespace-nowrap")}>{right}</span> : null}
    </div>
  );
}

/**
 * Newsletter — "MacBook Pro 16" - 7" and "Mobile | Newsletter" in the file.
 *
 * Desktop (1728x1117): the bar (XVII · NEWSLETTER); the photograph, 679x947
 * at 32,138; the featured story at 743,278, 583 wide, 32 between its parts —
 * №001 (SF Pro Light 16), the title (the serif, 40, capitals), the paragraph
 * whose first line holds a 48 rule after its first words (16), READ MORE
 * underlined (20); the stories from 743,622, 264 wide and 32 apart, running
 * past the screen's edge — a row to swipe.
 *
 * Phone (440): no photograph; the story at 16,107, 408 wide, 16 between its
 * parts, the title on two lines, the paragraph at 14 with the file's shorter
 * first line, READ MORE at 15; the stories from 16,446 on the screen — 339 into the section, under the 107 of header.
 *
 * Each story: its photograph 264x200, then 16 apart its number (12), its
 * ruled headline, its words (SF Pro Light 14).
 */
export function KiteNewsletter({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const stories = Array.isArray(data.stories) ? (data.stories as Story[]) : [];
  const image = str(data, "image");
  const phoneText = str(data, "textPhone") || str(data, "text");
  return (
    // The stories' row is in the flow, with the file's own space around it —
    // 339 above and 30 below on the phone (849), 622 and 15 on the desktop
    // (1117) — so where the reading floor lengthens their words the section
    // grows instead of cutting them off. Everything else is placed. The
    // bottom space is a pixel short on purpose (see limited.tsx): the minimum
    // height holds the design's size exactly.
    <section data-k="newsletter" className="relative min-h-[calc(849*var(--u))] overflow-hidden pb-[calc(30*var(--u)-1px)] pt-[calc(339*var(--u))] md:min-h-[calc(1117*var(--u))] md:pb-[calc(15*var(--u)-1px)] md:pt-[calc(622*var(--u))]">
      <div className="absolute inset-x-0 top-0">
        <KiteSectionHead numeral={str(data, "numeral")} title={str(data, "title")} />
      </div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute left-[calc(32*var(--u))] top-[calc(138*var(--u))] hidden h-[calc(947*var(--u))] w-[calc(679*var(--u))] object-cover md:block" />
      ) : null}

      <div className="absolute left-[calc(16*var(--u))] top-0 flex w-[calc(408*var(--u))] flex-col gap-[calc(16*var(--u))] md:left-[calc(743*var(--u))] md:top-[calc(278*var(--u))] md:w-[calc(583*var(--u))] md:gap-[calc(32*var(--u))]">
        <p {...kt("sans", 16)}>{str(data, "number")}</p>
        <h2 {...kt("serif", 40)} className={cn(kt("serif", 40).className, "uppercase")}>{str(data, "storyTitle")}</h2>
        <div>
          {[
            { text: str(data, "text"), cls: "hidden md:block", size: [16, 16] as const },
            { text: phoneText, cls: "md:hidden", size: [14, 14] as const },
          ].map((v) => (
            <p key={v.cls} {...kt("sans", v.size[0], v.size[1])} className={cn(kt("sans", v.size[0], v.size[1]).className, v.cls)}>
              {str(data, "lead")}
              <span aria-hidden className="mx-[calc(8*var(--u))] inline-block h-px w-[calc(48*var(--u))] bg-[#f4f3f1] align-middle" />
              {v.text}
            </p>
          ))}
        </div>
        {str(data, "linkLabel") ? (
          <a href={href(data, "link", ctx)} {...kt("sans", 15, 20)} className={cn(kt("sans", 15, 20).className, "self-start underline")}>
            {str(data, "linkLabel")}
          </a>
        ) : null}
      </div>

      <div className="relative overflow-x-auto [scrollbar-width:none]">
        <div className="flex w-max items-start gap-[calc(32*var(--u))] pl-[calc(16*var(--u))] pr-[calc(16*var(--u))] md:pl-[calc(743*var(--u))]">
          {stories.map((s, i) => {
            const to = s.link ? kitHref(ctx, s.link) : "";
            return (
              <article key={i} className="flex w-[calc(264*var(--u))] shrink-0 flex-col gap-[calc(16*var(--u))]">
                {s.image ? (
                  <a href={to || undefined} className="relative block h-[calc(200*var(--u))] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  </a>
                ) : null}
                <p {...kt("sans", 12)}>{s.number}</p>
                <RuledLine left={s.left} right={s.right} />
                <p {...kt("sans", 14)}>{s.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
