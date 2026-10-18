"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search, X } from "lucide-react";
import { SEL } from "@/components/next-admin/ui";

/**
 * The third design's pieces that answer back (/next-admin, 18 October).
 * Everything chosen wears the iris tint from ui.tsx, never solid black.
 */

export const ToastCtx = createContext<(text: string, undo?: () => void) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/** A switch. On is iris, so it never reads as a black button. */
export function Toggle({ on: start = false, label, onChange }: { on?: boolean; label: string; onChange?: (on: boolean) => void }) {
  const [on, setOn] = useState(start);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => { setOn(!on); onChange?.(!on); }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-[#6666ff]" : "bg-[#dddddd]"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left] ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

/** One of a few, as rows with a radio. */
export function Choice({ options, start = 0, name }: { options: { label: string; hint?: string }[]; start?: number; name: string }) {
  const [at, setAt] = useState(start);
  return (
    <div role="radiogroup" aria-label={name} className="divide-y divide-[#f1f1f1]">
      {options.map((o, i) => (
        <button key={o.label} type="button" role="radio" aria-checked={at === i} onClick={() => setAt(i)} className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left ${at === i ? "bg-[#f5f5ff]" : "hover:bg-[#fafafa]"}`}>
          <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${at === i ? "border-[#6666ff]" : "border-[#a3a3a3]"}`}>
            {at === i && <span className="h-2 w-2 rounded-full bg-[#6666ff]" />}
          </span>
          <span>
            <span className="block text-[13px] font-medium">{o.label}</span>
            {o.hint && <span className="block text-[12.5px] text-[#737373]">{o.hint}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Option cards: a few big choices side by side. Chosen is tinted. */
export function Cards<K extends string>({ options, value, onChange, label }: { options: { id: K; label: string; hint?: string }[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)} className={`rounded-[10px] px-3 py-2.5 text-left transition-colors ${value === o.id ? SEL : "ring-1 ring-inset ring-[#ebebeb] hover:ring-[#a3a3a3]"}`}>
          <span className="block text-[13px] font-semibold">{o.label}</span>
          {o.hint && <span className={`block text-[12px] ${value === o.id ? "text-[#4b4bea]/80" : "text-[#737373]"}`}>{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

/** Views of a list: underlined words, counted. Chosen is iris. */
export function Tabs({ items, value, onChange, counts }: { items: string[]; value: string; onChange: (v: string) => void; counts?: Record<string, number> }) {
  return (
    <div role="tablist" className="flex min-w-0 gap-4 overflow-x-auto [scrollbar-width:none]">
      {items.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={value === t}
          onClick={() => onChange(t)}
          className={`relative h-11 shrink-0 whitespace-nowrap text-[13.5px] font-semibold transition-colors ${value === t ? "text-[#3d3dc4]" : "text-[#737373] hover:text-[#0a0a0a]"}`}
        >
          {t}
          {counts?.[t] !== undefined && <span className={`ml-1.5 tabular-nums ${value === t ? "text-[#4b4bea]/70" : "text-[#a3a3a3]"}`}>{counts[t]}</span>}
          {value === t && <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#6666ff]" />}
        </button>
      ))}
    </div>
  );
}

/** A small segmented choice (periods, columns). */
export function Seg({ items, value: given, onChange, label, start }: { items: string[]; value?: string; onChange?: (v: string) => void; label: string; start?: string }) {
  // Keeps its own choice when the page does not hold it (a server page cannot pass a handler).
  const [own, setOwn] = useState(start ?? items[0]);
  const value = given ?? own;
  const pick = (v: string) => (onChange ? onChange(v) : setOwn(v));
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-8 items-center gap-0.5 rounded-[10px] bg-white p-0.5 ring-1 ring-inset ring-[#dddddd]">
      {items.map((t) => (
        <button key={t} type="button" role="radio" aria-checked={value === t} onClick={() => pick(t)} className={`h-7 rounded-[8px] px-2.5 text-[12.5px] font-medium ${value === t ? SEL : "text-[#555555] hover:text-[#0a0a0a]"}`}>{t}</button>
      ))}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-white px-2.5 ring-1 ring-inset ring-[#dddddd] focus-within:ring-[#6666ff] sm:max-w-xs">
      <Search className="h-3.5 w-3.5 shrink-0 text-[#a3a3a3]" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]" />
      {value && <button type="button" aria-label="Clear search" onClick={() => onChange("")}><X className="h-3.5 w-3.5 text-[#a3a3a3]" /></button>}
    </label>
  );
}

export const check = "h-3.5 w-3.5 rounded-[6px] align-middle accent-[#6666ff]";

/** Sorting: a click on a heading sorts by it; again turns it round. */
export type Sort = { key: string; desc: boolean } | null;
type V = string | number;
const cmp = (a: V, b: V) => (typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" }));
export function useSort<R>(rows: R[], by: Record<string, (r: R) => V>) {
  const [sort, setSort] = useState<Sort>(null);
  const sorted = sort && by[sort.key] ? [...rows].sort((a, b) => cmp(by[sort.key](a), by[sort.key](b)) * (sort.desc ? -1 : 1)) : rows;
  const click = (key: string) => setSort(sort?.key === key ? (sort.desc ? null : { key, desc: true }) : { key, desc: false });
  return { sorted, sort, click };
}
export function SortTh({ k, label, sort, onSort, right = false, className = "" }: { k: string; label: string; sort: Sort; onSort: (k: string) => void; right?: boolean; className?: string }) {
  const on = sort?.key === k;
  const Arrow = !on ? ChevronsUpDown : sort.desc ? ArrowDown : ArrowUp;
  return (
    <th aria-sort={on ? (sort.desc ? "descending" : "ascending") : "none"} className={`h-9 border-b border-[#0a0a0a]/[0.06] bg-[#fafafa] px-3 text-[11.5px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}>
      <button type="button" onClick={() => onSort(k)} className={`group/s inline-flex items-center gap-1 ${right ? "flex-row-reverse" : ""} ${on ? "text-[#4b4bea]" : "text-[#0a0a0a]/45 hover:text-[#0a0a0a]"}`}>
        {label}
        <Arrow className={`h-3 w-3 ${on ? "" : "opacity-0 group-hover/s:opacity-60"}`} />
      </button>
    </th>
  );
}

/** What ticked rows can have done to them: a bar that rises from the foot. */
export function BulkBar({ count, noun, onClear, children }: { count: number; noun: string; onClear: () => void; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-1 rounded-[14px] bg-[#0a0a0a] p-1.5 pl-4 text-white shadow-[0_18px_50px_-16px_rgba(0,0,0,0.55)] lg:left-[13.5rem]">
      <span className="mr-auto text-[13px] font-medium">{count} {noun}{count > 1 ? "s" : ""} selected</span>
      {children}
      <button type="button" aria-label="Clear selection" onClick={onClear} className="grid h-8 w-8 place-items-center rounded-[10px] hover:bg-white/10"><X className="h-4 w-4" /></button>
    </div>
  );
}
export const barBtn = "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-[13px] font-medium hover:bg-white/10 [&_svg]:h-4 [&_svg]:w-4";
