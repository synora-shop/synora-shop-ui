"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteReleaseNote, saveReleaseNote } from "@/app/synora/actions";
import { CHANGE_KINDS, type ChangeKind, type Note } from "@/lib/release-notes";
import { KIND_TONE } from "@/components/platform/release-timeline";

/**
 * Writing the release notes (14 October). The form on one side and, beside
 * it, the note exactly as merchants will see it at /release-notes. The list
 * under it is every note published, each editable or removable.
 */
type Draft = { id?: string; title: string; date: string; changes: { kind: ChangeKind; text: string }[] };
const today = () => new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10); // Pakistan's date
const blank = (): Draft => ({ title: "", date: today(), changes: [{ kind: "New", text: "" }] });
const label = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }) : "");

export function ReleaseEditor({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(blank);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const set = (patch: Partial<Draft>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...patch }));
  };
  const setChange = (i: number, patch: Partial<Draft["changes"][number]>) => set({ changes: draft.changes.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const save = () =>
    start(async () => {
      setError(null);
      const r = await saveReleaseNote({ ...draft, changes: draft.changes.filter((c) => c.text.trim()) });
      if (!r.ok) return setError(r.error);
      setDraft(blank());
      setSaved(true);
      router.refresh();
    });


  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6 2xl:grid-cols-2">
        {/* The form. */}
        <section className="rounded-[1.6rem] bg-white p-6 ring-1 ring-[#0d0d50]/[0.06]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold">{draft.id ? "Edit release" : "New release"}</h2>
            {draft.id && (
              <button type="button" onClick={() => setDraft(blank())} className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0d0d50]/55 hover:text-[#0d0d50]">
                <X className="h-4 w-4" /> Cancel editing
              </button>
            )}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold">Title</span>
              <input value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="Faster checkout" maxLength={120} className="desk-field h-11" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13.5px] font-semibold">Went out on</span>
              <input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} className="desk-field h-11" />
            </label>
          </div>

          <p className="mb-2 mt-5 text-[13.5px] font-semibold">Changes</p>
          <ol className="flex flex-col gap-3">
            {draft.changes.map((c, i) => (
              <li key={i} className="flex gap-2.5 rounded-2xl bg-[#f8f8fb] p-3">
                <div className="flex shrink-0 flex-col gap-1" role="radiogroup" aria-label={`Change ${i + 1} kind`}>
                  {CHANGE_KINDS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={c.kind === k}
                      onClick={() => setChange(i, { kind: k })}
                      className={`w-[5.5rem] rounded-full px-2 py-1 text-[12px] font-semibold transition-opacity ${KIND_TONE[k]} ${c.kind === k ? "" : "opacity-30 hover:opacity-60"}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                <label className="sr-only" htmlFor={`change-${i}`}>
                  Change {i + 1}
                </label>
                <textarea
                  id={`change-${i}`}
                  value={c.text}
                  onChange={(e) => setChange(i, { text: e.target.value })}
                  rows={3}
                  maxLength={600}
                  placeholder="What changed, in words a shop owner uses."
                  className="desk-field min-w-0 flex-1 resize-y py-2.5 leading-relaxed"
                />
                {draft.changes.length > 1 && (
                  <button type="button" aria-label="Remove change" onClick={() => set({ changes: draft.changes.filter((_, j) => j !== i) })} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#0d0d50]/40 hover:bg-white hover:text-[#c2410c]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => set({ changes: [...draft.changes, { kind: "Fixed", text: "" }] })} className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] font-semibold text-[#4b4bea] hover:bg-[#f2f2ff]">
            <Plus className="h-4 w-4" /> Add a change
          </button>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" onClick={save} disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#6666ff] px-6 text-[14.5px] font-semibold text-white hover:bg-[#5a5af5] disabled:opacity-50">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {draft.id ? "Save changes" : "Publish"}
            </button>
            <span role="status" className={`text-[13.5px] font-medium ${error ? "text-[#c2410c]" : "text-[#1d7a52]"}`}>
              {error ?? (saved ? "Published. It's on /release-notes now." : "")}
            </span>
          </div>
        </section>

        {/* As merchants will see it. */}
        <section>
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0d0d50]/40">Preview</p>
          <div className="rounded-[2rem] bg-[linear-gradient(140deg,#f3f3ff_0%,#eef8ff_60%,#effcf6_100%)] p-7">
            <p className="text-[13px] font-semibold text-[#0d0d50]/55">{label(draft.date)}</p>
            <h3 className="mt-1 text-[1.5rem] font-semibold leading-tight tracking-[-0.03em]">{draft.title || "Your title"}</h3>
            <ul className="mt-5 flex flex-col gap-3">
              {draft.changes.map((c, i) => (
                <li key={i} className="flex flex-col items-start gap-2 sm:flex-row sm:gap-4">
                  <span className={`mt-1 w-[5.5rem] shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-semibold ${KIND_TONE[c.kind]}`}>{c.kind}</span>
                  <p className={`text-[16px] leading-[1.7] ${c.text ? "text-[#0d0d50]/80" : "text-[#0d0d50]/30"}`}>{c.text || "What changed."}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Everything published. */}
      <section>
        <h2 className="text-[18px] font-semibold">Published <span className="text-[#0d0d50]/40">{notes.length}</span></h2>
        <ul className="mt-4 overflow-hidden rounded-[1.6rem] bg-white ring-1 ring-[#0d0d50]/[0.06]">
          {notes.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center gap-4 border-b border-[#0d0d50]/[0.06] px-5 py-4 last:border-b-0">
              <span className="w-32 shrink-0 text-[13px] font-semibold text-[#0d0d50]/50">{n.dateLabel}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{n.title}</span>
                <span className="flex gap-1.5 pt-1">
                  {CHANGE_KINDS.map((k) => {
                    const count = n.changes.filter((c) => c.kind === k).length;
                    return count ? <span key={k} className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${KIND_TONE[k]}`}>{count} {k}</span> : null;
                  })}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setDraft({ id: n.id, title: n.title, date: n.date, changes: n.changes });
                  setSaved(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold text-[#4b4bea] hover:bg-[#f2f2ff]"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!window.confirm(`Remove "${n.title}" from the release notes?`)) return;
                  start(async () => {
                    await deleteReleaseNote(n.id);
                    router.refresh();
                  });
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold text-[#0d0d50]/50 hover:bg-[#fff4ee] hover:text-[#c2410c]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
