import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bug, Lightbulb, Lock, TriangleAlert } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { prisma } from "@/lib/prisma";
import { merchantUser } from "@/lib/help-server";
import { KNOWN_ISSUES, docsSearchItems } from "@/lib/docs-content";
import { Highlight, LightPage, LightPageHero } from "@/components/platform/light-page";
import { SearchBar } from "@/components/platform/help-search";
import { HelpComposer, HelpHistory, type HistoryRow } from "@/components/help/help-client";

export const metadata: Metadata = {
  title: "Help",
  description: "Report a problem or suggest an idea to the Synora team, and follow it.",
  alternates: { canonical: appUrl("/help") },
  robots: { index: false, follow: true },
};

/** Who is asking decides the page, so it is drawn per request. */
export const dynamic = "force-dynamic";

/**
 * Help (14 October): the third help page, beside the docs and the release
 * notes. Search first, because the answer may already be written; then ask
 * the team, a ticket for a problem or a suggestion for an idea; then
 * everything you have sent and where each one is up to, each with its own
 * "email me" switch. Known issues sit alongside.
 *
 * Asking needs an account, so the team knows whose shop it is and can answer;
 * signed out, the page says so and offers the way in, back to this page.
 */
export default async function HelpPage({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const { kind } = await searchParams;
  const me = await merchantUser();
  const back = encodeURIComponent(`/help${kind ? `?kind=${kind}` : ""}`);

  const rows: HistoryRow[] = me
    ? (
        await prisma.helpRequest.findMany({
          where: { userId: me.id },
          orderBy: { updatedAt: "desc" },
          select: { number: true, kind: true, status: true, subject: true, updatedAt: true, notify: true, teamRepliedAt: true, userSeenAt: true },
        })
      ).map((r) => ({
        number: r.number,
        kind: r.kind,
        status: r.status,
        subject: r.subject,
        updatedAt: r.updatedAt.toISOString(),
        notify: r.notify,
        unread: !!r.teamRepliedAt && (!r.userSeenAt || r.teamRepliedAt > r.userSeenAt),
      }))
    : [];
  const unread = rows.filter((r) => r.unread).length;

  return (
    <LightPage section="help">
      <LightPageHero
        pill={me ? `Signed in as ${me.email}` : "Help · the Synora team reads every one"}
        title={
          <>
            How can we
            <br />
            <Highlight>help?</Highlight>
          </>
        }
        lead="Search first, the answer may already be written. If it isn't, report a problem or suggest an idea, and follow it right here."
      >
        <SearchBar placeholder="Search for an answer first" />
      </LightPageHero>

      <div className="mx-auto grid max-w-[78rem] grid-cols-[minmax(0,1fr)] gap-10 px-5 pb-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-14">
          {/* Ask. */}
          <section id="ask" className="scroll-mt-28">
            <h2 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.03em]">Ask the team</h2>
            <p className="mt-1 text-[17px] text-[#0d0d50]/60">A real person on the Synora team reads it and answers here.</p>

            <div className="mt-7">
              {me ? (
                <HelpComposer initialKind={kind === "suggestion" ? "SUGGESTION" : "TICKET"} shops={me.shops} docs={docsSearchItems()} />
              ) : (
                <div className="overflow-hidden rounded-[1.75rem] border border-[#0d0d50]/[0.08]">
                  <div className="grid gap-px bg-[#0d0d50]/[0.06] sm:grid-cols-2">
                    {[
                      { icon: Bug, title: "Report a problem", text: "Something broken, confusing or stuck." },
                      { icon: Lightbulb, title: "Suggest an idea", text: "Something that would make running your shop easier." },
                    ].map(({ icon: Icon, title, text }) => (
                      <div key={title} className="flex gap-4 bg-white p-6">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f2f2ff] text-[#6666ff]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span>
                          <span className="block text-[16px] font-semibold">{title}</span>
                          <span className="mt-0.5 block text-[14px] leading-snug text-[#0d0d50]/60">{text}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-start gap-4 bg-[linear-gradient(140deg,#f3f3ff_0%,#eef8ff_60%,#effcf6_100%)] p-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2.5 text-[16px] font-semibold">
                      <Lock className="h-4 w-4 text-[#6666ff]" /> Sign in to send one and follow it here.
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      <a href={`/merchant/login?callbackUrl=${back}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-5 text-sm font-semibold text-white hover:bg-[#5a5af5]">
                        Sign in <ArrowRight className="h-4 w-4" />
                      </a>
                      <a href="/merchant/signup" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold ring-1 ring-[#0d0d50]/10">
                        Create an account
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* What you have sent. */}
          {me && (
            <section id="history" className="scroll-mt-28">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.03em]">What you&rsquo;ve sent</h2>
                {unread > 0 && (
                  <span className="rounded-full bg-[#6666ff] px-3 py-1 text-[13px] font-bold text-white">
                    {unread} new {unread === 1 ? "reply" : "replies"}
                  </span>
                )}
              </div>
              <p className="mb-6 mt-1 text-[17px] text-[#0d0d50]/60">Every ticket and suggestion, and where each is up to.</p>
              <HelpHistory rows={rows} />
            </section>
          )}
        </div>

        {/* Alongside: what is already known to be broken. */}
        <aside className="lg:pt-1">
          <div className="lg:sticky lg:top-28">
            <section id="known-issues" className="scroll-mt-28 rounded-[1.6rem] border border-[#c2410c]/15 bg-[#fffaf6] p-6">
              <h2 className="flex items-center gap-2.5 text-[18px] font-semibold">
                <TriangleAlert className="h-5 w-5 text-[#c2410c]" /> Known issues
              </h2>
              <p className="mt-1 text-[14px] text-[#0d0d50]/55">Already on our list. No need to report these.</p>
              <ul className="mt-4 flex flex-col gap-3">
                {KNOWN_ISSUES.map(([t, d]) => (
                  <li key={t} className="rounded-2xl bg-white p-4 ring-1 ring-[#c2410c]/10">
                    <p className="text-[15px] font-semibold leading-snug">{t}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-[#0d0d50]/70">{d}</p>
                  </li>
                ))}
              </ul>
            </section>
            <div className="mt-4 rounded-[1.6rem] bg-[#f5f5ff] p-6">
              <p className="text-[15px] font-semibold">Looking for how something works?</p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#0d0d50]/65">The docs walk through products, orders, payments, domains and your team.</p>
              <Link href="/docs" className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#4b4bea]">
                Open the docs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </LightPage>
  );
}
