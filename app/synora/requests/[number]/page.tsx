import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BellOff, BellRing, Bug, Lightbulb } from "lucide-react";
import { loadHelpThread } from "@/lib/help-data";
import { KIND_LABEL, STATUSES, STATUS_TONE, ref, statusLabel } from "@/lib/help";
import { PLATFORM_DOMAIN } from "@/lib/shop-context";
import { StatusRoad, Thread } from "@/components/help/thread";
import { AnswerBox } from "@/components/synora/answer-box";

export const metadata: Metadata = { title: "Request" };

const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * One request, for the team (14 October): the conversation, the reply box,
 * and beside them who sent it: name, email, when the account was made,
 * whether the address is confirmed, their shops, how often they have written.
 */
export default async function SynoraRequestPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const thread = await loadHelpThread(Number(number));
  if (!thread) notFound();
  const { request: r, entries } = thread;
  const u = r.user;
  const list = r.kind === "TICKET" ? "/synora/tickets" : "/synora/suggestions";

  const facts: [string, React.ReactNode][] = [
    ["Email", <a key="e" href={`mailto:${u.email}`} className="font-semibold text-[#4b4bea] hover:underline">{u.email}</a>],
    ["Phone", u.phone || "Not given"],
    ["Account created", day(u.createdAt)],
    ["Email confirmed", u.emailVerifiedAt ? day(u.emailVerifiedAt) : "Not yet"],
    ["Requests sent", String(u._count.helpRequests)],
    ["Updates by email", r.notify ? "On" : "Off"],
    ["Sent", day(r.createdAt)],
  ];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="min-w-0">
        <Link href={list} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0d0d50]/55 hover:text-[#0d0d50]">
          <ArrowLeft className="h-4 w-4" /> {r.kind === "TICKET" ? "Tickets" : "Suggestions"}
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${r.kind === "TICKET" ? "bg-[#ecebff] text-[#4b4bea]" : "bg-[#e3f8ee] text-[#1d7a52]"}`}>
            {r.kind === "TICKET" ? <Bug className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
            {KIND_LABEL[r.kind]} {ref(r.number)}
          </span>
          {r.topic && <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#0d0d50]/60 ring-1 ring-[#0d0d50]/[0.06]">{r.topic}</span>}
          <span className={`rounded-full px-3 py-1 text-[13px] font-bold ${STATUS_TONE[r.status]}`}>{statusLabel(r.kind, r.status)}</span>
        </div>
        <h1 className="mt-3 text-[1.9rem] font-semibold leading-tight tracking-[-0.03em]">{r.subject}</h1>
        <div className="mt-6 rounded-[1.4rem] bg-white p-5 ring-1 ring-[#0d0d50]/[0.06]">
          <StatusRoad kind={r.kind} status={r.status} />
        </div>

        <div className="mt-8">
          <Thread kind={r.kind} entries={entries} viewer="team" />
        </div>
        <div className="mt-8">
          <AnswerBox number={r.number} kind={r.kind} status={r.status} statuses={STATUSES[r.kind]} notify={r.notify} email={u.email} />
        </div>
      </div>

      {/* Who sent it. */}
      <aside className="xl:pt-10">
        <div className="flex flex-col gap-4 xl:sticky xl:top-10">
          <section className="rounded-[1.6rem] bg-white p-6 ring-1 ring-[#0d0d50]/[0.06]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#b7b9ff] text-[16px] font-bold">{u.name.slice(0, 1).toUpperCase()}</span>
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold">{u.name}</p>
                <p className="flex items-center gap-1 text-[12.5px] text-[#0d0d50]/50">
                  {r.notify ? <BellRing className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />} {r.notify ? "Wants updates" : "Updates off"}
                </p>
              </div>
            </div>
            <dl className="mt-5 flex flex-col gap-3">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 text-[14px]">
                  <dt className="text-[#0d0d50]/50">{k}</dt>
                  <dd className="min-w-0 truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-[1.6rem] bg-white p-6 ring-1 ring-[#0d0d50]/[0.06]">
            <h2 className="text-[14px] font-semibold">Their shops</h2>
            {u.memberships.length === 0 ? (
              <p className="mt-2 text-[14px] text-[#0d0d50]/55">None.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {u.memberships.map((m) => (
                  <li key={m.shop.subdomain} className={`rounded-2xl p-3 ${r.shop?.subdomain === m.shop.subdomain ? "bg-[#f2f2ff] ring-1 ring-[#6666ff]/30" : "bg-[#f8f8fb]"}`}>
                    <p className="text-[14px] font-semibold">
                      {m.shop.name} {r.shop?.subdomain === m.shop.subdomain && <span className="text-[11.5px] font-semibold text-[#4b4bea]">· this one</span>}
                    </p>
                    <p className="text-[12.5px] text-[#0d0d50]/55">
                      {m.role.toLowerCase()} · {m.shop.status.toLowerCase()} ·{" "}
                      <a href={`https://${m.shop.subdomain}.${PLATFORM_DOMAIN}`} target="_blank" rel="noreferrer" className="text-[#4b4bea] hover:underline">
                        {m.shop.subdomain}
                      </a>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
