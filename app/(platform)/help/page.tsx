import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bug, Inbox, LifeBuoy, Lightbulb, Lock, MessageSquareReply, Search } from "lucide-react";
import { appUrl } from "@/lib/shop-context";
import { prisma } from "@/lib/prisma";
import { merchantUser } from "@/lib/help-server";
import { isClosed } from "@/lib/help";
import { KNOWN_ISSUES, docsSearchItems } from "@/lib/docs-content";
import { KnownIssuesStrip, LightPage, PageBand } from "@/components/platform/light-page";
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
 * Help (14 October). In the order someone needs it:
 *
 *   the band        mint, the page's colour; your numbers on the right
 *   known issues    amber, right under it: if your problem is here, stop
 *   ask the team    a problem (ticket) or an idea (suggestion), with the
 *                   docs that might already answer it as you type
 *   your requests   beside the form, not under it: what you sent and where
 *                   each is up to, a red dot on a new reply. On a phone it
 *                   comes first when something is waiting for you.
 *
 * Asking needs an account, so the team knows whose shop it is and can
 * answer; signed out, the page says so and offers the way in, back here.
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
  const open = rows.filter((r) => !isClosed(r.status)).length;

  const stat = (n: number, label: string, Icon: typeof Inbox, hot = false) => (
    <div className={`rounded-2xl p-4 ${hot ? "bg-[#1f9d68] text-white" : "bg-white/80 ring-1 ring-[#0d0d50]/[0.06]"}`}>
      <Icon className={`h-4 w-4 ${hot ? "text-white/80" : "text-[#1f9d68]"}`} />
      <p className="mt-2 text-[1.7rem] font-semibold leading-none tracking-[-0.03em]">{n}</p>
      <p className={`mt-1 text-[13px] font-medium ${hot ? "text-white/80" : "text-[#0d0d50]/55"}`}>{label}</p>
    </div>
  );

  return (
    <LightPage section="help">
      <PageBand
        section="help"
        icon={LifeBuoy}
        label="Help"
        title="How can we help?"
        lead="Check the known issues first. If it isn't there, tell the Synora team: a real person reads it and answers here."
        aside={
          me ? (
            <div className="grid grid-cols-2 gap-3">
              {stat(open, open === 1 ? "open request" : "open requests", Inbox)}
              {stat(unread, unread === 1 ? "new reply" : "new replies", MessageSquareReply, unread > 0)}
            </div>
          ) : (
            <a href={`/merchant/login?callbackUrl=${back}`} className="group flex items-center gap-4 rounded-2xl bg-white/85 p-4 ring-1 ring-[#0d0d50]/[0.06] transition-shadow hover:shadow-[0_14px_36px_-20px_rgba(31,157,104,0.6)]">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1f9d68] text-white">
                <Lock className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">Sign in to ask the team</span>
                <span className="block text-[13px] text-[#0d0d50]/55">and follow every answer here</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#0d0d50]/40 transition-transform group-hover:translate-x-0.5" />
            </a>
          )
        }
      />
      <KnownIssuesStrip issues={KNOWN_ISSUES} full />

      <div className="bg-[#f8f8fb]">
        <div className="mx-auto grid max-w-[78rem] grid-cols-[minmax(0,1fr)] gap-6 px-5 pb-24 pt-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-8 lg:pt-10">
          {/* Ask. */}
          <section id="ask" className="scroll-mt-28 rounded-[1.75rem] bg-white p-6 ring-1 ring-[#0d0d50]/[0.06] sm:p-8">
            <h2 className="text-[1.55rem] font-semibold tracking-[-0.03em]">Ask the team</h2>
            <p className="mb-7 mt-1 text-[16px] text-[#0d0d50]/60">A problem to fix, or an idea to make Synora App better.</p>
            {me ? (
              <HelpComposer initialKind={kind === "suggestion" ? "SUGGESTION" : "TICKET"} shops={me.shops} docs={docsSearchItems()} />
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Bug, title: "Report a problem", text: "Something broken, confusing or stuck." },
                    { icon: Lightbulb, title: "Suggest an idea", text: "Something that would make running your shop easier." },
                  ].map(({ icon: Icon, title, text }) => (
                    <div key={title} className="flex gap-4 rounded-[1.4rem] border-2 border-[#0d0d50]/[0.07] p-5 opacity-70">
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
                <div className="flex flex-col items-start gap-4 rounded-2xl bg-[#e4f7ee] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2.5 text-[15.5px] font-semibold text-[#0d0d50]">
                    <Lock className="h-4 w-4 text-[#1f9d68]" /> Sign in to send one and follow it here.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <a href={`/merchant/login?callbackUrl=${back}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#1f9d68] px-5 text-sm font-semibold text-white hover:bg-[#1a8a5b]">
                      Sign in <ArrowRight className="h-4 w-4" />
                    </a>
                    <a href="/merchant/signup" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold ring-1 ring-[#0d0d50]/10">
                      Create an account
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Your requests, in sight. First on a phone when one is waiting for you. */}
          <aside id="history" className={`scroll-mt-28 ${unread > 0 ? "order-first lg:order-none" : ""}`}>
            <div className="flex flex-col gap-4 lg:sticky lg:top-28">
              {me ? (
                <section className="rounded-[1.75rem] bg-white p-5 ring-1 ring-[#0d0d50]/[0.06]">
                  <div className="mb-4 flex items-center justify-between gap-3 px-1">
                    <h2 className="text-[17px] font-semibold">Your requests</h2>
                    {unread > 0 && <span className="rounded-full bg-[#ff5a5f] px-2.5 py-0.5 text-[12px] font-bold text-white">{unread} new</span>}
                  </div>
                  <HelpHistory rows={rows} />
                </section>
              ) : (
                <section className="rounded-[1.75rem] bg-white p-6 ring-1 ring-[#0d0d50]/[0.06]">
                  <h2 className="text-[17px] font-semibold">How help works</h2>
                  <ol className="mt-4 flex flex-col gap-4">
                    {[
                      ["Send it", "A problem or an idea, in a few words."],
                      ["We answer", "Someone on the Synora team replies here, and by email if you like."],
                      ["Follow it", "Every request and its status, in one place."],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex gap-3.5">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e4f7ee] text-[13px] font-bold text-[#16704a]">{i + 1}</span>
                        <span>
                          <span className="block text-[15px] font-semibold">{t}</span>
                          <span className="block text-[14px] leading-snug text-[#0d0d50]/60">{d}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              <Link href="/docs" className="group flex items-center gap-3.5 rounded-[1.4rem] bg-[#ecebff] p-4 transition-transform hover:-translate-y-0.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6666ff] text-white">
                  <Search className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">How does something work?</span>
                  <span className="block text-[13px] text-[#0d0d50]/60">The docs cover every part of your shop.</span>
                </span>
                <ArrowRight className="h-4 w-4 text-[#4b4bea] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </LightPage>
  );
}
