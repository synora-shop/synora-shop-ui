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

const START = [
  { n: "01", title: "Pick a name", body: "Your shop is live on its free address straight away." },
  { n: "02", title: "Add your products", body: "Or bring the whole catalogue over from Shopify." },
  { n: "03", title: "Connect your domain", body: "Whenever you're ready. Not before." },
];

const COMPARISON = [
  { them: "Editing a live theme and hoping", us: "See the real page as you change it" },
  { them: "Deletes that quietly break other pages", us: "Warned first, undone after" },
  { them: "Paying per app to finish the basics", us: "The basics are the product" },
  { them: "Staff accounts behind a higher plan", us: "Your team, from day one" },
  { them: "Domain setup that ends in a support chat", us: "Two copy-pastes, checked while you wait" },
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

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-14 sm:pb-20 sm:pt-20">
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
            <div className="flex gap-4">
              <Glass hue={IRIS} label="Your catalogue">
                <Layers hue={IRIS} />
              </Glass>
              <Glass hue={SKY} label="Your shop">
                <Orb hue={SKY} />
              </Glass>
              <Glass hue={MINT} label="Your orders">
                <Parcel hue={MINT} />
              </Glass>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== groups
          The blend. The dark does not stop at a line — the light section opens
          with a tall band that starts at the hero's exact colour and arrives at
          its own, so the two are one continuous surface. Content begins below
          the band. */}
      <section className="relative bg-surface">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64"
          style={{
            background:
              "linear-gradient(to bottom, #0c0c1e 0%, rgba(12,12,74,0.82) 20%, rgba(80,80,234,0.22) 48%, rgba(183,185,255,0.14) 70%, rgba(255,255,255,0) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-40 sm:pb-28 sm:pt-48">
          <p className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-3 py-1 text-[11px] font-medium uppercase tracking-[0.09em] text-ink-soft">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            What you get
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] lg:items-end">
            <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-ink sm:text-5xl">
              Everything a shop needs.
              <br className="hidden sm:block" />{" "}
              <span className="text-brand-500">Nothing sold separately.</span>
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft lg:pb-2">
              No marketplace to shop in before your shop works. This is the first day, on the free
              address.
            </p>
          </div>

          {/* Each card carries a drawing of the thing it describes. A list of
              ticks tells you a feature exists; a picture of the screen tells you
              what it will feel like, which is the question somebody choosing a
              platform is actually asking. */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Card kicker="Your products" title="However you sell it" art={<ArtProducts />} tint={IRIS}>
              <Point>Sizes and colours, each with its own stock</Point>
              <Point>Bulk orders with tiered prices</Point>
              <Point>Made-to-order pieces that take enquiries</Point>
              <Point>Your profit on every item, as you price it</Point>
            </Card>

            <Card kicker="Your orders" title="Know where everything is" art={<ArtOrders />} tint={MINT}>
              <Point>Every order from new to delivered</Point>
              <Point>Your phone buzzes the moment one lands</Point>
              <Point>Quotes tracked until they&rsquo;re won</Point>
              <Point>Customers, and what they&rsquo;ve spent</Point>
            </Card>

            <Card kicker="Your shop" title={<>Build it while it&rsquo;s open</>} art={<ArtBuilder />} tint={SKY}>
              <Point>Thirty-four blocks — sliders, galleries, reviews</Point>
              <Point>Watch the real page change as you type</Point>
              <Point>Try a new look before anyone sees it</Point>
              <Point>Your own fonts and colours</Point>
            </Card>

            <Card kicker="Your address" title="Be easy to find" art={<ArtDomain />} tint={SKY}>
              <Point>A free web address the day you sign up</Point>
              <Point>Use the domain you already own</Point>
              <Point>One address people find you at</Point>
              <Point>Old links keep working</Point>
            </Card>

            <Card kicker="Your money" title="Paid the way your customers pay" art={<ArtMoney />} tint={MINT}>
              <Point>Cash on delivery, bank transfer, card</Point>
              <Point>JazzCash and Easypaisa</Point>
              <Point>Straight into your bank, never ours</Point>
              <Point>Never ship against a payment that failed</Point>
            </Card>

            <Card kicker="Your team" title="Bring in help safely" art={<ArtTeam />} tint={IRIS}>
              <Point>Give each person only what they need</Point>
              <Point>Your packer sees orders, not your takings</Point>
              <Point>Sign everyone out of a lost phone at once</Point>
            </Card>
          </div>
        </div>
      </section>

      {/* =============================================================== start */}
      <section className="relative bg-surface pb-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="overflow-hidden rounded-3xl border border-border">
            <div className="grid sm:grid-cols-3">
              {START.map(({ n, title, body }, i) => (
                <div
                  key={n}
                  className={`group relative px-7 py-9 transition-colors hover:bg-brand-50 ${
                    i > 0 ? "sm:border-l sm:border-border" : ""
                  } ${i > 0 ? "border-t border-border sm:border-t-0" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tracking-widest text-brand-500">{n}</span>
                    <span className="h-px flex-1 bg-border transition-colors group-hover:bg-brand-300" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
                </div>
              ))}
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
        {/* The other seam, blended the same way: the light above arrives here
            rather than stopping at a line. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{
            background:
              "linear-gradient(to bottom, #ffffff 0%, rgba(240,240,245,0.55) 30%, rgba(23,23,58,0.35) 68%, rgba(12,12,30,0) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-32 sm:pb-28 sm:pt-40">
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

/* -------------------------------------------------------------------------- */
/* The drawings                                                               */
/*                                                                            */
/* Each is the shape of a screen that exists, drawn in divs so it stays sharp  */
/* at any density, costs nothing to load, and follows the product. Every one   */
/* has something that moves under the cursor.                                 */
/* -------------------------------------------------------------------------- */

const BAR = "rounded-full bg-ink/15";
const CHIP = "rounded-md border border-border bg-surface";

/** A product with its sizes and colours. */
function ArtProducts() {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <span className="h-10 w-10 rounded-lg bg-ink/15" />
        <span className="flex-1 space-y-1.5">
          <span className={`block h-1.5 w-24 ${BAR}`} />
          <span className={`block h-1.5 w-14 ${BAR}`} />
        </span>
        <span className="rounded-pill bg-brand-500/15 px-2 py-0.5 text-[9px] font-medium text-brand-600">
          Rs 5,500
        </span>
      </div>
      <div className="flex gap-1.5">
        {["S", "M", "L", "XL"].map((s, i) => (
          <span
            key={s}
            className={`${CHIP} px-2 py-0.5 text-[9px] text-ink-soft transition-all duration-200 ${
              i === 1 ? "border-brand-500 text-brand-600" : ""
            } group-hover:delay-[var(--d)]`}
            style={{ "--d": `${i * 40}ms` } as React.CSSProperties}
          >
            {s}
          </span>
        ))}
        <span className="ml-1 flex gap-1">
          <span className="h-4 w-4 rounded-full bg-brand-500 ring-2 ring-brand-500/25" />
          <span className="h-4 w-4 rounded-full bg-ink/25" />
          <span className="h-4 w-4 rounded-full bg-ink/10" />
        </span>
      </div>
    </div>
  );
}

/** An order moving along, and the step it is on. */
function ArtOrders() {
  const steps = ["New", "Packed", "Sent"];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <span key={s} className="flex flex-1 items-center gap-1.5">
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full transition-colors duration-300 ${
                i === 0 ? "bg-brand-500" : "bg-ink/20 group-hover:bg-brand-500"
              }`}
              style={{ transitionDelay: `${i * 110}ms` }}
            />
            {i < steps.length - 1 && (
              <span
                className="h-px flex-1 origin-left bg-ink/15 transition-colors duration-300 group-hover:bg-brand-300"
                style={{ transitionDelay: `${i * 110}ms` }}
              />
            )}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        {steps.map((s) => (
          <span key={s} className="flex-1 text-[9px] text-ink-faint">
            {s}
          </span>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface px-2.5 py-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          <span className={`h-1.5 w-20 ${BAR}`} />
          <span className={`ml-auto h-1.5 w-8 ${BAR}`} />
        </div>
      </div>
    </div>
  );
}

/** Blocks stacking into a page. */
function ArtBuilder() {
  return (
    <div className="space-y-1.5">
      <span className="block h-8 rounded-md bg-brand-500/20 transition-all duration-200 group-hover:bg-brand-500/30" />
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-8 rounded-md bg-ink/10 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-ink/[0.16]"
            style={{ transitionDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <span className="block h-4 w-2/3 rounded-md bg-ink/10" />
    </div>
  );
}

/** The domain, going live. */
function ArtDomain() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-ink">yourshop.com</span>
        <span className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-1.5 py-0.5 text-[9px] text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-amber transition-colors duration-300 group-hover:bg-green" />
          <span className="group-hover:hidden">checking</span>
          <span className="hidden group-hover:inline">live</span>
        </span>
      </div>
      <div className="space-y-1.5">
        {[
          ["TXT", "_synora-verify"],
          ["A", "216.198.79.1"],
        ].map(([type, value]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-7 flex-shrink-0 text-[9px] text-ink-faint">{type}</span>
            <code className="flex-1 truncate rounded bg-ink/[0.06] px-1.5 py-1 font-mono text-[9px] text-ink-soft">
              {value}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The ways a customer can pay. */
function ArtMoney() {
  const ways = ["Cash", "Card", "JazzCash", "Easypaisa", "Bank"];
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {ways.map((w, i) => (
          <span
            key={w}
            className={`${CHIP} px-2 py-1 text-[9px] text-ink-soft transition-all duration-300 group-hover:border-brand-300 group-hover:text-brand-600`}
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            {w}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2">
        <span className="text-[9px] text-ink-faint">Your bank</span>
        <span className="ml-auto text-[11px] font-semibold text-ink">Rs 24,900</span>
      </div>
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

function Glass({
  hue,
  label,
  children,
}: {
  hue: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="grid h-[112px] w-[112px] flex-shrink-0 place-items-center rounded-[26px] backdrop-blur-md transition-transform duration-300 hover:-translate-y-1.5 sm:h-[140px] sm:w-[140px]"
      style={{
        background: `linear-gradient(148deg, rgba(${hue},0.40) 0%, rgba(${hue},0.12) 46%, rgba(${hue},0.22) 100%)`,
        border: `1px solid rgba(${hue},0.58)`,
        boxShadow: `0 0 64px rgba(${hue},0.38), 0 0 22px rgba(${hue},0.28), 0 18px 44px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -24px 48px rgba(${hue},0.12)`,
      }}
    >
      {children}
    </div>
  );
}

/* The objects. Soft-shaded SVG rather than flat icons — the reference's tiles
   each hold a rounded, lit thing, and that is most of why they read as glass
   instead of as a coloured box. */

/** A stack of plates: the catalogue, and the blocks a page is built from. */
function Layers({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-[58px] w-[58px] sm:h-[70px] sm:w-[70px]" aria-hidden>
      <defs>
        <linearGradient id="lyTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={`rgb(${hue})`} />
        </linearGradient>
        <linearGradient id="lyMid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`rgba(${hue},0.95)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.55)`} />
        </linearGradient>
        <linearGradient id="lyLow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`rgba(${hue},0.6)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.28)`} />
        </linearGradient>
      </defs>
      <g>
        <path d="M60 74 L102 92 L60 110 L18 92 Z" fill="url(#lyLow)" />
        <path d="M60 50 L102 68 L60 86 L18 68 Z" fill="url(#lyMid)" />
        <path d="M60 26 L102 44 L60 62 L18 44 Z" fill="url(#lyTop)" />
      </g>
    </svg>
  );
}

/** A lit sphere: the shop itself, out in the world. */
function Orb({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-[56px] w-[56px] sm:h-[66px] sm:w-[66px]" aria-hidden>
      <defs>
        <radialGradient id="orbBody" cx="35%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor={`rgba(${hue},0.98)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.42)`} />
        </radialGradient>
        <radialGradient id="orbSpec" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="42" fill="url(#orbBody)" />
      <ellipse cx="45" cy="41" rx="15" ry="11" fill="url(#orbSpec)" />
      <path
        d="M60 18a42 42 0 0 1 0 84"
        fill="none"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** A parcel: an order, on its way. */
function Parcel({ hue }: { hue: string }) {
  return (
    <svg viewBox="0 0 120 120" className="h-[58px] w-[58px] sm:h-[70px] sm:w-[70px]" aria-hidden>
      <defs>
        <linearGradient id="pcTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={`rgba(${hue},0.85)`} />
        </linearGradient>
        <linearGradient id="pcLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${hue},0.88)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.48)`} />
        </linearGradient>
        <linearGradient id="pcRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgba(${hue},0.62)`} />
          <stop offset="100%" stopColor={`rgba(${hue},0.30)`} />
        </linearGradient>
      </defs>
      <path d="M60 22 L100 44 L60 66 L20 44 Z" fill="url(#pcTop)" />
      <path d="M20 44 L60 66 L60 106 L20 84 Z" fill="url(#pcLeft)" />
      <path d="M100 44 L60 66 L60 106 L100 84 Z" fill="url(#pcRight)" />
      <path d="M60 66 L60 106" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
    </svg>
  );
}
