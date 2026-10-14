"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { ICONS, TONE } from "@/components/new-admin/ui";
import type { Tone } from "@/lib/new-admin/sample";

/**
 * Small interactive pieces for the new admin's preview (15 October): a switch
 * that switches, a choice that chooses, and an index that follows you down a
 * long page. Nothing is saved; this is a preview.
 */
export function Toggle({ on: start = false, label }: { on?: boolean; label: string }) {
  const [on, setOn] = useState(start);
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => setOn(!on)} className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-[#0a0a0a]" : "bg-[#0a0a0a]/15"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

export function Choice({ options, start = 0, name }: { options: { label: string; hint?: string }[]; start?: number; name: string }) {
  const [at, setAt] = useState(start);
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-col">
      {options.map((o, i) => (
        <button key={o.label} type="button" role="radio" aria-checked={at === i} onClick={() => setAt(i)} className="flex items-start gap-3 px-5 py-3.5 text-left hover:bg-[#fafafa]">
          <span className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 ${at === i ? "border-[#0a0a0a]" : "border-[#0a0a0a]/25"}`}>
            {at === i && <span className="h-2 w-2 rounded-full bg-[#0a0a0a]" />}
          </span>
          <span>
            <span className="block text-[14.5px] font-medium">{o.label}</span>
            {o.hint && <span className="block text-[13px] text-[#0a0a0a]/55">{o.hint}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** A labelled box that looks like the field it will be. */
export function Field({ label, value, hint, area = false }: { label: string; value: string; hint?: string; area?: boolean }) {
  return (
    <label className="block px-5 py-3.5">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      <span className={`block rounded-[10px] bg-white px-3.5 text-[14.5px] ring-1 ring-[#0a0a0a]/15 ${area ? "py-2.5 leading-relaxed" : "py-2"}`}>{value}</span>
      {hint && <span className="mt-1 block text-[12.5px] text-[#0a0a0a]/50">{hint}</span>}
    </label>
  );
}

/** One line of a settings card: what it is, what it is set to, and its control. */
export function Row({ label, value, right, icon }: { label: ReactNode; value?: ReactNode; right?: ReactNode; icon?: string }) {
  const Icon = icon ? ICONS[icon] : null;
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafafa]">
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0 text-[#0a0a0a]/55" />}
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-medium">{label}</div>
        {value && <div className="mt-0.5 text-[13.5px] text-[#0a0a0a]/55">{value}</div>}
      </div>
      {right ?? <ChevronRight className="h-4 w-4 shrink-0 text-[#0a0a0a]/30" />}
    </div>
  );
}

export function Box({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.08]">
      {title && <p className="border-b border-[#0a0a0a]/[0.06] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">{title}</p>}
      <div className="divide-y divide-[#0a0a0a]/[0.06]">{children}</div>
    </div>
  );
}

/**
 * The index beside a long page of open sections. The section being read is
 * lit in black with its own colour; a click scrolls there and lights at once.
 * A long index scrolls inside itself and keeps the lit entry in view, so
 * nothing falls off a short laptop screen. On a phone it is a strip.
 */
export function SectionIndex({ items, title }: { items: { id: string; label: string; tone: Tone; icon: string; group?: string }[]; title: string }) {
  const [active, setActive] = useState(items[0]?.id);
  const [progress, setProgress] = useState(0);
  const list = useRef<HTMLUListElement>(null);
  const hold = useRef(0);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      setProgress(Math.min(1, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight)));
      if (Date.now() < hold.current) return;
      let cur = items[0]?.id;
      for (const { id } of items) {
        const el = document.getElementById(id);
        if (el && !el.hidden && el.getBoundingClientRect().top <= 150) cur = id;
      }
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) cur = [...items].reverse().find(({ id }) => !document.getElementById(id)?.hidden)?.id ?? cur;
      setActive(cur);
    };
    const on = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(frame);
    };
  }, [items]);
  // Keep the lit entry visible inside the index, without moving the page.
  useEffect(() => {
    const ul = list.current;
    const li = ul?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!ul || !li) return;
    if (ul.scrollHeight > ul.clientHeight) {
      const top = li.offsetTop - ul.offsetTop;
      if (top < ul.scrollTop + 8 || top + li.offsetHeight > ul.scrollTop + ul.clientHeight - 8) ul.scrollTo({ top: top - ul.clientHeight / 2, behavior: "smooth" });
    } else if (ul.scrollWidth > ul.clientWidth) {
      ul.scrollTo({ left: li.offsetLeft - 16, behavior: "smooth" });
    }
  }, [active]);
  const at = items.findIndex((i) => i.id === active);
  return (
    <nav aria-label={title} className="flex min-h-0 flex-col">
      <div className="mb-2 hidden items-center justify-between px-3 lg:flex">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]/45">{title}</p>
        <span className="text-[11.5px] font-semibold tabular-nums text-[#0a0a0a]/35">{at + 1} of {items.length}</span>
      </div>
      <span aria-hidden className="mx-3 mb-2 hidden h-[3px] overflow-hidden rounded-full bg-[#0a0a0a]/[0.07] lg:block">
        <span className="block h-full rounded-full bg-[#0a0a0a] transition-[width] duration-150" style={{ width: `${Math.max(4, progress * 100)}%` }} />
      </span>
      <ul ref={list} className="-mx-1 flex min-h-0 gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:overflow-x-visible">
        {items.map(({ id, label, tone, icon, group }, i) => {
          const Icon = ICONS[icon];
          const on = id === active;
          const head = group && group !== items[i - 1]?.group;
          return (
            <li key={id} data-id={id}>
              {head && <p className={`hidden px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a]/35 lg:block ${i > 0 ? "pt-3" : ""}`}>{group}</p>}
              <a
                href={`#${id}`}
                onClick={(e) => {
                  const el = document.getElementById(id);
                  if (!el) return;
                  e.preventDefault();
                  hold.current = Date.now() + 900;
                  setActive(id);
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${id}`);
                }}
                aria-current={on ? "location" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-[10px] px-2.5 py-[7px] text-[13.5px] transition-colors ${on ? "bg-[#0a0a0a] font-semibold text-white" : "text-[#0a0a0a]/60 hover:bg-[#0a0a0a]/[0.04] hover:text-[#0a0a0a]"}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${on ? (tone === "ink" ? "bg-white text-[#0a0a0a]" : TONE[tone].chip) : "bg-[#0a0a0a]/[0.05]"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** The announcement bar's words, shown on a bar as they are typed. */
export function AnnouncementEditor() {
  const [text, setText] = useState("Free delivery on orders over 10,000 · Eid orders close 28 Oct");
  const [colour, setColour] = useState("#0a0a0a");
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.08]">
      <div className="px-5 pt-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">As customers see it</p>
        <div className="overflow-hidden rounded-xl ring-1 ring-[#0a0a0a]/10">
          <p className="truncate px-4 py-2 text-center text-[12.5px] font-medium text-white" style={{ background: colour }}>{text || " "}</p>
          <div className="flex items-center justify-between bg-white px-4 py-3 text-[12px] text-[#0a0a0a]/45"><span className="font-bold text-[#0a0a0a]">ZOHRA LAWN</span><span>Shop · About · Bag</span></div>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Text</span>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={90} className="h-10 w-full rounded-[10px] px-3.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/15 focus:ring-2 focus:ring-[#0a0a0a]" />
          <span className="mt-1 block text-[12px] text-[#0a0a0a]/45">{text.length} of 90</span>
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] font-semibold">Background</span>
          <div className="flex gap-1.5">
            {["#0a0a0a", "#6666ff", "#1f9d68", "#b45309", "#a3330c"].map((c) => (
              <button key={c} type="button" aria-label={`Colour ${c}`} aria-pressed={colour === c} onClick={() => setColour(c)} className={`h-9 w-9 rounded-full ring-offset-2 ${colour === c ? "ring-2 ring-[#0a0a0a]" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Narrows a page of open sections as you type: "jazz", "password", "domain"
 * leave only the sections that mention it (and their index entries).
 */
export function SectionFilter() {
  const [q, setQ] = useState("");
  useEffect(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    document.querySelectorAll<HTMLElement>("[data-open-section]").forEach((el) => {
      const hit = words.every((w) => (el.dataset.openSection ?? "").includes(w) || el.innerText.toLowerCase().includes(w));
      el.hidden = !hit;
      const link = document.querySelector<HTMLElement>(`nav a[href="#${el.id}"]`)?.parentElement;
      if (link) link.hidden = !hit;
    });
  }, [q]);
  return (
    <input
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder="Find a setting"
      aria-label="Find a setting"
      className="h-10 w-full rounded-[10px] bg-white px-3.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/12 focus:ring-2 focus:ring-[#0a0a0a]"
    />
  );
}
