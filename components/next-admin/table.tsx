"use client";

import { useState, type ReactNode } from "react";
import { SearchBox, SortTh, Tabs, useSort } from "@/components/next-admin/bits";
import { T } from "@/components/next-admin/ui";

/**
 * A list as a table (third design): sortable by any column, one 40px line a
 * row, with optional views as tabs and a search above it.
 */
export type Col = { key: string; label: string; right?: boolean; sort?: boolean; className?: string };
export type TRow = { id: string; by: Record<string, string | number>; cells: Record<string, ReactNode>; views?: string[]; text?: string };

export function Table({ cols, rows, views, search, minWidth = 640, foot }: { cols: Col[]; rows: TRow[]; views?: string[]; search?: string; minWidth?: number; foot?: ReactNode }) {
  const [view, setView] = useState(views?.[0] ?? "");
  const [q, setQ] = useState("");
  const shown = rows.filter((r) => (!views || view === views[0] || r.views?.includes(view)) && (!q || (r.text ?? Object.values(r.by).join(" ")).toLowerCase().includes(q.toLowerCase())));
  const { sorted, sort, click } = useSort(shown, Object.fromEntries(cols.map((c) => [c.key, (r: TRow) => r.by[c.key] ?? ""])));
  const counts = views ? Object.fromEntries(views.map((v, i) => [v, i === 0 ? rows.length : rows.filter((r) => r.views?.includes(v)).length])) : undefined;
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#ebebeb] bg-white">
      {(views || search) && (
        <div className={`flex flex-wrap items-center gap-x-3 border-b border-[#ebebeb] px-3 ${views ? "" : "py-1.5"}`}>
          {views && <Tabs items={views} value={view} onChange={setView} counts={counts} />}
          {search && <div className="ml-auto flex min-w-0 flex-1 justify-end py-1.5"><SearchBox value={q} onChange={setQ} placeholder={search} /></div>}
        </div>
      )}
      {/* Phones: each row as a short stack, the first column leading. */}
      <ul className="divide-y divide-[#f1f1f1] sm:hidden">
        {sorted.map((r) => (
          <li key={r.id} className="px-3 py-2.5 text-[13px]">
            <div className="flex items-center justify-between gap-3 font-medium">{r.cells[cols[0].key]}<span>{r.cells[cols[cols.length - 1].key]}</span></div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#737373]">{cols.slice(1, -1).map((c) => <span key={c.key}>{r.cells[c.key]}</span>)}</div>
          </li>
        ))}
      </ul>
      <div className={`${T.wrap} max-sm:hidden`}>
        <table className={T.table} style={{ minWidth }}>
          <thead>
            <tr>
              {cols.map((c) =>
                c.sort === false ? (
                  <th key={c.key} className={`${T.th} ${c.right ? "text-right" : ""} ${c.className ?? ""}`}>{c.label}</th>
                ) : (
                  <SortTh key={c.key} k={c.key} label={c.label} sort={sort} onSort={click} right={c.right} className={c.className} />
                )
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className={T.tr}>
                {cols.map((c) => <td key={c.key} className={`${T.td} ${c.right ? "text-right" : ""}`}>{r.cells[c.key]}</td>)}
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-[13px] text-[#737373]">Nothing here.</td></tr>}
          </tbody>
        </table>
      </div>
      {foot && <div className="flex h-9 items-center px-3 text-[12px] text-[#737373]">{foot}</div>}
    </section>
  );
}
