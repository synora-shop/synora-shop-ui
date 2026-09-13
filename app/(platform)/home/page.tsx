import type { Metadata } from "next";
import { appUrl } from "@/lib/shop-context";
import { ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The front door.
 *
 * Copy rule for this file: say what a shop owner gets, in the words they would
 * use, and stop. Not how it works. An earlier version explained that stock is
 * held while a payment is in flight and that credentials are sealed before
 * storage — true, and nobody selling clothes has ever wanted to know it. If a
 * line could appear in ARCHITECTURE.md it does not belong here.
 *
 * Rhythm: dark, light, dark. The hero states it, the middle shows it, and the
 * close argues it and asks. Each band bleeds into the next rather than meeting
 * it on a line.
 */

const COMPARISON = [
  { them: "Paying per app to finish the basics", us: "The basics are the product" },
  { them: "A theme that costs more than the platform", us: "Every theme included, all of them" },
  { them: "A paid add-on just for a WhatsApp button", us: "Chat buttons for any app, free" },
  { them: "Choosing a plan before you know what you need", us: "One price. Get on with selling" },
  { them: "The same dashboard whatever you sell", us: "A panel shaped to your business" },
];

export default function PlatformHome() {
  return (
    <>
      {/* ================================================================ hero */}
      <section className="relative isolate overflow-hidden bg-night">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-1/3 h-[130%]"
          style={{
            background:
              "radial-gradient(78% 70% at 10% 18%, rgba(80,80,234,0.52) 0%, rgba(12,12,74,0.78) 34%, rgba(12,12,74,0.36) 58%, rgba(12,12,74,0) 80%), radial-gradient(50% 45% at 88% 8%, rgba(183,185,255,0.14) 0%, rgba(183,185,255,0) 70%)",
          }}
        />

        <div className="relative mx-auto max-w-[78rem] px-5 pb-16 pt-28 sm:pb-20 sm:pt-32">
          <p className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
            Open a shop today. Use your own domain this afternoon.
          </p>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
            <h1 className="text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Sell online.
              <br />
              <span className="text-brand-300">Without the</span>
              <br />
              expensive mistakes.
            </h1>

            <div className="lg:pb-3">
              <p className="max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
                Products, orders, pages, your own domain and your team — in one place, and none of
                it sold back to you as an add-on.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href={appUrl("/merchant/signup")}
                  className="inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-medium text-night transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night"
                >
                  Create your shop
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={appUrl("/merchant/login")}
                  className="inline-flex items-center gap-2 rounded-pill border border-white/20 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  I already have one
                </a>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-8 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-white/60">
              No card to start. Your free address works the moment you sign up.
            </p>
            <a
              href="#showcase"
              className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              See what it actually does
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================== groups
          The blend. The dark does not stop at a line — the light section opens
          with a tall band that starts at the hero's exact colour and arrives at
          its own, so the two are one continuous surface. Content begins below
          the band. */}
      {/* A block, not a blend.
          
          Two flat colours fading into each other over 250px is a smear however
          it is tuned — and the fade was doing the work a corner does better.
          The light half is a rounded panel sitting on the dark ground now, so
          the two sections are plainly two things. */}
      <section className="px-4 pt-16 sm:px-6 sm:pt-20">
        <div className="mx-auto max-w-[78rem] rounded-[2rem] bg-surface px-6 pb-20 pt-16 sm:px-10 sm:pb-24 sm:pt-20">
          <p className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.09em] text-ink-soft">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            What makes it different
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] lg:items-end">
            <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-ink sm:text-5xl">
              The parts that usually
              <br className="hidden sm:block" />{" "}
              <span className="text-brand-500">cost extra, or go missing.</span>
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft lg:pb-2">
              Every platform lists products and takes payments — saying so would tell you nothing.
              These are the parts that are normally an upgrade, an add-on, or simply absent.
            </p>
          </div>

          {/* Four, not six. The six before were sizes and colours, order
              statuses, a page builder, a free subdomain and a list of payment
              methods — every one of which every platform has, so naming them
              said nothing except that we have caught up. These are the ones a
              merchant cannot get by going somewhere else. */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            <Card
              kicker="Before, not after"
              title="It argues with you while there is still time"
              art={<ArtWarns />}
              tint={IRIS}
            >
              <Point>Tells you what a delete will break, before it breaks</Point>
              <Point>Deleted things wait in a bin, not a void</Point>
              <Point>Nothing reaches your customers until you publish it</Point>
            </Card>

            <Card
              kicker="Your team"
              title="Bring in help without handing over the keys"
              art={<ArtTeam />}
              tint={SKY}
            >
              <Point>Give each person only what they need</Point>
              <Point>Your packer sees orders, not your takings</Point>
              <Point>Sign everyone out of a lost phone at once</Point>
            </Card>

            <Card
              kicker="Talking to customers"
              title="Chat buttons that cost nothing"
              art={<ArtChat />}
              tint={MINT}
            >
              <Point>WhatsApp, a call, an email, any link at all</Point>
              <Point>Your own icon, colour and opening message</Point>
              <Point>Choose the pages each one shows on</Point>
            </Card>

            <Card
              kicker="No lock-in"
              title="Leave whenever you like"
              art={<ArtPortable />}
              tint={IRIS}
            >
              <Point>Your catalogue leaves as a Shopify CSV</Point>
              <Point>And loads back in the same way, column for column</Point>
              <Point>Customers and orders come with it</Point>
            </Card>
          </div>
        </div>
      </section>

      {/* ============================================================ showcase
          The tiles, doing a job. They were decoration in the hero rail, which
          is a strip with nowhere to put what a tile might reveal. Here they
          are the control for the panel beneath them. */}
      <section id="showcase" className="px-4 pt-14 sm:px-6 sm:pt-16">
        <div className="showcase relative mx-auto max-w-[78rem]">
          <input type="radio" name="sc" id="sc-a" defaultChecked className="sr-only" />
          <input type="radio" name="sc" id="sc-b" className="sr-only" />
          <input type="radio" name="sc" id="sc-c" className="sr-only" />

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] px-6 py-10 sm:px-10 sm:py-12">
            <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-7">
              <Tile id="sc-a" tile="a" hue={IRIS} caption="Shaped to your business">
                <Storefront hue={IRIS} />
              </Tile>
              <Tile id="sc-b" tile="b" hue={SKY} caption="Themes, all included">
                <Swatches hue={SKY} />
              </Tile>
              <Tile id="sc-c" tile="c" hue={MINT} caption="Find any change">
                <Finder hue={MINT} />
              </Tile>
            </div>

            <div className="mt-10 border-t border-white/10 pt-9">
              <Panel
                id="a"
                title="Tell it what you sell, and the panel follows"
                body="A fine-dining room, a portfolio of work, a rail of clothes — they do not need the same screens. You pick what you run when you sign up, and the dashboard arrives shaped for it instead of making you ignore half of it."
              >
                <div className="flex flex-wrap gap-2.5">
                  {[
                    ["Products to sell", true],
                    ["A restaurant", false],
                    ["A portfolio", false],
                  ].map(([label, live]) => (
                    <span
                      key={label as string}
                      className={`rounded-pill border px-3.5 py-1.5 text-sm ${
                        live
                          ? "border-white/40 bg-white/10 text-white"
                          : "border-white/15 text-white/45"
                      }`}
                    >
                      {label as string}
                      {!live && <span className="ml-2 text-[11px] text-white/35">soon</span>}
                    </span>
                  ))}
                </div>
              </Panel>

              <Panel
                id="b"
                title="Every theme, on the one price"
                body="No theme store, no licence, no upgrade to unlock the good one. Each is built with the features already in it, so the only decision you make is which one suits what you sell — not which plan it sits behind."
              >
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {["Aurora", "Atlas"].map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <span className="h-9 w-12 flex-shrink-0 rounded-md bg-white/15" />
                      <span>
                        <span className="block text-sm font-medium text-white">{t}</span>
                        <span className="block text-xs text-white/45">Included</span>
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                id="c"
                title="Changed something and cannot find it? It will take you there"
                body="Turn a setting on and the shop can look identical, because whatever it changed is three screens away or below the fold. Here you press show me where, and it scrolls to the thing, holds a ring around it, and waits. The large platforms leave you hunting."
              >
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/70">Low stock badge</span>
                    <span className="rounded-pill bg-white px-3 py-1 text-xs font-medium text-night">
                      Show me where
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-lg p-2.5 ring-2 ring-brand-300">
                    <span className="h-8 w-8 rounded bg-white/20" />
                    <span className="flex-1 space-y-1.5">
                      <span className="block h-1.5 w-28 rounded-full bg-white/25" />
                      <span className="block h-1.5 w-16 rounded-full bg-white/15" />
                    </span>
                    <span className="rounded-pill bg-brand-300/20 px-2 py-0.5 text-[11px] text-brand-300">
                      Only 3 left
                    </span>
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= close
          The argument and the ask, on one dark surface. They belong together:
          the comparison earns the button directly above it. */}
      <section className="relative isolate overflow-hidden bg-night">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 82% 2%, rgba(80,80,234,0.34) 0%, rgba(12,12,74,0) 65%), radial-gradient(58% 62% at 45% 115%, rgba(80,80,234,0.44) 0%, rgba(12,12,74,0.30) 45%, rgba(12,12,74,0) 75%)",
          }}
        />

        <div className="relative mx-auto max-w-[78rem] px-5 pb-20 pt-24 sm:pb-28 sm:pt-28">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] lg:items-end">
            <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-white sm:text-5xl">
              Coming from
              <br className="hidden sm:block" /> somewhere else
            </h2>
            <p className="text-sm leading-relaxed text-white/60 lg:pb-2">
              The differences you notice in a working week, not the ones on a feature grid.
            </p>
          </div>

          <dl className="mt-12 space-y-px overflow-hidden rounded-2xl">
            {COMPARISON.map((row) => (
              <div
                key={row.us}
                className="grid gap-1 bg-white/[0.04] px-5 py-4 transition-colors hover:bg-white/[0.08] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-8 sm:px-6"
              >
                <dt className="text-sm text-white/35 line-through decoration-white/20">
                  {row.them}
                </dt>
                <dd className="flex gap-2.5 text-[15px] font-medium text-white">
                  <Check className="mt-[3px] h-4 w-4 flex-shrink-0 text-brand-300" />
                  {row.us}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-16 text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-white sm:text-5xl">
              Your shop could be open before dinner
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
              Pick a name and add a few things. Everything else can wait until you want it.
            </p>
            <a
              href={appUrl("/merchant/signup")}
              className="mt-9 inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3.5 text-sm font-medium text-night transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night"
            >
              Create your shop
              <ArrowRight className="h-4 w-4" />
            </a>
            <p className="mt-4 text-xs text-white/45">No card to start.</p>
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Cards                                                                      */
/* -------------------------------------------------------------------------- */

function Card({
  kicker,
  title,
  art,
  tint,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  art: React.ReactNode;
  /** One of the three accents, as "r,g,b". Washed at a few percent. */
  tint: string;
  children: React.ReactNode;
}) {
  return (
    /* group + transform on hover: the whole card lifts, its edge takes the
       accent, and the drawing inside reacts. Done in CSS so this page ships no
       JavaScript to be interactive. */
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-panel">
      <div
        aria-hidden
        className="relative h-32 overflow-hidden border-b border-border px-5 pt-5"
        style={{
          background: `linear-gradient(160deg, rgba(${tint},0.30) 0%, rgba(${tint},0.10) 60%, rgba(${tint},0.04) 100%)`,
        }}
      >
        {art}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-faint">
          {kicker}
        </p>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug text-ink">{title}</h3>
        <ul className="mt-3.5 space-y-1.5">{children}</ul>
      </div>
    </div>
  );
}

function Point({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 text-sm leading-snug text-ink-soft">
      <Check className="mt-[3px] h-3.5 w-3.5 flex-shrink-0 text-brand-500" />
      {children}
    </li>
  );
}

/** A shop front.
 *
 * The label is "shaped to your business", so the object is a business. The
 * first attempt drew the awning as one hand-written path with seven scallops
 * hung off its bottom edge — which came out lopsided, because the scallops
 * were spaced along a straight line while the hem above them curved. The
 * scallops are drawn as real circles on a computed pitch now, and the awning
 * sits on a symmetric arc, so both halves match.
 */
function Storefront({ hue }: { hue: string }) {
  const scallops = 6;
  const left = 22;
  const span = 76;
  const r = span / (scallops * 2);
  return (
    <svg viewBox="0 0 120 120" className="h-[74px] w-[74px] sm:h-[88px] sm:w-[88px]" aria-hidden>
      <defs>
        <linearGradient id="sfAwn" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={`rgba(${hue},0.78)`} />
        </linearGradient>
        <linearGradient id="sfWall" x1="0" y1="0" x2="0.55" y2="1">
          <stop offset="0%" stopColor={`rgba(${hue},0.52)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.22)`} />
        </linearGradient>
        <linearGradient id="sfDoor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={`rgba(${hue},0.62)`} />
        </linearGradient>
      </defs>

      {/* wall, sitting under the awning's shadow line */}
      <rect x={left} y="52" width={span} height="52" rx="5" fill="url(#sfWall)" />

      {/* windows either side of the door, so the wall is not a blank slab */}
      <rect x={left + 7} y="61" width="14" height="12" rx="2.5" fill={`rgba(${hue},0.42)`} />
      <rect x={left + span - 21} y="61" width="14" height="12" rx="2.5" fill={`rgba(${hue},0.42)`} />

      {/* door, centred on the building's own axis */}
      <rect x={left + span / 2 - 10} y="72" width="20" height="32" rx="2.5" fill="url(#sfDoor)" />
      <circle cx={left + span / 2 + 5} cy="89" r="1.6" fill={`rgba(${hue},0.85)`} />

      {/* awning: a flat canopy, with the scallops as real circles on an even
          pitch rather than a freehand wobble */}
      <path d={`M${left - 4} 52 L${left + 2} 34 H${left + span - 2} L${left + span + 4} 52 Z`} fill="url(#sfAwn)" />
      {Array.from({ length: scallops }).map((_, i) => (
        <circle
          key={i}
          cx={left - 4 + r + i * (span + 8) / scallops}
          cy="52"
          r={(span + 8) / scallops / 2}
          fill="url(#sfAwn)"
        />
      ))}
      <rect x={left - 4} y="50" width={span + 8} height="2.5" fill={`rgba(${hue},0.55)`} />
    </svg>
  );
}

/** Three looks, fanned. The label is "themes, all included", so the object is
    a set of them — same shape, different skins, one on top of the other. */
function Swatches({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-[74px] w-[74px] sm:h-[88px] sm:w-[88px]" aria-hidden>
      <defs>
        <linearGradient id="swA" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={`rgba(${hue},0.45)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.18)`} />
        </linearGradient>
        <linearGradient id="swB" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={`rgba(${hue},0.78)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.38)`} />
        </linearGradient>
        <linearGradient id="swC" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={`rgba(${hue},0.62)`} />
        </linearGradient>
      </defs>
      <g transform="rotate(-18 60 64)">
        <rect x="30" y="30" width="60" height="68" rx="8" fill="url(#swA)" />
      </g>
      <g transform="rotate(-7 60 64)">
        <rect x="32" y="28" width="60" height="68" rx="8" fill="url(#swB)" />
      </g>
      <g transform="rotate(8 60 64)">
        <rect x="34" y="26" width="60" height="68" rx="8" fill="url(#swC)" />
        {/* a page, sketched on the top card, so the stack reads as layouts */}
        <rect x="42" y="34" width="44" height="13" rx="3" fill="rgba(12,12,74,0.42)" />
        <rect x="42" y="52" width="20" height="16" rx="3" fill="rgba(12,12,74,0.24)" />
        <rect x="66" y="52" width="20" height="16" rx="3" fill="rgba(12,12,74,0.24)" />
        <rect x="42" y="73" width="34" height="6" rx="3" fill="rgba(12,12,74,0.18)" />
      </g>
    </svg>
  );
}

/** A lens over the thing it found, still ringed. The label is "find any
    change", so the object is the act of finding — and the ring is the same
    one the panel draws when it takes you there. */
function Finder({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-[74px] w-[74px] sm:h-[88px] sm:w-[88px]" aria-hidden>
      <defs>
        <linearGradient id="fdGlass" x1="0.2" y1="0.1" x2="0.8" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor={`rgba(${hue},0.30)`} />
        </linearGradient>
        <linearGradient id="fdRim" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={`rgba(${hue},0.70)`} />
        </linearGradient>
      </defs>
      {/* the thing that was found, underneath, wearing its ring */}
      <rect x="20" y="28" width="58" height="30" rx="7" fill={`rgba(${hue},0.20)`} />
      <rect
        x="20" y="28" width="58" height="30" rx="7"
        fill="none" stroke={`rgba(${hue},0.95)`} strokeWidth="2.5"
      />
      <rect x="28" y="37" width="26" height="4" rx="2" fill={`rgba(${hue},0.75)`} />
      <rect x="28" y="46" width="16" height="4" rx="2" fill={`rgba(${hue},0.45)`} />
      {/* the lens */}
      <circle cx="70" cy="70" r="24" fill="url(#fdGlass)" />
      <circle cx="70" cy="70" r="24" fill="none" stroke="url(#fdRim)" strokeWidth="5" />
      <ellipse cx="62" cy="61" rx="7" ry="5" fill="rgba(255,255,255,0.75)" transform="rotate(-35 62 61)" />
      <path d="M88 88 L100 100" stroke="url(#fdRim)" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* The drawings                                                               */
/*                                                                            */
/* Each is the shape of a screen that exists, drawn in divs so it stays sharp  */
/* at any density, costs nothing to load, and follows the product. Every one   */
/* has something that moves under the cursor.                                 */
/* -------------------------------------------------------------------------- */

const BAR = "rounded-full bg-ink/15";
const CHIP = "rounded-md border border-border bg-surface";

/** The warning you get before a delete takes something with it. */
function ArtWarns() {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <p className="text-[11px] font-semibold text-ink">Delete “Shirts”?</p>
      <p className="mt-1 text-[10px] leading-snug text-ink-soft">
        8 products are in this category. They stay, but lose it.
      </p>
      <div className="mt-2.5 flex gap-1.5">
        <span className="rounded-pill bg-ink px-2.5 py-1 text-[9px] font-medium text-surface">
          Keep it
        </span>
        <span className="rounded-pill border border-border px-2.5 py-1 text-[9px] text-ink-soft transition-colors duration-300 group-hover:border-rose group-hover:text-rose">
          Delete anyway
        </span>
      </div>
    </div>
  );
}

/** The buttons a customer taps to reach you. */
function ArtChat() {
  const dots = [
    { label: "W", tint: "bg-green text-white" },
    { label: "@", tint: "bg-ink/80 text-white" },
    { label: "?", tint: "bg-brand-500 text-white" },
  ];
  return (
    <div className="relative h-full">
      <div className="space-y-1.5">
        <span className="block h-2 w-24 rounded-full bg-ink/10" />
        <span className="block h-2 w-32 rounded-full bg-ink/[0.07]" />
        <span className="block h-2 w-20 rounded-full bg-ink/[0.07]" />
      </div>
      <div className="absolute bottom-0 right-0 flex flex-col items-end gap-1.5">
        {dots.map(({ label, tint }, i) => (
          <span
            key={label}
            className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold shadow-sm transition-transform duration-300 group-hover:-translate-x-0.5 ${tint}`}
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Your catalogue, going out and coming back. */
function ArtPortable() {
  return (
    <div className="space-y-2">
      {[
        ["Export", "products.csv", "→"],
        ["Import", "shopify.csv", "←"],
      ].map(([action, file, arrow]) => (
        <div
          key={action}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2"
        >
          <span className="w-11 flex-shrink-0 text-[9px] text-ink-faint">{action}</span>
          <code className="flex-1 truncate rounded bg-ink/[0.06] px-1.5 py-1 font-mono text-[9px] text-ink-soft">
            {file}
          </code>
          <span className="text-xs text-brand-500 transition-transform duration-300 group-hover:translate-x-0.5">
            {arrow}
          </span>
        </div>
      ))}
      <p className="text-[9px] text-ink-faint">Column for column, both ways.</p>
    </div>
  );
}

/** Who is on the shop, and what each can reach. */
function ArtTeam() {
  const people = [
    { role: "Owner", tone: "bg-brand-500/15 text-brand-600 border-brand-300" },
    { role: "Staff", tone: "" },
    { role: "Viewer", tone: "" },
  ];
  return (
    <div className="space-y-1.5">
      {people.map(({ role, tone }, i) => (
        <div
          key={role}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 transition-transform duration-300 group-hover:translate-x-0.5"
          style={{ transitionDelay: `${i * 70}ms` }}
        >
          <span className="h-4 w-4 rounded-full bg-ink/15" />
          <span className={`h-1.5 w-14 ${BAR}`} />
          <span className={`${CHIP} ml-auto px-1.5 py-0.5 text-[9px] text-ink-soft ${tone}`}>
            {role}
          </span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Glass                                                                      */
/*                                                                            */
/* Synora's accent palette, which is wider than the one the panel uses. The    */
/* panel needs exactly one accent so that #6666ff can mean "selected"; a       */
/* marketing page has no such job for colour and can hold all three.           */
/*                                                                            */
/*   #b7b9ff  iris   the brand's own light                                    */
/*   #c8e7ff  sky                                                             */
/*   #b8efd6  mint                                                            */
/*                                                                            */
/* Each tile is a pane of glass rather than a filled square: a translucent     */
/* wash lit from the top-left, a bright hairline edge, an inner highlight      */
/* along the top, and the hue thrown outward as a glow so the tile sits in     */
/* the dark rather than on top of it.                                         */
/* -------------------------------------------------------------------------- */

const IRIS = "183,185,255";
const SKY = "200,231,255";
const MINT = "184,239,214";

/** A tile that selects a panel. The input is its own, so the label toggles it
    and keyboard focus lands somewhere real. */
function Tile({
  id,
  tile,
  hue,
  caption,
  children,
}: {
  id: string;
  tile: string;
  hue: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer flex-col items-center gap-3">
      <span
        data-tile={tile}
        className="relative grid h-[124px] w-[124px] place-items-center rounded-[30px] backdrop-blur-md transition-all duration-300 sm:h-[152px] sm:w-[152px]"
        style={{
          background: `linear-gradient(148deg, rgba(${hue},0.40) 0%, rgba(${hue},0.12) 46%, rgba(${hue},0.22) 100%)`,
          border: `1px solid rgba(${hue},0.58)`,
          boxShadow: `0 0 64px rgba(${hue},0.38), 0 0 22px rgba(${hue},0.28), 0 18px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -24px 48px rgba(${hue},0.12)`,
        }}
      >
        {children}
      </span>
      <span className="max-w-[152px] text-center text-xs font-medium leading-snug text-white/70">
        {caption}
      </span>
    </label>
  );
}

function Panel({
  id,
  title,
  body,
  children,
}: {
  id: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div data-panel={id} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
      <div>
        <h3 className="text-2xl font-semibold leading-tight text-balance text-white sm:text-3xl">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">{body}</p>
      </div>
      <div className="lg:pt-1">{children}</div>
    </div>
  );
}

/* The objects. Soft-shaded SVG rather than flat icons — the reference's tiles
   each hold a rounded, lit thing, and that is most of why they read as glass
   instead of as a coloured box. */

