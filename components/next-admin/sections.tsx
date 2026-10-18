"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SEL } from "@/components/next-admin/ui";

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
      <nav aria-label="On this page" className="lg:sticky lg:top-[64px] lg:self-start">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a setting" aria-label="Find a setting" className="mb-2 h-8 w-full rounded-[6px] bg-white px-2.5 text-[13px] outline-none ring-1 ring-inset ring-[#d4d4d8] focus:ring-[#5b5bf0]" />
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-px">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setAt(s.id)} className={`block whitespace-nowrap rounded-[6px] px-2.5 py-1.5 text-[13px] ${at === s.id ? `${SEL} font-medium` : "text-[#52525b] hover:bg-white hover:text-[#18181b]"}`}>{s.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-col gap-5">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-[64px]">
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="text-[14px] font-semibold">{s.label}</h2>
              <p className="text-[12.5px] text-[#71717a]">{s.blurb}</p>
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
  const [colour, setColour] = useState("#18181b");
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
      <div className="border-b border-[#f0f0f2] bg-[#fafafa] p-3">
        <div className="overflow-hidden rounded-[6px] ring-1 ring-[#e4e4e7]">
          <p className="truncate px-3 py-1.5 text-center text-[12px] font-medium text-white" style={{ background: colour }}>{text || " "}</p>
          <div className="flex items-center justify-between bg-white px-3 py-2 text-[11.5px] text-[#a1a1aa]"><span className="font-bold text-[#18181b]">ZOHRA LAWN</span><span>Shop · About · Bag</span></div>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="mb-1 flex justify-between text-[12.5px] font-medium text-[#3f3f46]">Text <span className="font-normal text-[#a1a1aa]">{text.length} of 90</span></span>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={90} className="h-8 w-full rounded-[6px] border border-[#d4d4d8] px-2.5 text-[13px] outline-none focus:border-[#5b5bf0]" />
        </label>
        <div>
          <span className="mb-1 block text-[12.5px] font-medium text-[#3f3f46]">Background</span>
          <div className="flex h-8 items-center gap-1.5">
            {["#18181b", "#5b5bf0", "#15803d", "#b45309", "#b91c1c"].map((c) => (
              <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={colour === c} onClick={() => setColour(c)} className={`h-6 w-6 rounded-full ring-offset-2 ${colour === c ? "ring-2 ring-[#5b5bf0]" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
