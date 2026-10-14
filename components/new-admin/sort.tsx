"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, X } from "lucide-react";

/**
 * Every list sorts by any column (preview, 15 October). A click on a heading
 * sorts by it, A to Z or low to high; a second click turns it round. The
 * table says what it is sorted by, in words, with a way back to the start.
 */
export type SortValue = string | number;
export type Sort = { key: string; desc: boolean } | null;

const cmp = (a: SortValue, b: SortValue) =>
  typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "en", { numeric: true, sensitivity: "base" });

export function useSort<T>(rows: T[], by: Record<string, (r: T) => SortValue>) {
  const [sort, setSort] = useState<Sort>(null);
  const sorted = sort && by[sort.key] ? [...rows].sort((a, b) => cmp(by[sort.key](a), by[sort.key](b)) * (sort.desc ? -1 : 1)) : rows;
  const click = (key: string) => setSort(sort?.key === key ? { key, desc: !sort.desc } : { key, desc: false });
  return { sorted, sort, click, reset: () => setSort(null) };
}

/** A column heading that sorts. Black head, white words, the arrow in iris. */
export function SortTh({ k, label, sort, onSort, align = "left", className = "" }: { k: string; label: string; sort: Sort; onSort: (k: string) => void; align?: "left" | "right"; className?: string }) {
  const on = sort?.key === k;
  const Arrow = !on ? ChevronsUpDown : sort.desc ? ArrowDown : ArrowUp;
  return (
    <th aria-sort={on ? (sort.desc ? "descending" : "ascending") : "none"} className={`px-2 py-1.5 ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      <button
        type="button"
        onClick={() => onSort(k)}
        title={on ? (sort.desc ? "Sorted high to low. Click for low to high." : "Sorted low to high. Click for high to low.") : `Sort by ${label.toLowerCase()}`}
        className={`group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors ${align === "right" ? "flex-row-reverse" : ""} ${on ? "bg-white/[0.12] text-white" : "text-white/55 hover:bg-white/[0.07] hover:text-white"}`}
      >
        {label}
        <Arrow className={`h-3.5 w-3.5 ${on ? "text-[#b7b9ff]" : "opacity-0 group-hover:opacity-60"}`} />
      </button>
    </th>
  );
}

/** A plain heading in the same black row, for columns that do not sort. */
export function PlainTh({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white/55 ${className}`}>{children}</th>;
}

export const thead = "bg-[#0a0a0a]";

/** "Sorted by Total, high to low · ×", shown only while a sort is on. */
export function SortNote({ sort, labels, reset, numeric = [] }: { sort: Sort; labels: Record<string, string>; reset: () => void; numeric?: string[] }) {
  if (!sort) return null;
  const n = numeric.includes(sort.key);
  return (
    <button type="button" onClick={reset} className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#ecebff] px-3 py-1.5 text-[12.5px] font-semibold text-[#4b4bea] hover:bg-[#e0dfff]">
      {labels[sort.key]}, {n ? (sort.desc ? "high to low" : "low to high") : sort.desc ? "Z to A" : "A to Z"}
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * A whole sortable table for screens that are otherwise plain pages: each
 * row brings its cells to show and the values to sort them by.
 */
export type Col = { key: string; label: string; align?: "left" | "right"; numeric?: boolean; sort?: boolean; width?: string };
export type DataRow = { id: string; cells: Record<string, ReactNode>; by: Record<string, SortValue> };

export function DataTable({ cols, rows, minWidth = 640, toolbar, empty = "Nothing here yet." }: { cols: Col[]; rows: DataRow[]; minWidth?: number; toolbar?: ReactNode; empty?: string }) {
  const by = Object.fromEntries(cols.filter((c) => c.sort !== false).map((c) => [c.key, (r: DataRow) => r.by[c.key] ?? ""]));
  const { sorted, sort, click, reset } = useSort(rows, by);
  const labels = Object.fromEntries(cols.map((c) => [c.key, c.label]));
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      {(toolbar || sort) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-[#0a0a0a]/[0.06] px-3 py-2.5">
          <div className="min-w-0 flex-1">{toolbar}</div>
          <SortNote sort={sort} labels={labels} reset={reset} numeric={cols.filter((c) => c.numeric).map((c) => c.key)} />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth }}>
          <thead className={thead}>
            <tr>
              {cols.map((c) =>
                c.sort === false || !c.label ? (
                  <PlainTh key={c.key} className={`${c.align === "right" ? "text-right" : ""} ${c.width ?? ""}`}>{c.label}</PlainTh>
                ) : (
                  <SortTh key={c.key} k={c.key} label={c.label} sort={sort} onSort={click} align={c.align} className={c.width} />
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
            {sorted.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-[#fafafa]">
                {cols.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-[14px] ${c.align === "right" ? "text-right tabular-nums" : ""}`}>{r.cells[c.key]}</td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={cols.length} className="px-4 py-12 text-center text-[14px] text-[#0a0a0a]/50">{empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
