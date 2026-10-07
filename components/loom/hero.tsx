import { cn } from "@/lib/utils";
import {
  LOOM_RULE_BOTTOM,
  LoomArrow,
  LoomButton,
  LoomCard,
  LoomCover,
  LoomLines,
  LoomPhoto,
  LoomSwipeRow,
} from "@/components/loom/primitives";
import { on, href, str, type LoomContext } from "@/components/loom/contract";
import { KIT } from "@/components/loom/sections/home.schema";


/**
 * Hero — 1440x1192 on desktop, 375x1253 on the phone, two content bands.
 *
 * Desktop band one is a 958x770 card beside a 352 column of two 380s, 10
 * apart. Band two is 380 tall: a 411 copy block, then two wide cards. Radius 40
 * throughout, and the 10px gutter is the only gap in the whole section.
 *
 * The phone keeps band one's three cards and drops band two's two: a 343x656
 * card, then the two category cards as a 211x189 pair that runs off the right
 * edge — a row to swipe — then the Casual Inspirations copy on its own, closed
 * by a hairline that is the only separator before Trending. Radius 24.
 *
 * The headline is the kit's Display 1 and the one thing that cannot be
 * approximated: 90/75 at **-5px** tracking in **Regular** (56/56 on the phone,
 * still -5). At Medium, or at normal tracking, this stops being Loom and
 * becomes a generic hero. The second band drops to 65/65 at -4, the card
 * captions to 40/40 at -3 — the display scale tightens as it shrinks, which is
 * the whole system.
 */
