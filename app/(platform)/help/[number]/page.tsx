import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Bug, Lightbulb } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { merchantUser } from "@/lib/help-server";
import { loadHelpThread } from "@/lib/help-data";
import { KIND_LABEL, STATUS_TONE, isClosed, ref, statusLabel, statusMeaning } from "@/lib/help";
import { LightPage } from "@/components/platform/light-page";
import { StatusRoad, Thread } from "@/components/help/thread";
import { NotifySwitch, ReplyBox } from "@/components/help/help-client";

export const metadata: Metadata = { title: "Your request", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * One ticket or suggestion, as its sender sees it (14 October): where it is
 * up to, the whole conversation, a reply box, and its "email me" switch.
 * Only the sender can open it; anyone else gets a 404, not a "not yours".
 * Opening it counts as reading the team's replies.
 */
export default async function HelpRequestPage({ params }: { params: Promise<{ number: string }> }) {
  const { number: raw } = await params;
  const me = await merchantUser();
  if (!me) redirect(`/merchant/login?callbackUrl=${encodeURIComponent(`/help/${raw}`)}`);

  const thread = await loadHelpThread(Number(raw), me.id);
  if (!thread) notFound();
  const { request: r, entries } = thread;
  await prisma.helpRequest.update({ where: { id: r.id }, data: { userSeenAt: new Date() } });

  return (
    <LightPage section="help">
      <div className="mx-auto max-w-[52rem] px-5 pb-24 pt-32 sm:pt-36">
        <Link href="/help#history" className="inline-flex items-center gap-1.5 rounded-full py-1 text-[14px] font-semibold text-[#0d0d50]/55 hover:text-[#0d0d50]">
          <ArrowLeft className="h-4 w-4" /> Everything you&rsquo;ve sent
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${r.kind === "TICKET" ? "bg-[#f2f2ff] text-[#4b4bea]" : "bg-[#effcf6] text-[#1d7a52]"}`}>
              {r.kind === "TICKET" ? <Bug className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
              {KIND_LABEL[r.kind]} {ref(r.number)}
            </span>
            {r.topic && <span className="rounded-full bg-[#f6f6f9] px-3 py-1 text-[13px] font-medium text-[#0d0d50]/60">{r.topic}</span>}
            {r.shop && <span className="rounded-full bg-[#f6f6f9] px-3 py-1 text-[13px] font-medium text-[#0d0d50]/60">{r.shop.name}</span>}
          </div>
          <h1 className="mt-4 text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.6rem]">{r.subject}</h1>
        </header>

        {/* Where it is up to. */}
        <div className="mt-8 rounded-[1.6rem] border border-[#0d0d50]/[0.08] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${STATUS_TONE[r.status]}`}>{statusLabel(r.kind, r.status)}</span>
            <NotifySwitch number={r.number} initial={r.notify} />
          </div>
          <p className="mt-3 text-[16px] text-[#0d0d50]/70">{statusMeaning(r.kind, r.status)}</p>
          <div className="mt-5">
            <StatusRoad kind={r.kind} status={r.status} />
          </div>
        </div>

        <div className="mt-10">
          <Thread kind={r.kind} entries={entries} viewer="sender" />
        </div>

        <div className="mt-10">
          <ReplyBox number={r.number} closed={isClosed(r.status)} />
        </div>
      </div>
    </LightPage>
  );
}
