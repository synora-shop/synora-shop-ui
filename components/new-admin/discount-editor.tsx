"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { pkr } from "@/components/new-admin/ui";
import { useToast } from "@/components/new-admin/shell";

/**
 * Creating a discount (preview): pick what it gives, and the black card on
 * the right writes it out in plain words as you go, so there is no guessing
 * what customers will get.
 */
const KINDS = [
  { id: "order", label: "Off the whole order", hint: "A percentage or an amount" },
  { id: "products", label: "Off some products", hint: "One collection, or chosen pieces" },
  { id: "delivery", label: "Free delivery", hint: "No delivery charge" },
] as const;

export function DiscountEditor({ start = "" }: { start?: string }) {
  const toast = useToast();
  const [kind, setKind] = useState<(typeof KINDS)[number]["id"]>("order");
  const [code, setCode] = useState(start || "EID25");
  const [pct, setPct] = useState(true);
  const [value, setValue] = useState(25);
  const [who, setWho] = useState("Everyone");
  const [min, setMin] = useState(0);
  const [limit, setLimit] = useState(300);
  const [once, setOnce] = useState(true);
  const field = "h-10 w-full rounded-[10px] bg-white px-3.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/15 focus:ring-2 focus:ring-[#0a0a0a]";
  const box = "rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]";
  const gives = kind === "delivery" ? "Free delivery" : `${pct ? `${value}%` : pkr(value)} off ${kind === "order" ? "the whole order" : "Summer Lawn"}`;
  const pick = (on: boolean) => `rounded-[10px] px-3 py-2 text-[13px] font-semibold ${on ? "bg-[#0a0a0a] text-white" : "ring-1 ring-[#0a0a0a]/12"}`;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-4">
        <section className={box}>
          <p className="mb-3 text-[14.5px] font-semibold">What it gives</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {KINDS.map((k) => (
              <button key={k.id} type="button" onClick={() => setKind(k.id)} className={`rounded-xl px-4 py-3 text-left ${kind === k.id ? "bg-[#0a0a0a] text-white" : "ring-1 ring-[#0a0a0a]/12 hover:ring-[#0a0a0a]/30"}`}>
                <span className="block text-[14px] font-semibold">{k.label}</span>
                <span className={`block text-[12.5px] ${kind === k.id ? "text-white/60" : "text-[#0a0a0a]/55"}`}>{k.hint}</span>
              </button>
            ))}
          </div>
          {kind !== "delivery" && (
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex gap-1.5"><button type="button" onClick={() => setPct(true)} className={pick(pct)}>Percentage</button><button type="button" onClick={() => setPct(false)} className={pick(!pct)}>Amount</button></div>
              <label className="w-36"><span className="sr-only">Value</span><input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value) || 0)} className={field} /></label>
              {kind === "products" && <span className="rounded-[10px] bg-[#f0f0f0] px-3 py-2 text-[13px] font-semibold">Summer Lawn · 4 products</span>}
            </div>
          )}
        </section>
        <section className={box}>
          <p className="mb-3 text-[14.5px] font-semibold">The code</p>
          <div className="flex gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} className={`${field} font-mono font-semibold tracking-[0.06em]`} aria-label="Discount code" />
            <button type="button" onClick={() => setCode(`ZL${Math.random().toString(36).slice(2, 7).toUpperCase()}`)} className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12"><RefreshCw className="h-4 w-4" /> Make one up</button>
          </div>
          <p className="mt-2 text-[12.5px] text-[#0a0a0a]/50">Customers type it at checkout. Letters and numbers, no spaces.</p>
        </section>
        <section className={box}>
          <p className="mb-3 text-[14.5px] font-semibold">Who can use it</p>
          <div className="flex flex-wrap gap-1.5">{["Everyone", "New customers", "Customers with accounts"].map((w) => <button key={w} type="button" onClick={() => setWho(w)} className={pick(who === w)}>{w}</button>)}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Smallest order it works on</span><input type="number" min={0} value={min} onChange={(e) => setMin(Number(e.target.value) || 0)} className={field} /></label>
            <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Times it can be used in all</span><input type="number" min={0} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 0)} className={field} /></label>
          </div>
          <label className="mt-3 flex items-center gap-2.5 text-[14px]"><input type="checkbox" checked={once} onChange={() => setOnce(!once)} className="h-4 w-4 accent-[#0a0a0a]" /> Once per customer</label>
        </section>
        <section className={box}>
          <p className="mb-3 text-[14.5px] font-semibold">When</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Starts</span><input type="date" defaultValue="2026-10-15" className={field} /></label>
            <label className="block"><span className="mb-1.5 block text-[13px] font-semibold">Ends</span><input type="date" defaultValue="2026-10-20" className={field} /></label>
          </div>
        </section>
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <section className="rounded-2xl bg-[#0a0a0a] p-5 text-white">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b7b9ff]">What customers get</p>
          <p className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-[16px] font-bold tracking-[0.08em] text-[#0a0a0a]">{code || "CODE"}</p>
          <ul className="mt-4 flex flex-col gap-2 text-[14px] text-white/80">
            <li className="font-semibold text-white">{gives}</li>
            <li>For {who.toLowerCase()}</li>
            <li>{min > 0 ? `On orders of ${pkr(min)} or more` : "On any order"}</li>
            <li>{limit > 0 ? `Up to ${limit} uses` : "No limit on uses"}{once ? ", once each" : ""}</li>
            <li>15 Oct to 20 Oct</li>
          </ul>
          <button type="button" onClick={() => toast(`${code} is live`)} className="mt-5 w-full rounded-[10px] bg-white py-2.5 text-[14px] font-semibold text-[#0a0a0a]">Save and switch on</button>
        </section>
      </aside>
    </div>
  );
}
