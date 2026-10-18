"use client";

import { useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
import { Tabs, useToast } from "@/components/next-admin/bits";
import { SEL, Status, btn, type Tone } from "@/components/next-admin/ui";
import { ENQUIRIES } from "@/lib/new-admin/sample";

/**
 * Enquiries as an inbox (third design): the list on the left, one line each;
 * the one you are reading on the right, with the quote box and where it goes
 * next. Triage without opening and closing rows.
 */
type St = "New" | "Quoted" | "Won" | "Lost";
const TONE: Record<St, Tone> = { New: "wait", Quoted: "info", Won: "good", Lost: "off" };

export function Enquiries() {
  const toast = useToast();
  const [rows, setRows] = useState(ENQUIRIES.map((e) => ({ ...e, status: e.status as St })));
  const [tab, setTab] = useState("All");
  const [at, setAt] = useState(ENQUIRIES[0].who);
  const shown = rows.filter((r) => tab === "All" || r.status === tab);
  const r = rows.find((x) => x.who === at) ?? rows[0];
  const set = (who: string, status: St) => {
    const before = rows;
    setRows(rows.map((x) => (x.who === who ? { ...x, status } : x)));
    toast(`${who}: ${status.toLowerCase()}`, () => setRows(before));
  };
  const counts = Object.fromEntries(["All", "New", "Quoted", "Won", "Lost"].map((t) => [t, t === "All" ? rows.length : rows.filter((x) => x.status === t).length]));
  return (
    <section className="grid overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white lg:grid-cols-[22rem_minmax(0,1fr)]">
      <div className="min-w-0 border-[#e4e4e7] lg:border-r">
        <div className="border-b border-[#e4e4e7] px-3"><Tabs items={["All", "New", "Quoted", "Won", "Lost"]} value={tab} onChange={setTab} counts={counts} /></div>
        <ul className="divide-y divide-[#f0f0f2]">
          {shown.map((x) => (
            <li key={x.who}>
              <button type="button" onClick={() => setAt(x.who)} aria-current={x.who === r.who ? "true" : undefined} className={`flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left ${x.who === r.who ? "bg-[#f7f7ff] shadow-[inset_2px_0_0_#5b5bf0]" : "hover:bg-[#fafafa]"}`}>
                <span className="flex items-center gap-2">
                  <span className={`min-w-0 flex-1 truncate text-[13px] ${x.status === "New" ? "font-semibold" : "font-medium"}`}>{x.who}</span>
                  <span className="text-[11.5px] text-[#a1a1aa]">{x.when}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#71717a]">{x.qty} × {x.product}</span>
                  <Status tone={TONE[x.status]}>{x.status}</Status>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex min-w-0 flex-col gap-3 border-t border-[#e4e4e7] p-4 lg:border-t-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-[14px] font-semibold">{r.who}</h2>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[#3f3f46]">{r.contact.includes("@") ? <Mail className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5 text-[#16a34a]" />} {r.contact}</span>
        </div>
        <p className="text-[12.5px] text-[#71717a]">{r.qty} × {r.product} · {r.when}</p>
        <blockquote className="rounded-[6px] bg-[#fafafa] px-3.5 py-3 text-[13.5px] leading-relaxed ring-1 ring-inset ring-[#f0f0f2]">&ldquo;{r.ask}&rdquo;</blockquote>
        <div className="flex gap-2">
          <input placeholder="Price per piece, e.g. 6,400" className="h-8 min-w-0 flex-1 rounded-[6px] px-2.5 text-[13px] outline-none ring-1 ring-inset ring-[#d4d4d8] focus:ring-[#5b5bf0]" />
          <button type="button" onClick={() => set(r.who, "Quoted")} className={btn("primary")}><Send /> Send quote</button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-[#f0f0f2] pt-3">
          <span className="mr-1 text-[12px] text-[#71717a]">Move to</span>
          {(["New", "Quoted", "Won", "Lost"] as St[]).map((s) => (
            <button key={s} type="button" aria-pressed={r.status === s} onClick={() => set(r.who, s)} className={`h-7 rounded-[6px] px-2.5 text-[12.5px] font-medium ${r.status === s ? SEL : "text-[#52525b] ring-1 ring-inset ring-[#e4e4e7] hover:text-[#18181b]"}`}>{s}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
