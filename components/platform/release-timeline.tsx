"use client";

import { useState } from "react";
import { CHANGE_KINDS, type ChangeKind, type Note } from "@/lib/release-notes";

/**
 * The release notes as a timeline (14 October), made to be scanned: grouped
 * by month under a label that stays in view, each release a calendar tile and
 * a card whose changes are sorted into New, Improved and Fixed, each under its
 * own colour. A filter on top narrows it to one kind; a release with none of
 * that kind steps out of the way.
 */
export const KIND_TONE: Record<ChangeKind, string> = {
  New: "bg-[#6666ff] text-white",
  Improved: "bg-[#c8e7ff] text-[#0d0d50]",
  Fixed: "bg-[#b8efd6] text-[#0d0d50]",
};
const KIND_BAR: Record<ChangeKind, string> = { New: "bg-[#6666ff]", Improved: "bg-[#3d97e0]", Fixed: "bg-[#2fb37c]" };
const KIND_HEAD: Record<ChangeKind, string> = { New: "text-[#4b4bea]", Improved: "text-[#1b5d97]", Fixed: "text-[#16704a]" };

const month = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric" });
const mon = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", month: "short" });
const wday = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short" });

export function ReleaseFilter({ notes, only, setOnly }: { notes: Note[]; only: ChangeKind | null; setOnly: (k: ChangeKind | null) => void }) {
  const count = (k: ChangeKind) => notes.reduce((t, n) => t + n.changes.filter((c) => c.kind === k).length, 0);
  return (
    <div role="group" aria-label="Show" className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {([null, ...CHANGE_KINDS] as (ChangeKind | null)[]).map((k) => {
        const on = only === k;
        return (
          <button
            key={k ?? "all"}
            type="button"
            aria-pressed={on}
            onClick={() => setOnly(k)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${on ? "bg-[#0d0d50] text-white" : "bg-white/80 text-[#0d0d50]/70 ring-1 ring-[#0d0d50]/[0.06] hover:text-[#0d0d50]"}`}
          >
            {k && <span className={`h-2 w-2 rounded-full ${KIND_BAR[k]}`} />}
            {k ?? "Everything"}
            {k && <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/20" : "bg-[#f2f2f7]"}`}>{count(k)}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ReleaseTimeline({ notes }: { notes: Note[] }) {
  const [only, setOnly] = useState<ChangeKind | null>(null);
  const shown = notes.map((n) => ({ ...n, changes: only ? n.changes.filter((c) => c.kind === only) : n.changes })).filter((n) => n.changes.length > 0);
  const months = shown.reduce<{ label: string; notes: typeof shown }[]>((acc, n) => {
    const label = month(n.date);
    const last = acc[acc.length - 1];
    if (last?.label === label) last.notes.push(n);
    else acc.push({ label, notes: [n] });
    return acc;
  }, []);

  return (
    <>
      <div className="sticky top-[76px] z-20 -mx-5 border-b border-[#0d0d50]/[0.06] bg-white/90 px-5 py-3 backdrop-blur-md sm:top-[84px]">
        <div className="mx-auto max-w-[62rem]">
          <ReleaseFilter notes={notes} only={only} setOnly={setOnly} />
        </div>
      </div>

      <div className="mx-auto flex max-w-[62rem] flex-col gap-10 pt-8">
        {months.map(({ label, notes: inMonth }) => (
          <section key={label} aria-label={label}>
            <h2 className="mb-4 flex items-center gap-3 text-[13px] font-bold uppercase tracking-[0.14em] text-[#1b5d97]">
              {label}
              <span className="h-px flex-1 bg-[#2f86cf]/20" />
            </h2>
            <ol className="flex flex-col gap-4">
              {inMonth.map(({ id, date, title, changes }) => {
                const latest = id === notes[0]?.id;
                const groups = CHANGE_KINDS.map((k) => [k, changes.filter((c) => c.kind === k)] as const).filter(([, cs]) => cs.length > 0);
                return (
                  <li key={id} id={id} className="grid scroll-mt-40 grid-cols-[4.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-5">
                    <div className={`flex h-[4.75rem] flex-col items-center justify-center rounded-2xl sm:h-[5.25rem] ${latest ? "bg-[#2f86cf] text-white" : "bg-[#eef6ff] text-[#0d0d50]"}`}>
                      <span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${latest ? "text-white/75" : "text-[#1b5d97]"}`}>{mon(date)}</span>
                      <span className="text-[1.75rem] font-semibold leading-none tracking-[-0.03em]">{day(date)}</span>
                      <span className={`text-[11px] font-medium ${latest ? "text-white/70" : "text-[#0d0d50]/45"}`}>{wday(date)}</span>
                    </div>
                    <article className={`min-w-0 rounded-[1.5rem] p-5 sm:p-6 ${latest ? "bg-[linear-gradient(140deg,#eaf4ff_0%,#f1f0ff_60%,#effcf6_100%)] ring-1 ring-[#2f86cf]/20" : "bg-white ring-1 ring-[#0d0d50]/[0.08]"}`}>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-[1.3rem] font-semibold leading-tight tracking-[-0.025em]">{title}</h3>
                        {latest && <span className="rounded-full bg-[#0d0d50] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white">Latest</span>}
                      </div>
                      <div className="mt-4 flex flex-col gap-4">
                        {groups.map(([k, cs]) => (
                          <div key={k} className="flex gap-3.5">
                            <span className={`w-1 shrink-0 rounded-full ${KIND_BAR[k]}`} />
                            <div className="min-w-0">
                              <p className={`text-[12px] font-bold uppercase tracking-[0.1em] ${KIND_HEAD[k]}`}>{k}</p>
                              <ul className="mt-1.5 flex flex-col gap-1.5">
                                {cs.map((c) => (
                                  <li key={c.text} className="text-[16px] leading-[1.6] text-[#0d0d50]/85">
                                    {c.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
