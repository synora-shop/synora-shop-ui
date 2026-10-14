"use client";

import { useState } from "react";
import { ChevronDown, Mail, MessageCircle, Send } from "lucide-react";
import { Pill } from "@/components/new-admin/ui";
import { useToast } from "@/components/new-admin/shell";
import { ENQUIRIES } from "@/lib/new-admin/sample";

/**
 * Enquiries (preview): what bulk and made-to-order customers asked for.
 * Rows open in place, because the job is triage: read it, answer, move it
 * on. Quoting writes a reply with the price in it; the status follows.
 */
type Status = "New" | "Quoted" | "Won" | "Lost";
const TONE: Record<Status, "wait" | "info" | "good" | "off"> = { New: "wait", Quoted: "info", Won: "good", Lost: "off" };

export function Enquiries() {
  const toast = useToast();
  const [rows, setRows] = useState(ENQUIRIES.map((e) => ({ ...e, status: e.status as Status })));
  const [open, setOpen] = useState<string | null>(ENQUIRIES[0].who);
  const set = (who: string, status: Status) => {
    const before = rows;
    setRows(rows.map((r) => (r.who === who ? { ...r, status } : r)));
    toast(`${who}: ${status.toLowerCase()}`, () => setRows(before));
  };
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      <ul className="divide-y divide-[#0a0a0a]/[0.06]">
        {rows.map((r) => {
          const on = open === r.who;
          return (
            <li key={r.who}>
              <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : r.who)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#fafafa]">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold">{r.who}</span>
                    {r.status === "New" && <span className="h-2 w-2 rounded-full bg-[#6666ff]" />}
                  </span>
                  <span className="block truncate text-[13px] text-[#0a0a0a]/55">{r.qty} × {r.product}</span>
                </span>
                <span className="hidden text-[12.5px] text-[#0a0a0a]/45 sm:block">{r.when}</span>
                <Pill tone={TONE[r.status]}>{r.status}</Pill>
                <ChevronDown className={`h-4 w-4 text-[#0a0a0a]/35 transition-transform ${on ? "rotate-180" : ""}`} />
              </button>
              {on && (
                <div className="grid gap-4 bg-[#fafafa] px-5 pb-5 pt-1 lg:grid-cols-[minmax(0,1fr)_17rem]">
                  <div>
                    <p className="rounded-xl bg-white p-4 text-[14.5px] leading-relaxed ring-1 ring-[#0a0a0a]/[0.07]">&ldquo;{r.ask}&rdquo;</p>
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-[#0a0a0a]/[0.07]">
                      <input placeholder="Price per piece, e.g. 6,400" className="h-9 min-w-0 flex-1 bg-transparent px-2 text-[14px] outline-none" />
                      <button type="button" onClick={() => set(r.who, "Quoted")} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3 text-[13px] font-semibold text-white"><Send className="h-4 w-4" /> Send quote</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">Reply</p>
                    <span className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">
                      {r.contact.includes("@") ? <Mail className="h-4 w-4" /> : <MessageCircle className="h-4 w-4 text-[#1f9d68]" />} {r.contact}
                    </span>
                    <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">Move to</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(["New", "Quoted", "Won", "Lost"] as Status[]).map((s) => (
                        <button key={s} type="button" onClick={() => set(r.who, s)} className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${r.status === s ? "bg-[#0a0a0a] text-white" : "bg-white ring-1 ring-[#0a0a0a]/12"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
