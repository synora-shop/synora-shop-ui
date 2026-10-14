import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, HelpCircle, LifeBuoy, Sparkles } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { ANSWERS, DOC_TOPICS, KNOWN_ISSUES, TINT, TONE } from "@/lib/docs-content";
import { KnownIssuesStrip, LightPage, PageBand } from "@/components/platform/light-page";
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
 * The docs (14 October; /documentation forwards here): how each part works.
 *
 * Built to be read, not admired: a short band in the docs' iris with search
 * beside the title, the one known issue right under it, then an index that
 * follows you down the left and each topic as its own card, its header
 * tinted in the topic's colour so one topic never runs into the next. Wide
 * screens add a rail on the right for when the docs are not enough. The
 * words live in lib/docs-content.ts, shared with the search and with /help.
 */
export default function DocsPage() {
  const nav = [...DOC_TOPICS.map(({ id, title }) => ({ id, title })), { id: "answers", title: "Answers" }];
  return (
    <LightPage section="docs">
      <PageBand
        section="docs"
        icon={BookOpen}
        label="Docs"
        title="How Synora App works"
        lead="Short guides to every part of your shop: products, orders, payments the way Pakistan pays, domains and your team."
        aside={<SearchBar placeholder="Search the docs" compact />}
      />
      <KnownIssuesStrip issues={KNOWN_ISSUES} />

      <div className="mx-auto grid max-w-[78rem] grid-cols-[minmax(0,1fr)] gap-x-10 px-5 pb-24 pt-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:pt-10 xl:grid-cols-[13rem_minmax(0,1fr)_16rem]">
        <DocsNav items={nav} />

        <div className="flex min-w-0 flex-col gap-6">
          {DOC_TOPICS.map(({ id, icon: Icon, tone, title, blurb, steps, points }) => (
            <section key={id} id={id} className="scroll-mt-36 overflow-hidden rounded-[1.6rem] bg-white ring-1 ring-[#0d0d50]/[0.08] lg:scroll-mt-28">
              <header className={`flex items-center gap-4 px-6 py-5 sm:px-7 ${TINT[tone]}`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${TONE[tone]}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.025em]">{title}</h2>
                  <p className="text-[15.5px] text-[#0d0d50]/65">{blurb}</p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-white/70 px-3 py-1 text-[12.5px] font-semibold text-[#0d0d50]/55 sm:inline">
                  {steps ? `${steps.length} steps` : `${points?.length ?? 0} things to know`}
                </span>
              </header>

              <div className="p-5 sm:p-7">
                {steps && (
                  <ol className="grid gap-3 sm:grid-cols-2">
                    {steps.map((s, n) => (
                      <li key={s} className="flex gap-4 rounded-2xl bg-[#f7f7fc] p-5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#6666ff] text-sm font-bold text-white">{n + 1}</span>
                        <p className="text-[16px] leading-[1.65] text-[#0d0d50]/85">{s}</p>
                      </li>
                    ))}
                  </ol>
                )}
                {points && (
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {points.map(([term, def]) => (
                      <div key={term} className="rounded-2xl border border-[#0d0d50]/[0.07] p-5">
                        <dt className="text-[16px] font-semibold">{term}</dt>
                        <dd className="mt-1.5 text-[15.5px] leading-[1.65] text-[#0d0d50]/75">{def}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </section>
          ))}

          <section id="answers" className="scroll-mt-36 overflow-hidden rounded-[1.6rem] bg-[#0d0d50] text-white lg:scroll-mt-28">
            <header className="flex items-center gap-4 px-6 py-5 sm:px-7">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#b8efd6]">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[1.45rem] font-semibold leading-tight tracking-[-0.025em]">Answers</h2>
                <p className="text-[15.5px] text-white/60">The questions that come up most.</p>
              </div>
            </header>
            <div className="flex flex-col gap-2 px-4 pb-5 sm:px-6 sm:pb-7">
              {ANSWERS.map(([q, a]) => (
                <details key={q} className="group rounded-2xl bg-white/[0.06] px-5 py-4 open:bg-white/[0.1]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-lg leading-none text-[#b8efd6] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[16px] leading-[1.65] text-white/75">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* For when the docs are not enough. */}
        <aside className="mt-6 grid gap-4 sm:grid-cols-2 lg:col-start-2 xl:col-start-auto xl:mt-0 xl:block">
          <div className="flex flex-col gap-4 xl:sticky xl:top-28">
            <Link href="/help" className="group block rounded-[1.4rem] bg-[#e4f7ee] p-5 ring-1 ring-[#1f9d68]/15 transition-transform hover:-translate-y-0.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1f9d68] text-white">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[16px] font-semibold">Still stuck?</p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#0d0d50]/65">Ask the Synora team and follow the answer on your help page.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#16704a]">
                Ask the team <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link href="/release-notes" className="group block rounded-[1.4rem] bg-[#e8f4ff] p-5 ring-1 ring-[#2f86cf]/15 transition-transform hover:-translate-y-0.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#2f86cf] text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="mt-3 text-[16px] font-semibold">What&rsquo;s new</p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#0d0d50]/65">Every update, and what each one fixed.</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#1b5d97]">
                Release notes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </aside>
      </div>
    </LightPage>
  );
}
