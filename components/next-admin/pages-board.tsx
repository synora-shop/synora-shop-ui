"use client";

import { useState } from "react";
import { Paintbrush } from "lucide-react";
import { BulkBar, SortTh, Tabs, barBtn, check, useSort, useToast } from "@/components/next-admin/bits";
import { Status, T, btn } from "@/components/next-admin/ui";
import { PAGES_LIST } from "@/lib/new-admin/sample";

/** Pages (third design): counted tabs, one line a page, tick drafts and publish them together. */
const POLICY = /policy|terms/i;
const TABS = ["All", "Published", "Drafts", "Policies"];
const inTab = (t: string, p: (typeof PAGES_LIST)[number]) => t === "All" || (t === "Policies" ? POLICY.test(p.title) : p.status === (t === "Drafts" ? "Draft" : "Published"));

export function PagesBoard() {
  const toast = useToast();
  const [rows, setRows] = useState(PAGES_LIST);
  const [tab, setTab] = useState("All");
  const [picked, setPicked] = useState<string[]>([]);
  const shown = rows.filter((p) => inTab(tab, p));
  const { sorted, sort, click } = useSort(shown, { title: (p) => p.title, path: (p) => p.path, sections: (p) => p.sections, status: (p) => p.status, edited: (p) => p.edited });
  return (
    <section className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
      <div className="border-b border-[#e4e4e7] px-3"><Tabs items={TABS} value={tab} onChange={setTab} counts={Object.fromEntries(TABS.map((t) => [t, rows.filter((p) => inTab(t, p)).length]))} /></div>
      <div className={T.wrap}>
        <table className={`${T.table} min-w-[640px]`}>
          <thead><tr><th className={`${T.th} w-9`} /><SortTh k="title" label="Page" sort={sort} onSort={click} /><SortTh k="path" label="Address" sort={sort} onSort={click} /><SortTh k="sections" label="Sections" sort={sort} onSort={click} /><SortTh k="edited" label="Edited" sort={sort} onSort={click} /><SortTh k="status" label="Status" sort={sort} onSort={click} /><th className={`${T.th} w-20`} /></tr></thead>
          <tbody>
            {sorted.map((p) => {
              const on = picked.includes(p.path);
              return (
                <tr key={p.path} className={on ? "bg-[#f7f7ff]" : T.tr}>
                  <td className={T.td}><input type="checkbox" aria-label={`Select ${p.title}`} checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== p.path) : [...picked, p.path])} className={check} /></td>
                  <td className={`${T.td} font-medium`}>{p.title}</td>
                  <td className={`${T.td} font-mono text-[12px] text-[#71717a]`}>{p.path}</td>
                  <td className={`${T.td} tabular-nums ${T.muted}`}>{p.sections}</td>
                  <td className={`${T.td} ${T.muted}`}>{p.edited}</td>
                  <td className={T.td}><Status tone={p.status === "Published" ? "good" : "off"}>{p.status}</Status></td>
                  <td className={`${T.td} text-right`}><button type="button" onClick={() => toast(`Opening ${p.title} in the customiser`)} className={btn("ghost", true)}><Paintbrush /> Edit</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <BulkBar count={picked.length} noun="page" onClear={() => setPicked([])}>
        <button type="button" onClick={() => { const before = rows; setRows(rows.map((r) => (picked.includes(r.path) ? { ...r, status: "Published" as const } : r))); toast(`${picked.length} pages published`, () => setRows(before)); setPicked([]); }} className={barBtn}>Publish</button>
      </BulkBar>
    </section>
  );
}
