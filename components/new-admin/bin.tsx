"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Pill } from "@/components/new-admin/ui";
import { useToast } from "@/components/new-admin/shell";
import { BIN } from "@/lib/new-admin/sample";

/** Deleted things, kept 30 days: restore one, or empty it for good. */
export function Bin() {
  const toast = useToast();
  const [rows, setRows] = useState(BIN);
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      {rows.length === 0 ? (
        <p className="px-5 py-14 text-center text-[14px] text-[#0a0a0a]/50">The Bin is empty.</p>
      ) : (
        <ul className="divide-y divide-[#0a0a0a]/[0.06]">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-4 px-5 py-4">
              <Pill tone="off">{r.kind}</Pill>
              <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-medium">{r.name}</span><span className="text-[12.5px] text-[#0a0a0a]/50">Deleted {r.deleted} by {r.by} · gone for good in {30 - parseInt(r.deleted)} days</span></span>
              <button type="button" onClick={() => { setRows(rows.filter((x) => x !== r)); toast(`${r.name} restored`); }} className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]"><RotateCcw className="h-4 w-4" /> Restore</button>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <div className="flex justify-end border-t border-[#0a0a0a]/[0.06] px-5 py-3">
          <button type="button" onClick={() => { const before = rows; setRows([]); toast("Bin emptied", () => setRows(before)); }} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#a3330c]"><Trash2 className="h-4 w-4" /> Empty the Bin</button>
        </div>
      )}
    </section>
  );
}
