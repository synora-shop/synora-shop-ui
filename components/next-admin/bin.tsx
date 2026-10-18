"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "@/components/next-admin/bits";
import { Tag, btn } from "@/components/next-admin/ui";
import { BIN } from "@/lib/new-admin/sample";

/** Deleted things, kept 30 days: restore one, or empty it for good. */
export function Bin() {
  const toast = useToast();
  const [rows, setRows] = useState(BIN);
  return (
    <section className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
      {rows.length === 0 ? (
        <p className="px-4 py-12 text-center text-[13px] text-[#71717a]">The Bin is empty.</p>
      ) : (
        <ul className="divide-y divide-[#f0f0f2]">
          {rows.map((r) => (
            <li key={r.name} className="flex h-12 items-center gap-3 px-4">
              <span className="w-16"><Tag>{r.kind}</Tag></span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{r.name} <span className="font-normal text-[#71717a]">· deleted {r.deleted} by {r.by} · gone for good in {30 - parseInt(r.deleted)} days</span></span>
              <button type="button" onClick={() => { setRows(rows.filter((x) => x !== r)); toast(`${r.name} restored`); }} className={btn("secondary", true)}><RotateCcw /> Restore</button>
            </li>
          ))}
        </ul>
      )}
      {rows.length > 0 && (
        <div className="flex h-10 items-center justify-end border-t border-[#f0f0f2] px-4">
          <button type="button" onClick={() => { const before = rows; setRows([]); toast("Bin emptied", () => setRows(before)); }} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#b91c1c] hover:underline"><Trash2 className="h-3.5 w-3.5" /> Empty the Bin</button>
        </div>
      )}
    </section>
  );
}
