import Link from "next/link";
import { Bug, Lightbulb, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { STATUSES, STATUS_TONE, ref, statusLabel, type HelpKindName, type HelpStatusName } from "@/lib/help";
import { formatRelativeTime } from "@/lib/format-relative-time";

/**
 * Tickets or suggestions, for the team (14 October). "Active" is the default
 * view: everything not finished, oldest waiting first, with the ones whose
 * last word is the merchant's marked "Needs reply".
 */
const ACTIVE: Record<HelpKindName, HelpStatusName[]> = {
  TICKET: ["OPEN", "IN_PROGRESS", "WAITING"],
  SUGGESTION: ["OPEN", "UNDER_REVIEW", "PLANNED"],
};

export async function RequestList({ kind, status, q, base }: { kind: HelpKindName; status?: string; q?: string; base: string }) {
  const filter = status === "all" ? null : STATUSES[kind].includes(status as HelpStatusName) ? [status as HelpStatusName] : ACTIVE[kind];
  const text = (q ?? "").trim();
  const asNumber = Number(text.replace(/^#/, ""));

  const rows = await prisma.helpRequest.findMany({
    where: {
      kind,
      ...(filter ? { status: { in: filter } } : {}),
      ...(text
        ? {
            OR: [
              ...(Number.isInteger(asNumber) && asNumber > 0 ? [{ number: asNumber }] : []),
              { subject: { contains: text, mode: "insensitive" as const } },
              { body: { contains: text, mode: "insensitive" as const } },
              { user: { email: { contains: text, mode: "insensitive" as const } } },
              { user: { name: { contains: text, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    orderBy: filter ? { updatedAt: "asc" } : { updatedAt: "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true, createdAt: true } },
      shop: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { fromTeam: true } },
    },
  });

  const counts = await prisma.helpRequest.groupBy({ by: ["status"], where: { kind }, _count: true });
  const countOf = (s: HelpStatusName) => counts.find((c) => c.status === s)?._count ?? 0;
  const activeCount = ACTIVE[kind].reduce((t, s) => t + countOf(s), 0);
  const allCount = counts.reduce((t, c) => t + c._count, 0);
  const href = (s?: string) => `${base}${s ? `?status=${s}` : ""}`;
  const Icon = kind === "TICKET" ? Bug : Lightbulb;

  const chip = (label: string, n: number, target: string | undefined, on: boolean) => (
    <Link
      key={label}
      href={href(target)}
      className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors ${on ? "bg-[#0d0d50] text-white" : "bg-white text-[#0d0d50]/65 ring-1 ring-[#0d0d50]/[0.08] hover:text-[#0d0d50]"}`}
    >
      {label} <span className="opacity-60">{n}</span>
    </Link>
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {chip("Active", activeCount, undefined, !status)}
          {STATUSES[kind].map((s) => chip(statusLabel(kind, s), countOf(s), s, status === s))}
          {chip("All", allCount, "all", status === "all")}
        </div>
        <form action={base} className="relative sm:w-72">
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0d0d50]/35" />
          <input
            name="q"
            defaultValue={text}
            placeholder="Search #, words, name or email"
            aria-label="Search"
            className="h-10 w-full rounded-full bg-white pl-10 pr-4 text-[14px] outline-none ring-1 ring-[#0d0d50]/[0.08] focus:ring-2 focus:ring-[#6666ff]"
          />
        </form>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[#0d0d50]/15 bg-white px-6 py-16 text-center">
          <Icon className="mx-auto h-8 w-8 text-[#b7b9ff]" />
          <p className="mt-3 text-[16px] font-semibold">{text ? "Nothing matches that." : "Nothing here. Inbox zero."}</p>
        </div>
      ) : (
        <ul className="mt-6 overflow-hidden rounded-[1.6rem] bg-white ring-1 ring-[#0d0d50]/[0.06]">
          {rows.map((r) => {
            const needsReply = !r.messages[0] || !r.messages[0].fromTeam;
            const open = !["RESOLVED", "CLOSED", "SHIPPED", "DECLINED"].includes(r.status);
            return (
              <li key={r.id} className="relative border-b border-[#0d0d50]/[0.06] last:border-b-0 hover:bg-[#fafaff]">
                <div className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#0d0d50]/45">{ref(r.number)}</span>
                      {open && needsReply && <span className="rounded-full bg-[#6666ff] px-2 py-0.5 text-[11px] font-bold text-white">Needs reply</span>}
                      {r.topic && <span className="rounded-full bg-[#f6f6f9] px-2 py-0.5 text-[11.5px] font-medium text-[#0d0d50]/55">{r.topic}</span>}
                    </div>
                    <Link href={`/synora/requests/${r.number}`} className="mt-0.5 block truncate text-[16px] font-semibold outline-none after:absolute after:inset-0">
                      {r.subject}
                    </Link>
                    <p className="mt-0.5 truncate text-[13px] text-[#0d0d50]/55">
                      {r.user.name} · {r.user.email}
                      {r.shop ? ` · ${r.shop.name}` : ""} · account since {r.user.createdAt.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${STATUS_TONE[r.status]}`}>{statusLabel(kind, r.status)}</span>
                    <span className="w-16 text-right text-[12.5px] text-[#0d0d50]/45">{formatRelativeTime(r.updatedAt)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
