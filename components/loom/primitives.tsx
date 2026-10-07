import { cn } from "@/lib/utils";
import { LoomArrowShortRight, LoomHeartOutline } from "@/components/loom/icons";

/**
 * The kit draws two screens, 375 and 1440, and nothing between them. Every
 * section is one tree with the 375 numbers as its base and the 1440 numbers
 * at `md:` — the same element, never a phone copy and a desktop copy, so a
 * product is in the document once and its photograph loads once.
 *
 * **Every length is a number of `--u`**, not of pixels. `--u` is one design
 * pixel at the current screen (set on `<main>` in app/loom/page.tsx): exactly
 * 1px at 375 and at 1440, so the file's numbers are the file's numbers there,
 * and proportionally less or more at every width between. That is what keeps
 * a hand-placed crop on its subject at 1100px wide — the photo and its card
 * shrink together. Text up to 24px and its line height never fall below 80%
 * of the design size (11px at the least), so a 1024 laptop is not set in 9px
 * type; the boxes around text grow rather than clip when that floor applies.
 *
 * Where the file sets a number per item rather than per section — a chip's
 * width, a photograph's crop — a class cannot carry it, so it rides in a CSS
 * custom property and the class reads `var()`. `px()` builds those, already
 * multiplied by `--u`.
 */
export function px(vars: Record<string, number | undefined>): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) if (v !== undefined) out[`--${k}`] = `calc(${v} * var(--u))`;
  return out as React.CSSProperties;
}

/**
 * The kit's one button — 50 tall, radius 200, 14/24 Medium, uppercase, +1px
 * tracking. The width is always explicit because it is in the file: 280 for
 * the hero pair (279 on the phone's hero), 170 for the blog, and hand-set
 * widths for the Trending filter row. Hugging the label instead would be
 * tidier and would not match.
 *
 * `+1px` on uppercase against `-5px` on the display face is the kit's whole
 * typographic idea, so the tracking here is not a detail to round off.
 */
