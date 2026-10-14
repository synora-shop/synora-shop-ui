import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { Highlight, LightPage, LightPageHero } from "@/components/platform/light-page";

export const metadata: Metadata = {
  title: "Release notes",
  description: "What changed in Synora App, when, and what it means for a shop that is already open.",
  robots: { index: false, follow: true },
};

/**
 * Release notes, in the front page's look (14 October).
 *
 * Written for the person running the shop, not for whoever wrote the code:
 * what changed and what it means for them. Every entry is a real change, taken
 * from docs/QUEUE.md; the newest goes on top. Add one here whenever a change
 * reaches merchants or their customers.
 */

type Kind = "New" | "Improved" | "Fixed";
const KIND: Record<Kind, string> = {
  New: "bg-[#6666ff] text-white",
  Improved: "bg-[#c8e7ff] text-[#0d0d50]",
  Fixed: "bg-[#b8efd6] text-[#0d0d50]",
};

type Release = { date: string; title: string; changes: [Kind, string][] };

const RELEASES: Release[] = [
  {
    date: "14 October 2026",
    title: "A new front page, and sign-in to match",
    changes: [
      ["New", "A new front page for Synora App, made for how Pakistan sells."],
      ["Improved", "Sign in, sign up and password reset have a new look. Nothing about how they work changed."],
      ["Fixed", "If an account email ever fails to send, you are now told so, instead of waiting for an email that is not coming."],
      ["Fixed", "Your order confirmation and your new-order notice are sent separately, so one failing never stops the other."],
    ],
  },
  {
    date: "9 October 2026",
    title: "Kite is here",
    changes: [
      ["New", "Kite, a second complete theme, ready to choose for your shop."],
      ["Fixed", "Every link and button in the Loom demo now goes somewhere, and pages change in place without reloading."],
    ],
  },
  {
    date: "7 October 2026",
    title: "Loom, rebuilt",
    changes: [["Improved", "The Loom theme's home page was rebuilt to match its original design exactly, on phones and on wide screens."]],
  },
  {
    date: "3 October 2026",
    title: "Shopify imports do what the file says",
    changes: [
      ["Fixed", "Product descriptions imported from Shopify show their formatting, instead of raw code."],
      ["Fixed", "SEO titles and descriptions now come across with your products."],
      ["Fixed", "“Continue selling when out of stock” is now respected, so pre-orders keep working after a move."],
    ],
  },
  {
    date: "2 October 2026",
    title: "Theme fonts load",
    changes: [["Fixed", "The storefront fonts a theme asks for now load, so headings look the way the theme was designed."]],
  },
  {
    date: "23 September 2026",
    title: "A faster panel",
    changes: [
      ["Improved", "Panel pages ask the database fewer questions, and ask them side by side instead of one after another."],
      ["Improved", "Product photos are served in a smaller format and kept for a year, instead of being reprocessed on almost every view."],
    ],
  },
  {
    date: "8 September 2026",
    title: "Card payments",
    changes: [
      ["New", "Take card payments through PayFast."],
      ["New", "An order counts as paid only once the payment provider confirms it, and stock held for an unfinished card payment is given back after thirty minutes."],
    ],
  },
  {
    date: "7 September 2026",
    title: "Your own domain",
    changes: [["New", "Connect your own domain. Once it is live it becomes your main address, and your free address sends people to it."]],
  },
];

export default function ReleaseNotesPage() {
  return (
    <LightPage>
      <LightPageHero
        pill={`Latest: ${RELEASES[0].date}`}
        title={
          <>
            What&rsquo;s new in
            <br />
            <Highlight>Synora App.</Highlight>
          </>
        }
        lead="What changed, when, and what it means for a shop that is already open. Written for the person running the shop."
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {(Object.keys(KIND) as Kind[]).map((k) => (
            <span key={k} className={`rounded-full px-3 py-1 text-xs font-semibold ${KIND[k]}`}>
              {k}
            </span>
          ))}
        </div>
      </LightPageHero>

      <div className="mx-auto max-w-[78rem] px-5 pb-24">
        <ol className="relative">
          {RELEASES.map(({ date, title, changes }, i) => (
            <li key={date} className="relative grid gap-4 pb-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
              {/* The date, and the line that joins one release to the next. */}
              <div className="relative flex items-center gap-3 lg:block lg:pt-7">
                <span className={`relative z-10 grid h-4 w-4 place-items-center rounded-full ${i === 0 ? "bg-[#6666ff] ring-4 ring-[#6666ff]/20" : "bg-white ring-2 ring-[#0d0d50]/20"}`} />
                <p className="text-sm font-semibold text-[#0d0d50]/70 lg:mt-3">{date}</p>
                {i < RELEASES.length - 1 && <span aria-hidden className="absolute left-[7px] top-11 hidden h-[calc(100%+2.5rem)] w-px bg-[#0d0d50]/10 lg:block" />}
              </div>

              <article className={`rounded-[2rem] border p-6 sm:p-9 ${i === 0 ? "border-transparent bg-[linear-gradient(140deg,#f3f3ff_0%,#eef8ff_60%,#effcf6_100%)]" : "border-[#0d0d50]/[0.08] bg-white"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.03em]">{title}</h2>
                  {i === 0 && <span className="rounded-full bg-[#0d0d50] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">Latest</span>}
                </div>
                <ul className="mt-6 flex flex-col gap-3.5">
                  {changes.map(([kind, text]) => (
                    <li key={text} className="flex flex-col items-start gap-2 sm:flex-row sm:gap-4">
                      <span className={`mt-0.5 w-[5.5rem] shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-semibold ${KIND[kind]}`}>{kind}</span>
                      <p className="text-[15px] leading-relaxed text-[#0d0d50]/75">{text}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-[2rem] bg-[#0d0d50] p-7 text-white sm:flex-row sm:items-center sm:p-9">
          <div>
            <p className="text-xl font-semibold tracking-[-0.02em]">Something not working?</p>
            <p className="mt-1 text-[15px] text-white/60">Known issues and short guides are in the documentation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/documentation#known-issues" className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold transition-colors hover:bg-white/10">
              Known issues
            </Link>
            <a href={appUrl("/merchant/signup")} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-5 text-sm font-semibold transition-colors hover:bg-[#5a5af5]">
              Create your shop <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </LightPage>
  );
}
