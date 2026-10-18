"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SIDE } from "@/components/next-admin/ui";

/**
 * A long page of settings as open sections (third design), with a slim index
 * beside it that lights the section you are reading (iris tint) and a filter
 * that narrows both as you type.
 */
export type Section = { id: string; label: string; blurb: string; body: ReactNode };

export function Sections({ sections }: { sections: Section[] }) {
  const [at, setAt] = useState(sections[0]?.id);
  const [q, setQ] = useState("");
  useEffect(() => {
    const io = new IntersectionObserver((es) => {
      const top = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setAt(top.target.id);
    }, { rootMargin: "-70px 0px -60% 0px" });
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [sections]);
  useEffect(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) el.hidden = !words.every((w) => el.innerText.toLowerCase().includes(w) || s.label.toLowerCase().includes(w));
    });
  }, [q, sections]);
  return (
    <div className="grid gap-4 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
      <nav aria-label="On this page" className={`${SIDE.wrap} lg:sticky lg:top-[72px] lg:self-start`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a setting" aria-label="Find a setting" className={SIDE.find} />
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-px">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setAt(s.id)} className={`${SIDE.item} ${at === s.id ? SIDE.on : SIDE.off}`}>{s.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-col gap-5">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-[72px]">
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-[14px] font-semibold">{s.label}</h2>
              <p className="text-[12.5px] text-[#737373]">{s.blurb}</p>
            </div>
            <div className="flex flex-col gap-2.5">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** The announcement bar's words, shown on a bar as they are typed. */
export function AnnouncementEditor() {
  const [text, setText] = useState("Free delivery on orders over 10,000 · Eid orders close 28 Oct");
  const [colour, setColour] = useState("#0a0a0a");
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#ebebeb] bg-white">
      <div className="border-b border-[#f1f1f1] bg-[#fafafa] p-3">
        <div className="overflow-hidden rounded-[10px] ring-1 ring-[#ebebeb]">
          <p className="truncate px-3 py-1.5 text-center text-[12px] font-medium text-white" style={{ background: colour }}>{text || " "}</p>
          <div className="flex items-center justify-between bg-white px-3 py-2 text-[11.5px] text-[#a3a3a3]"><span className="font-bold text-[#0a0a0a]">ZOHRA LAWN</span><span>Shop · About · Bag</span></div>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-1 flex justify-between text-[12.5px] font-medium text-[#3a3a3a]">Text <span className="font-normal text-[#a3a3a3]">{text.length} of 90</span></span>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={90} className="h-8 w-full rounded-[10px] border border-[#dddddd] px-2.5 text-[13px] outline-none focus:border-[#6666ff]" />
        </label>
        <div>
          <span className="mb-1 block text-[12.5px] font-medium text-[#3a3a3a]">Background</span>
          <div className="flex h-8 items-center gap-1.5">
            {["#0a0a0a", "#6666ff", "#15803d", "#b45309", "#b91c1c"].map((c) => (
              <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={colour === c} onClick={() => setColour(c)} className={`h-6 w-6 rounded-full ring-offset-2 ${colour === c ? "ring-2 ring-[#6666ff]" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
