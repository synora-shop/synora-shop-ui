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
 * use, and stop. Not how it works. An earlier version of this page explained
 * that stock is held while a payment is in flight and that credentials are
 * sealed before storage — true, and nobody selling clothes has ever wanted to
 * know it. If a line could appear in the architecture document, it does not
 * belong here.
 */

/** What you get. Four words where four words will do. */
const GROUPS: { kicker: string; title: string; points: string[] }[] = [
  {
    kicker: "Your products",
    title: "However you sell it",
    points: [
      "Sizes and colours, each with its own stock",
      "Bulk orders with tiered prices",
      "Made-to-order pieces that take enquiries",
      "Your profit on every item, as you price it",
    ],
  },
  {
    kicker: "Your orders",
    title: "Know where everything is",
    points: [
      "Every order from new to delivered",
      "Your phone buzzes the moment one lands",
      "Quotes tracked until they're won",
      "Customers, and what they've spent",
    ],
  },
  {
    kicker: "Your shop",
    title: "Build it while it's open",
    points: [
      "Thirty-four blocks — sliders, galleries, reviews",
      "Watch the real page change as you type",
      "Try a new look before anyone sees it",
      "Your own fonts and colours",
    ],
  },
  {
    kicker: "Your address",
    title: "Be easy to find",
    points: [
      "A free web address the day you sign up",
      "Use the domain you already own",
      "One address people find you at",
      "Old links keep working",
    ],
  },
  {
    kicker: "Your money",
    title: "Paid the way your customers pay",
    points: [
      "Cash on delivery, bank transfer, card",
      "JazzCash and Easypaisa",
      "Straight into your bank, never ours",
      "Never ship against a payment that failed",
    ],
  },
  {
    kicker: "Your team",
    title: "Bring in help safely",
    points: [
      "Give each person only what they need",
      "Your packer sees orders, not your takings",
      "Sign everyone out of a lost phone at once",
    ],
  },
];

const COMPARISON = [
  { them: "Editing a live theme and hoping", us: "See the real page as you change it" },
  { them: "Deletes that quietly break other pages", us: "Warned first, undone after" },
  { them: "Paying per app to finish the basics", us: "The basics are the product" },
  { them: "Staff accounts behind a higher plan", us: "Your team, from day one" },
  { them: "Domain setup that ends in a support chat", us: "Two copy-pastes, checked while you wait" },
];

const START = [
  { n: "01", title: "Pick a name", body: "Your shop is live on its free address straight away." },
  { n: "02", title: "Add your products", body: "Or bring the whole catalogue over from Shopify." },
  { n: "03", title: "Connect your domain", body: "Whenever you're ready. Not before." },
];

