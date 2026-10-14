import { Check, Mail } from "lucide-react";
import { statusLabel, type HelpKindName, type HelpStatusName } from "@/lib/help";
import { AccountAvatar } from "@/components/platform/account-avatar";

/**
 * A request's conversation (14 October), drawn the same for the person who
 * sent it (/support/[number]) and for the Synora team (/synora/requests/[number]);
 * only who counts as "you" changes.
 */

/* The road a request travels, as steps. A side turn (waiting on the sender,
   closed, declined) is drawn on the step it happens at. */
const ROAD: Record<HelpKindName, HelpStatusName[]> = {
  TICKET: ["OPEN", "IN_PROGRESS", "RESOLVED"],
  SUGGESTION: ["OPEN", "UNDER_REVIEW", "PLANNED", "SHIPPED"],
};
const ON_STEP: Partial<Record<HelpStatusName, HelpStatusName>> = { WAITING: "IN_PROGRESS", CLOSED: "RESOLVED", DECLINED: "SHIPPED" };

export function StatusRoad({ kind, status }: { kind: HelpKindName; status: HelpStatusName }) {
  const steps = ROAD[kind];
  const at = steps.indexOf(ON_STEP[status] ?? status);
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < at || (i === at && (status === "RESOLVED" || status === "SHIPPED" || status === "CLOSED"));
        const current = i === at;
        const label = current ? statusLabel(kind, status) : statusLabel(kind, s);
        const declined = current && status === "DECLINED";
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2" aria-current={current ? "step" : undefined}>
            <span
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                declined ? "bg-[#eeeef3] text-[#0d0d50]/50" : done ? "bg-[#6666ff] text-white" : current ? "bg-[#6666ff] text-white ring-4 ring-[#6666ff]/20" : "bg-[#f2f2ff] text-[#0d0d50]/40"
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`truncate text-[13px] font-semibold ${current ? "text-[#0d0d50]" : "text-[#0d0d50]/45"}`}>{label}</span>
            {i < steps.length - 1 && <span aria-hidden className={`hidden h-0.5 min-w-4 flex-1 rounded-full sm:block ${i < at ? "bg-[#6666ff]" : "bg-[#0d0d50]/10"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

export type ThreadEntry = {
  id: string;
  fromTeam: boolean;
  authorName: string;
  body: string;
  viaEmail: boolean;
  statusTo: HelpStatusName | null;
  createdAt: string;
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function Thread({ kind, entries, viewer }: { kind: HelpKindName; entries: ThreadEntry[]; viewer: "sender" | "team" }) {
  return (
    <ol className="flex flex-col gap-5">
      {entries.map((e) => {
        if (e.statusTo && !e.body) {
          return (
            <li key={e.id} className="flex justify-center">
              <span className="rounded-full bg-[#f2f2ff] px-3.5 py-1.5 text-[13px] font-medium text-[#0d0d50]/65">
                {e.fromTeam ? (viewer === "team" ? `${e.authorName || "The team"} marked it` : "Marked") : "Moved to"} <b className="font-semibold text-[#0d0d50]">{statusLabel(kind, e.statusTo)}</b> · {when(e.createdAt)}
              </span>
            </li>
          );
        }
        const mine = viewer === "team" ? e.fromTeam : !e.fromTeam;
        return (
          <li key={e.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
            <span className="mb-1.5 flex items-center gap-2 px-1 text-[13px] text-[#0d0d50]/50">
              {e.fromTeam ? (
                <>
                  {/* Team replies are signed with the admin's initials. */}
                  {e.authorName && e.authorName.length <= 4 ? <AccountAvatar initials={e.authorName} master /> : null}
                  <span className="text-[12.5px] font-semibold text-[#0d0d50]/75">Synora team</span>
                  {e.authorName.length > 4 && <span className="font-semibold text-[#0d0d50]/75">{e.authorName}</span>}
                </>
              ) : (
                <span className="font-semibold text-[#0d0d50]/75">{viewer === "sender" ? "You" : e.authorName}</span>
              )}
              · {when(e.createdAt)}
              {e.viaEmail && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f2ff] px-2 py-0.5 text-[11px] font-semibold text-[#4b4bea]">
                  <Mail className="h-3 w-3" /> Sent by email
                </span>
              )}
            </span>
            <div
              className={`max-w-[92%] whitespace-pre-wrap break-words rounded-[1.4rem] px-5 py-4 text-[16px] leading-[1.7] sm:max-w-[80%] ${
                mine ? "rounded-tr-md bg-[#6666ff] text-white" : "rounded-tl-md border border-[#0d0d50]/[0.08] bg-white text-[#0d0d50]/85"
              }`}
            >
              {e.body}
            </div>
            {e.statusTo && <span className="mt-1.5 px-1 text-[12.5px] text-[#0d0d50]/50">and marked it {statusLabel(kind, e.statusTo)}</span>}
          </li>
        );
      })}
    </ol>
  );
}