export function LoomButton({
  children,
  variant = "solid",
  className,
  type = "button",
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: React.ReactNode;
  variant?: "solid" | "outline" | "outlineLight";
  /** A measurement handle for scripts/figma/verify-loom.mjs. */
  "data-m"?: string;
}) {
  return (
    <button
      type={type}
      {...props}
      className={cn(
        "flex h-[max(calc(50*var(--u)),40px)] min-w-[calc(280*var(--u))] shrink-0 self-start items-center justify-center whitespace-nowrap rounded-[200px] px-[calc(19*var(--u))] text-[max(calc(14*var(--u)),11.2px)] font-medium uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))] disabled:cursor-not-allowed",
        variant === "solid" && "bg-[#121212] text-white",
        variant === "outline" && "border border-[#121212] text-[#121212]",
        variant === "outlineLight" && "border border-[#dddddd] text-[#121212]/80",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * A photo card: a rounded box over a `#d9d9d9` ground.
 *
 * The grey is drawn, not assumed. Every image in the file sits on its own
 * `#d9d9d9` rounded rectangle, which is what shows through while the photo
 * loads and behind anything transparent — leaving it to the page background
 * would be white, and visibly wrong for the moment that matters.
 *
 * The radius is 40 on desktop throughout. The phone is not one number — 24 on
 * the hero and the small product cards, 21 on the wide ones, 35 on the blog,
 * and still 40 on the testimonial — so each call site says its own.
 */
export function LoomCard({
  className,
  children,
  style,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  /** A measurement handle for scripts/figma/verify-loom.mjs. */
  "data-m"?: string;
}) {
  return (
    <div
      data-m={props["data-m"]}
      style={style}
      className={cn("relative shrink-0 overflow-hidden rounded-[calc(40*var(--u))] bg-[#d9d9d9]", className)}
    >
      {children}
    </div>
  );
}

/** Where a photograph sits inside its card: its drawn size and its offset. */
export type Placement = { w: number; h: number; x?: number; y?: number };

/**
 * One placed photograph, at the exact size and offset the file gives it.
 *
 * Not `object-position`: the kit crops by hand. The hero's Casual card holds an
 * 845x565 image inside a 352x380 box at (-192,-98), which is a 2.4x
 * enlargement anchored on one shoulder — no object-position expresses that,
 * and guessing `center` moves the subject out of frame. So the numbers are
 * the numbers, and responsive work can trade them for a crop later with the
 * original in hand.
 *
 * `object-cover` is still on, and it is Figma's FILL mode rather than a
 * convenience: FILL covers its rectangle from the centre without distorting.
 * Most rectangles in the file already have the photo's own proportions, where
 * it changes nothing; on the phone several do not (the Basket Shoe's box is
 * 23% wider than its photo), and without it the shoe is stretched.
 *
 * The file's other mode, crop ("STRETCH" in the file), is not a rectangle the
 * photo covers — it is a window onto part of the photo, stored as a transform.
 * Those call sites pass the photo's real drawn size, worked out from that
 * transform, which is why their numbers are not the rectangle's. See the hero.
 *
 * `m` is the phone's placement where it differs, `md:` takes the desktop one.
 */
export function LoomPhoto({
  src,
  w,
  h,
  x = 0,
  y = 0,
  m,
  alt = "",
  className,
}: Placement & {
  src: string;
  /** The 375 screen's placement, when it is not the desktop's. */
  m?: Placement;
  alt?: string;
  className?: string;
}) {
  const p = m ?? { w, h, x, y };
  return (
    // Reference build: the design's own bytes, served from /public at the size
    // they were placed.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={w}
      height={h}
      className={cn(
        "pointer-events-none absolute left-[var(--mx)] top-[var(--my)] h-[var(--mh)] w-[var(--mw)] max-w-none select-none object-cover md:left-[var(--x)] md:top-[var(--y)] md:h-[var(--h)] md:w-[var(--w)]",
        className
      )}
      style={px({ w, h, x, y, mw: p.w, mh: p.h, mx: p.x ?? 0, my: p.y ?? 0 })}
    />
  );
}

/** The diagonal arrow in the corner of the lower hero cards, 50 across. */
export function LoomArrow({ className }: { className?: string }) {
  return <LoomArrowShortRight className={cn("h-[calc(50*var(--u))] w-[calc(50*var(--u))] shrink-0", className)} />;
}

/**
 * The favourite button on a product card: a 40px circle, inset 20 from the
 * card's top-right on desktop and 8 on the phone.
 *
 * It never draws smaller than 32px, which is still a tap target, and it sits
 * above the card's whole-card link (`z-[1]`) so pressing the heart favourites
 * the product instead of opening it.
 *
 * Inactive is `#121212` at twenty per cent — translucent ink over the
 * photograph, not a grey — and active is the kit's one accent, `#f15353`,
 * which appears nowhere else in the design.
 */
export function LoomLove({ active = false }: { active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      className={cn(
        "absolute right-[calc(8*var(--u))] top-[calc(8*var(--u))] z-[1] flex h-[max(calc(40*var(--u)),32px)] w-[max(calc(40*var(--u)),32px)] items-center justify-center rounded-full text-white md:right-[calc(20*var(--u))] md:top-[calc(20*var(--u))]",
        active ? "bg-[#f15353]" : "bg-[#121212]/20"
      )}
    >
      <LoomHeartOutline className="h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)]" />
    </button>
  );
}

/**
 * A row that scrolls sideways on the phone and is an ordinary row on desktop.
 *
 * The 375 screen lets two things run off its right edge — the hero's pair of
 * category cards and the Trending chips. Figma shows them cut by the frame;
 * on a phone that is a row you swipe. The scroller spans the full screen
 * (`-mx` undoes the section's 16px gutter, `px` puts it back as padding) so
 * the cut falls at the screen's edge, where the file draws it, and not 16px
 * short of it. Past 450px the phone design is a centred column, and the row
 * reaches past the column's margin too — `(100cqw - 375u) / 2` — so it still
 * runs to the edge of the screen rather than stopping in mid-air.
 */
export function LoomSwipeRow({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
  "data-m"?: string;
}) {
  return (
    <div
      data-m={props["data-m"]}
      className={cn(
        "-mx-[calc((100cqw-375*var(--u))/2+16*var(--u))] flex overflow-x-auto px-[calc((100cqw-375*var(--u))/2+16*var(--u))] [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A section's top rule — 1px of black at ten per cent, with 32 or 40 of
 * padding above the heading.
 *
 * It is a single top border in the file, not a box: the frames carry
 * `borderStrokeWeightsIndependent` with only `borderTopWeight` set. Reading
 * "stroke: 1px" and drawing four edges is the mistake this exists to avoid.
 *
 * And it is drawn as an inset shadow, not a `border-top`, because the stroke
 * is `INSIDE`: in Figma an inside stroke is painted over the frame and takes
 * no room, so a 210px section is 210px with its rule. A CSS border adds its
 * pixel to the height, and three sections each came out 1px tall, which
 * pushed everything under them down by the sum.
 */
export const LOOM_RULE = "shadow-[inset_0_1px_0_rgba(0,0,0,0.1)]";

/** The same rule along the bottom edge — the phone hero's last block has it. */
export const LOOM_RULE_BOTTOM = "shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]";