export default function PlatformHome() {
  return (
    <>
      {/* ================================================================ hero
          Dark, with one soft pool of the brand colour behind the headline.
          A single hue at low opacity: it lights the type rather than competing
          with it, which is the job the reference's three stacked purple-to-pink
          ramps were trying and failing to do. */}
      <section className="relative isolate overflow-hidden bg-night">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-1/3 h-[130%]"
          style={{
            background:
              "radial-gradient(75% 65% at 12% 22%, rgba(102,102,255,0.55) 0%, rgba(102,102,255,0.22) 38%, rgba(102,102,255,0.04) 62%, rgba(102,102,255,0) 78%)",
          }}
        />
        {/* The glow spills over the edge into the section below, so the two do
            not meet on a hard line. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(to bottom, rgba(102,102,255,0) 0%, rgba(102,102,255,0.28) 100%)" }}
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
                  className="inline-flex items-center gap-2 rounded-pill bg-white px-5 py-3 text-sm font-medium text-night transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night"
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

          {/* The rail under the hero: a promise on the left, and three
              miniatures of the real screens on the right. The reference put
              stock photography and a star rating here. These are the product. */}
          <div className="mt-14 flex flex-col gap-8 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-white/60">
              No card to start. Your free address works the moment you sign up.
            </p>
            <div className="flex gap-3">
              <MiniCatalogue />
              <MiniBuilder />
              <MiniShop />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== groups */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="inline-flex items-center gap-2 rounded-pill border border-border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.09em] text-ink-soft">
            <span className="h-1 w-1 rounded-full bg-brand-500" />
            What you get
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
            <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-ink sm:text-5xl">
              Everything a shop needs.
              <br className="hidden sm:block" />{" "}
              <span className="text-brand-500">Nothing sold separately.</span>
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft lg:pb-2">
              There is no marketplace to shop in before your shop works. What is listed here is
              what you get on the first day, on the free address.
            </p>
          </div>

          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {GROUPS.map(({ kicker, title, points }) => (
              <div key={title}>
                <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-faint">
                  {kicker}
                </p>
                <h3 className="mt-2 text-xl font-semibold leading-snug text-balance text-ink">
                  {title}
                </h3>
                <ul className="mt-4 space-y-2">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm leading-snug text-ink-soft">
                      <Check className="mt-[3px] h-3.5 w-3.5 flex-shrink-0 text-brand-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================================== start */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
          <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-ink sm:text-5xl">
            Open in the time it takes
            <br className="hidden sm:block" /> to make lunch
          </h2>
          <p className="text-sm leading-relaxed text-ink-soft lg:pb-2">
            You do not need the domain, the photographs or the final prices to begin. You need a
            name.
          </p>
        </div>

        {/* Numbered because it is a sequence — you cannot point a domain at a
            shop that does not exist yet. */}
        <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-3">
          {START.map(({ n, title, body }) => (
            <li key={n} className="bg-surface px-6 py-8">
              <span className="font-mono text-xs tracking-widest text-brand-500">{n}</span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ========================================================== comparison */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-end">
            <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-ink sm:text-5xl">
              Coming from
              <br className="hidden sm:block" /> somewhere else
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft lg:pb-2">
              The differences you notice in a working week, not the ones on a feature grid.
            </p>
          </div>

          <dl className="mt-12 divide-y divide-border border-y border-border">
            {COMPARISON.map((row) => (
              <div key={row.us} className="grid gap-2 py-5 sm:grid-cols-2 sm:gap-8">
                <dt className="text-sm text-ink-faint line-through decoration-ink-faint/40">
                  {row.them}
                </dt>
                <dd className="flex gap-2.5 text-[15px] font-medium text-ink">
                  <Check className="mt-[3px] h-4 w-4 flex-shrink-0 text-brand-500" />
                  {row.us}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================================================================= cta
          Closes on the same dark the page opened on, so it reads as one page
          rather than a light page with a dark hat. */}
      <section className="relative isolate overflow-hidden bg-night">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 70% at 50% 110%, rgba(102,102,255,0.38) 0%, rgba(102,102,255,0) 70%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold leading-[1.1] tracking-tight text-balance text-white sm:text-5xl">
            Your shop could be open before dinner
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/65">
            Pick a name and add a few things. Everything else can wait until you want it.
          </p>
          <a
            href={appUrl("/merchant/signup")}
            className="mt-9 inline-flex items-center gap-2 rounded-pill bg-white px-6 py-3.5 text-sm font-medium text-night transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night"
          >
            Create your shop
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-4 text-xs text-white/45">No card to start.</p>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* The three miniatures                                                       */
/*                                                                            */
/* Drawn rather than screenshotted: they stay sharp at any density, they cost  */
/* nothing to load, and they follow the product when it changes. Each one is   */
/* the shape of a screen that actually exists.                                 */
/* -------------------------------------------------------------------------- */

function Tile({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <div
      aria-hidden
      className={`h-[104px] w-[104px] flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 p-2.5 sm:h-[120px] sm:w-[120px] ${tone}`}
    >
      {children}
    </div>
  );
}

/** Your catalogue: rows of things with a price and a state. */
function MiniCatalogue() {
  return (
    <Tile tone="bg-white/[0.07]">
      <div className="space-y-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="h-5 w-5 flex-shrink-0 rounded bg-white/25" />
            <span className="flex-1 space-y-1">
              <span className="block h-1 w-full rounded-full bg-white/30" />
              <span className="block h-1 w-2/3 rounded-full bg-white/15" />
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
          </div>
        ))}
      </div>
    </Tile>
  );
}

/** Your pages: a stack of blocks you can reorder. */
function MiniBuilder() {
  return (
    <Tile tone="bg-brand-500/25">
      <div className="space-y-1.5">
        <span className="block h-7 rounded bg-white/30" />
        <div className="grid grid-cols-3 gap-1.5">
          <span className="h-5 rounded bg-white/20" />
          <span className="h-5 rounded bg-white/20" />
          <span className="h-5 rounded bg-white/20" />
        </div>
        <span className="block h-3 w-3/4 rounded bg-white/15" />
      </div>
    </Tile>
  );
}

/** Your shop, as a customer sees it. */
function MiniShop() {
  return (
    <Tile tone="bg-white/[0.07]">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="h-1 w-6 rounded-full bg-white/35" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <span className="aspect-square rounded bg-white/25" />
          <span className="aspect-square rounded bg-white/15" />
          <span className="aspect-square rounded bg-white/15" />
          <span className="aspect-square rounded bg-white/25" />
        </div>
      </div>
    </Tile>
  );
}
