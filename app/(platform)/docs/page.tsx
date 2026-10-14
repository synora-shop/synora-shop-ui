import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, TriangleAlert } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { ANSWERS, DOC_TOPICS, KNOWN_ISSUES, TONE } from "@/lib/docs-content";
import { Highlight, LightPage, LightPageHero } from "@/components/platform/light-page";
import { DocsNav } from "@/components/platform/docs-nav";
import { SearchBar } from "@/components/platform/help-search";

export const metadata: Metadata = {
  title: "Docs",
  description: "How each part of your shop on Synora App works: products, orders, payments, domains and your team.",
  alternates: { canonical: appUrl("/docs") },
  // Short versions only, for now. Kept out of search until the full guides
  // are written, so a thin page does not rank for the product's own name.
  robots: { index: false, follow: true },
};

/**
 * The docs (14 October; at /documentation until then, which now forwards
 * here): how each part works. The words live in lib/docs-content.ts, shared
 * with the search and with /help. One of three help pages, switched between
 * in the header (components/platform/help-switch.tsx).
 */
export default function DocsPage() {
  const nav = [...DOC_TOPICS.map(({ id, title }) => ({ id, title })), { id: "known-issues", title: "Known issues" }, { id: "answers", title: "Answers" }];
  return (
    <LightPage section="docs">
      <LightPageHero
        pill="Docs · short versions while the full guides are written"
        title={
          <>
            Everything you need
            <br />
            to <Highlight>run your shop.</Highlight>
          </>
        }
        lead="How each part of your shop works: products, orders, payments the way Pakistan pays, domains and your team."
      >
        <SearchBar />
      </LightPageHero>

      <div className="mx-auto grid max-w-[78rem] grid-cols-[minmax(0,1fr)] gap-x-16 px-5 pb-24 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <DocsNav items={nav} />

        {/* One reading column, kept to a comfortable line length. */}
        <div className="min-w-0 max-w-[44rem]">
          {DOC_TOPICS.map(({ id, icon: Icon, tone, title, blurb, steps, points }, i) => (
            <section key={id} id={id} className={`scroll-mt-36 py-12 lg:scroll-mt-28 ${i > 0 ? "border-t border-[#0d0d50]/[0.08]" : "pt-6 lg:pt-0"}`}>
              <div className="flex items-start gap-4">
                <span className={`mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${TONE[tone]}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.03em]">{title}</h2>
                  <p className="mt-1 text-[17px] leading-relaxed text-[#0d0d50]/60">{blurb}</p>
                </div>
              </div>

              {steps && (
                <ol className="mt-8 flex flex-col">
                  {steps.map((s, n) => (
                    <li key={s} className="relative flex gap-5 pb-7 last:pb-0">
                      {n < steps.length - 1 && <span aria-hidden className="absolute left-[15px] top-9 h-[calc(100%-2.5rem)] w-px bg-[#6666ff]/25" />}
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#6666ff] text-sm font-bold text-white">{n + 1}</span>
                      <p className="pt-0.5 text-[17px] leading-[1.7] text-[#0d0d50]/80">{s}</p>
                    </li>
                  ))}
                </ol>
              )}

              {points && (
                <dl className="mt-8 flex flex-col gap-6">
                  {points.map(([term, def]) => (
                    <div key={term} className="border-l-2 border-[#0d0d50]/[0.08] pl-5">
                      <dt className="text-[17px] font-semibold">{term}</dt>
                      <dd className="mt-1 text-[17px] leading-[1.7] text-[#0d0d50]/75">{def}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}

          <section id="known-issues" className="scroll-mt-36 border-t border-[#0d0d50]/[0.08] py-12 lg:scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[1.85rem] font-semibold leading-tight tracking-[-0.03em]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff0e6] text-[#c2410c]">
                <TriangleAlert className="h-5 w-5" />
              </span>
              Known issues
            </h2>
            <p className="mt-3 text-[17px] leading-relaxed text-[#0d0d50]/60">Published, not hidden. Finding out the hard way costs you a sale.</p>
            <ul className="mt-7 flex flex-col gap-3">
              {KNOWN_ISSUES.map(([t, d]) => (
                <li key={t} className="rounded-2xl bg-[#fff7f1] p-5 ring-1 ring-[#c2410c]/15">
                  <p className="text-[17px] font-semibold">{t}</p>
                  <p className="mt-1 text-[17px] leading-[1.7] text-[#0d0d50]/75">{d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section id="answers" className="scroll-mt-36 border-t border-[#0d0d50]/[0.08] py-12 lg:scroll-mt-28">
            <h2 className="flex items-center gap-3 text-[1.85rem] font-semibold leading-tight tracking-[-0.03em]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0d0d50] text-white">
                <HelpCircle className="h-5 w-5" />
              </span>
              Answers
            </h2>
            <div className="mt-7 flex flex-col gap-2.5">
              {ANSWERS.map(([q, a]) => (
                <details key={q} className="group rounded-2xl border border-[#0d0d50]/[0.08] px-5 py-4 open:bg-[#f7f7ff]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f2f2ff] text-lg leading-none text-[#6666ff] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[17px] leading-[1.7] text-[#0d0d50]/75">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="mt-4 flex flex-col items-start justify-between gap-5 rounded-[2rem] bg-[#0d0d50] p-7 text-white sm:flex-row sm:items-center sm:p-9">
            <div>
              <p className="text-xl font-semibold tracking-[-0.02em]">Ready when you are.</p>
              <p className="mt-1 text-[15px] text-white/60">The panel explains each screen as you use it.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/help" className="inline-flex h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold transition-colors hover:bg-white/10">
                Ask the team
              </Link>
              <a href={appUrl("/merchant/signup")} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-5 text-sm font-semibold transition-colors hover:bg-[#5a5af5]">
                Create your shop <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </LightPage>
  );
}