export function LoomHero({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const main = str(data, "image");
  const c1 = str(data, "card1Image");
  const c2 = str(data, "card2Image");
  const w1 = str(data, "wide1Image");
  const w2 = str(data, "wide2Image");
  return (
    <section className="flex flex-col md:gap-[calc(10*var(--u))] md:pb-[calc(32*var(--u))]">
      {/* Band 1 — 1440x770; on the phone 375x893 */}
      <div
        data-m="hero-band-1"
        className="flex flex-col gap-[calc(8*var(--u))] px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:h-[calc(770*var(--u))] md:flex-row md:items-center md:gap-[calc(10*var(--u))] md:px-[calc(60*var(--u))] md:pb-0"
      >
        <LoomCard data-m="hero-card" className="h-[calc(656*var(--u))] w-full rounded-[calc(24*var(--u))] md:h-[calc(770*var(--u))] md:w-[calc(958*var(--u))] md:rounded-[calc(40*var(--u))]">
          {/* Two copies of one photograph, the second laid over the first —
              the file's own construction, and on the phone the first is a
              crop rather than a fill: a 343-wide window onto a 1831-wide
              drawing of the photo, worked out from the paint's transform. */}
          {main === KIT.summer ? (
            <>
          <LoomPhoto src={KIT.summer} w={1155} h={770} m={{ w: 1831.32, h: 1163.95, x: -190.56, y: -93.46 }} />
          {/* On the phone the second copy starts 359 down, over a backdrop that is
              the first copy enlarged five times — and where a sharp photo meets
              its own blurred enlargement the file draws a hard line across the
              green. A 40px fade on its top edge is the one departure from the
              file in this build, made on purpose: the composition and every
              number are the file's, only the seam is gone. */}
          <LoomPhoto
            src={KIT.summer}
            w={1155}
            h={770}
            x={70}
            m={{ w: 546, h: 364, x: -76, y: 359 }}
            className="[mask-image:linear-gradient(to_bottom,transparent,black_calc(40*var(--u)))] md:[mask-image:none]"
          />
            </>
          ) : (
            <LoomCover src={main} />
          )}
          <div
            data-m="hero-title"
            className="absolute left-[calc(24*var(--u))] top-[calc(24*var(--u))] flex w-[calc(279*var(--u))] flex-col gap-[calc(32*var(--u))] md:left-[calc(60*var(--u))] md:top-[calc(60*var(--u))] md:w-[calc(328*var(--u))] md:gap-[calc(28*var(--u))]"
          >
            <div className="flex flex-col gap-[calc(20*var(--u))]">
              <h1
                data-m="hero-headline"
                className="w-[calc(252*var(--u))] text-[calc(56*var(--u))] font-normal leading-[calc(56*var(--u))] tracking-[calc(-5*var(--u))] text-white md:w-auto md:text-[calc(90*var(--u))] md:leading-[calc(75*var(--u))]"
              >
                <LoomLines text={str(data, "headline")} />
              </h1>
              {str(data, "text") && <p
                data-m="hero-body"
                className="text-[max(calc(16*var(--u)),12.8px)] font-normal leading-[max(calc(26*var(--u)),20.8px)] tracking-[calc(-0.3*var(--u))] text-white/80 md:text-[max(calc(18*var(--u)),14.4px)]"
              >
                {str(data, "text")}
              </p>}
            </div>
            {str(data, "buttonLabel") && (
              <LoomButton data-m="hero-cta" href={href(data, "buttonLink", ctx)} className="min-w-[calc(279*var(--u))] md:min-w-[calc(280*var(--u))]">
                {str(data, "buttonLabel")}
              </LoomButton>
            )}
          </div>
        </LoomCard>

        {on(data, "showCards") && <LoomSwipeRow
          data-m="hero-photos"
          className="gap-[calc(8*var(--u))] md:h-[calc(770*var(--u))] md:w-[calc(352*var(--u))] md:flex-col md:gap-[calc(10*var(--u))]"
        >
          <a href={href(data, "card1Link", ctx)} className="contents">
            <LoomCard className={CATEGORY_CARD}>
              {c1 === KIT.outdoor ? (
                <LoomPhoto src={c1} w={644} h={405} x={-107} y={-24} m={{ w: 321, h: 224, x: -23, y: 0 }} />
              ) : (
                <LoomCover src={c1} />
              )}
              <p data-m="hero-category" className={CATEGORY_CAPTION}>
                <LoomLines text={str(data, "card1Caption")} />
              </p>
            </LoomCard>
          </a>
          <a href={href(data, "card2Link", ctx)} className="contents">
            <LoomCard className={CATEGORY_CARD}>
              {c2 === KIT.casual ? (
                <LoomPhoto src={c2} w={845} h={565} x={-192} y={-98} m={{ w: 329, h: 280, x: -19, y: -14 }} />
              ) : (
                <LoomCover src={c2} />
              )}
              <p className={CATEGORY_CAPTION}>
                <LoomLines text={str(data, "card2Caption")} />
              </p>
            </LoomCard>
          </a>
        </LoomSwipeRow>}
      </div>

      {/* Band 2 — 1440x380. The copy column is 411 wide including its own 60
          of left padding, which is what lines its text up with the gutter
          above it while the cards beside it run to the page edge. On the
          phone it is the copy alone, 343x360, centred, with 40 under it and
          the hairline under that. */}
      {on(data, "showInspiration") && <div data-m="hero-band-2" className="flex flex-col md:min-h-[calc(380*var(--u))] md:flex-row md:items-center">
        <div
          data-m="hero-copy"
          className={cn(
            "mx-[calc(16*var(--u))] flex min-h-[calc(360*var(--u))] shrink-0 flex-col justify-center gap-[calc(42*var(--u))] pb-[calc(40*var(--u))]",
            LOOM_RULE_BOTTOM,
            "md:mx-0 md:min-h-[calc(380*var(--u))] md:w-[calc(411*var(--u))] md:pb-0 md:pl-[calc(60*var(--u))] md:shadow-none"
          )}
        >
          <div className="flex w-full flex-col gap-[calc(20*var(--u))] md:w-[calc(311*var(--u))] md:gap-[calc(24*var(--u))]">
            <h2 data-m="hero-sub-headline" className="text-[calc(65*var(--u))] font-normal leading-[calc(65*var(--u))] tracking-[calc(-4*var(--u))] text-[#121212]">
              <LoomLines text={str(data, "inspirationHeading")} />
            </h2>
            <p className="text-[max(calc(18*var(--u)),14.4px)] font-normal leading-[max(calc(26*var(--u)),20.8px)] tracking-[calc(-0.3*var(--u))] text-[#121212]/80">
              {str(data, "inspirationText")}
            </p>
          </div>
          {str(data, "inspirationButtonLabel") && (
            <LoomButton variant="outline" href={href(data, "inspirationButtonLink", ctx)}>
              {str(data, "inspirationButtonLabel")}
            </LoomButton>
          )}
        </div>

        {/* Not on the phone screen at all. */}
        <div className="hidden h-[calc(380*var(--u))] w-[calc(969*var(--u))] items-center gap-[calc(10*var(--u))] md:flex">
          {/* Both photographs are crops, not fills: the file stores a window
              onto the photo — the shirt shows its top 88%, the funky photo its
              top 67% — and the rectangle is that window, not the photo. Drawn
              at the rectangle's size they were squashed 12% and 33%. Drawn at
              the photo's own proportions, with the card clipping it, they are
              what the file shows. */}
          <a href={href(data, "wide1Link", ctx)} className="contents">
            <LoomCard data-m="hero-wide-1" className="h-[calc(380*var(--u))] w-[calc(479*var(--u))]">
              {w1 === KIT.shirt ? <LoomPhoto src={w1} w={480} h={429.86} /> : <LoomCover src={w1} />}
              <HeroCardCaption text={str(data, "wide1Caption")} />
            </LoomCard>
          </a>
          <a href={href(data, "wide2Link", ctx)} className="contents">
            <LoomCard data-m="hero-wide-2" className="h-[calc(380*var(--u))] w-[calc(480*var(--u))]">
              {w2 === KIT.funky ? <LoomPhoto src={w2} w={480} h={720} y={-104} /> : <LoomCover src={w2} />}
              <HeroCardCaption text={str(data, "wide2Caption")} />
            </LoomCard>
          </a>
        </div>
      </div>}
    </section>
  );
}

const CATEGORY_CARD = "h-[calc(189*var(--u))] w-[calc(211*var(--u))] rounded-[calc(24*var(--u))] md:h-[calc(380*var(--u))] md:w-[calc(352*var(--u))] md:rounded-[calc(40*var(--u))]";

const CATEGORY_CAPTION =
  "absolute left-[calc(24*var(--u))] top-[calc(24*var(--u))] w-[calc(107*var(--u))] text-[calc(32*var(--u))] font-normal leading-[max(calc(32*var(--u)),25.6px)] tracking-[calc(-3*var(--u))] text-[#121212] md:left-[calc(30*var(--u))] md:top-[calc(30*var(--u))] md:w-[calc(138*var(--u))] md:text-[calc(40*var(--u))] md:leading-[calc(40*var(--u))]";

/**
 * Caption and arrow, 420x80 at (30, 270) — so 30 from the card's bottom-left.
 * The arrow is bottom-aligned against an 80px two-line caption, and its own
 * glyph is the kit's diagonal `arrow / short_right`, rotated 45 degrees in
 * the file rather than being a separate icon.
 */
function HeroCardCaption({ text }: { text: string }) {
  return (
    <div className="absolute bottom-[calc(30*var(--u))] left-[calc(30*var(--u))] flex h-[calc(80*var(--u))] w-[calc(420*var(--u))] items-end text-white">
      <p data-m="hero-caption" className="w-[calc(225*var(--u))] text-[calc(40*var(--u))] font-normal leading-[calc(40*var(--u))] tracking-[calc(-3*var(--u))]">
        <LoomLines text={text} />
      </p>
      <LoomArrow className="ml-auto" />
    </div>
  );
}
