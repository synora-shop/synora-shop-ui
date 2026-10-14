"use client";

import { useState } from "react";
import type { ChangeKind, Note } from "@/lib/release-notes";

/**
 * The release notes as a timeline, with a filter: everything, or only what is
 * new, improved or fixed. A release with nothing of the chosen kind steps out
 * of the way rather than showing empty.
 */
export const KIND_TONE: Record<ChangeKind, string> = {
  New: "bg-[#6666ff] text-white",
  Improved: "bg-[#c8e7ff] text-[#0d0d50]",
  Fixed: "bg-[#b8efd6] text-[#0d0d50]",
};

export function ReleaseTimeline({ notes }: { notes: Note[] }) {
  const [only, setOnly] = useState<ChangeKind | null>(null);
  const shown = notes.map((n) => ({ ...n, changes: only ? n.changes.filter((c) => c.kind === only) : n.changes })).filter((n) => n.changes.length > 0);
  const count = (k: ChangeKind) => notes.reduce((t, n) => t + n.changes.filter((c) => c.kind === k).length, 0);

  return (
    <>
      <div role="group" aria-label="Show" className="mb-10 flex flex-wrap gap-2">
        {([null, "New", "Improved", "Fixed"] as (ChangeKind | null)[]).map((k) => {
          const on = only === k;
          return (
            <button
              key={k ?? "all"}
              type="button"
              aria-pressed={on}
              onClick={() => setOnly(k)}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                on ? "bg-[#0d0d50] text-white" : "bg-[#f2f2ff] text-[#0d0d50]/70 hover:text-[#0d0d50]"
              }`}
            >
              {k ?? "Everything"}
              {k && <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/20" : "bg-white"}`}>{count(k)}</span>}
            </button>
          );
        })}
      </div>

      <ol className="relative">
        {shown.map(({ id, dateLabel, title, changes }, i) => {
          const latest = id === notes[0]?.id;
          return (
            <li key={id} id={id} className="relative grid scroll-mt-28 gap-4 pb-10 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
              <div className="relative flex items-center gap-3 lg:block lg:pt-8">
                <span className={`relative z-10 grid h-4 w-4 place-items-center rounded-full ${latest ? "bg-[#6666ff] ring-4 ring-[#6666ff]/20" : "bg-white ring-2 ring-[#0d0d50]/20"}`} />
                <p className="text-sm font-semibold text-[#0d0d50]/70 lg:mt-3">{dateLabel}</p>
                {i < shown.length - 1 && <span aria-hidden className="absolute left-[7px] top-12 hidden h-[calc(100%+2.5rem)] w-px bg-[#0d0d50]/10 lg:block" />}
              </div>
              <article className={`rounded-[2rem] border p-6 sm:p-9 ${latest ? "border-transparent bg-[linear-gradient(140deg,#f3f3ff_0%,#eef8ff_60%,#effcf6_100%)]" : "border-[#0d0d50]/[0.08] bg-white"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[1.6rem] font-semibold leading-tight tracking-[-0.03em]">{title}</h2>
                  {latest && <span className="rounded-full bg-[#0d0d50] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">Latest</span>}
                </div>
                <ul className="mt-6 flex flex-col gap-3.5">
                  {changes.map(({ kind, text }) => (
                    <li key={text} className="flex flex-col items-start gap-2 sm:flex-row sm:gap-4">
                      <span className={`mt-1 w-[5.5rem] shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-semibold ${KIND_TONE[kind]}`}>{kind}</span>
                      <p className="text-[17px] leading-[1.7] text-[#0d0d50]/80">{text}</p>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          );
        })}
      </ol>
    </>
  );
}
