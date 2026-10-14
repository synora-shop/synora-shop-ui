"use client";

import { useState } from "react";
import { Paintbrush, Plus, X } from "lucide-react";
import { Pill, td, th } from "@/components/new-admin/ui";
import { useToast } from "@/components/new-admin/shell";
import { PAGES_LIST } from "@/lib/new-admin/sample";

/** Pages (preview): tabs for what you are looking for, tick drafts and publish them together. */
const POLICY = /policy|terms/i;
export function PagesBoard() {
  const toast = useToast();
  const [rows, setRows] = useState(PAGES_LIST);
  const [tab, setTab] = useState("All");
  const [picked, setPicked] = useState<string[]>([]);
  const shown = rows.filter((p) => tab === "All" || (tab === "Policies" ? POLICY.test(p.title) : p.status === (tab === "Drafts" ? "Draft" : "Published")));
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-[10px] bg-white p-0.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">
          {["All", "Published", "Drafts", "Policies"].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-lg px-3 py-1.5 ${tab === t ? "bg-[#0a0a0a] text-white" : "text-[#0a0a0a]/55"}`}>
              {t} <span className="opacity-60">{rows.filter((p) => t === "All" || (t === "Policies" ? POLICY.test(p.title) : p.status === (t === "Drafts" ? "Draft" : "Published"))).length}</span>
            </button>
          ))}
        </div>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white"><Plus className="h-4 w-4" /> Add page</span>
      </div>
      <section className="overflow-x-auto rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        <table className="w-full min-w-[640px]">
          <thead className="bg-[#fafafa]"><tr><th className={`${th} w-10`} /><th className={th}>Page</th><th className={th}>Address</th><th className={th}>Sections</th><th className={th}>Status</th><th className={th} /></tr></thead>
          <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
            {shown.map((p) => (
              <tr key={p.path} className={picked.includes(p.path) ? "bg-[#f5f5ff]" : "hover:bg-[#fafafa]"}>
                <td className={td}><input type="checkbox" aria-label={`Select ${p.title}`} checked={picked.includes(p.path)} onChange={() => setPicked(picked.includes(p.path) ? picked.filter((x) => x !== p.path) : [...picked, p.path])} className="h-4 w-4 accent-[#0a0a0a]" /></td>
                <td className={td}><span className="block font-medium">{p.title}</span><span className="text-[12.5px] text-[#0a0a0a]/50">Edited {p.edited}</span></td>
                <td className={`${td} font-mono text-[12.5px] text-[#0a0a0a]/55`}>{p.path}</td>
                <td className={`${td} text-[#0a0a0a]/60`}>{p.sections}</td>
                <td className={td}>{p.status === "Published" ? <Pill tone="good">Published</Pill> : <Pill tone="off">Draft</Pill>}</td>
                <td className={`${td} text-right`}><span className="inline-flex items-center gap-1.5 text-[13px] font-semibold"><Paintbrush className="h-3.5 w-3.5" /> Edit</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {picked.length > 0 && (
        <div className="fixed inset-x-3 bottom-5 z-40 mx-auto flex max-w-md items-center gap-2 rounded-2xl bg-[#0a0a0a] p-2 pl-4 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] lg:left-[16rem]">
          <span className="mr-auto text-[13.5px] font-semibold">{picked.length} selected</span>
          <button type="button" onClick={() => { const before = rows; setRows(rows.map((r) => (picked.includes(r.path) ? { ...r, status: "Published" as const } : r))); setPicked([]); toast(`${picked.length} pages published`, () => setRows(before)); }} className="rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-[#0a0a0a]">Publish</button>
          <button type="button" aria-label="Clear selection" onClick={() => setPicked([])} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
      )}
    </>
  );
}
