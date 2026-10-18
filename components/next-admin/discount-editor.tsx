"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Cards, Seg, check, useToast } from "@/components/next-admin/bits";
import { Page, Panel, btn, pkr } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";

/**
 * Creating a discount (third design): what it gives, the code, who and when,
 * and on the right the same thing said back in plain words as you go. Save
 * sits in the heading, so it is always in reach.
 */
type K = "order" | "products" | "delivery";
const field = "h-8 w-full rounded-[6px] border border-[#d4d4d8] bg-white px-2.5 text-[13px] outline-none focus:border-[#5b5bf0] focus:ring-2 focus:ring-[#5b5bf0]/20";

export function DiscountEditor({ start = "" }: { start?: string }) {
  const toast = useToast();
  const [kind, setKind] = useState<K>("order");
  const [code, setCode] = useState(start || "EID25");
  const [unit, setUnit] = useState("Percentage");
  const [value, setValue] = useState(25);
  const [who, setWho] = useState("Everyone");
  const [min, setMin] = useState(0);
  const [limit, setLimit] = useState(300);
  const [once, setOnce] = useState(true);
  const pct = unit === "Percentage";
  const gives = kind === "delivery" ? "Free delivery" : `${pct ? `${value}%` : pkr(value)} off ${kind === "order" ? "the whole order" : "Summer Lawn"}`;
  const save = <button type="button" onClick={() => toast(`${code} is live`)} className={btn("primary")}>Save and switch on</button>;
  return (
    <Page title={start || "New discount"} crumbs={[{ label: "Discounts", href: `${A}/discounts` }]} actions={save}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="What it gives">
            <Cards<K>
              label="What it gives"
              value={kind}
              onChange={setKind}
              options={[
                { id: "order", label: "Off the whole order", hint: "A percentage or an amount" },
                { id: "products", label: "Off some products", hint: "One collection, or chosen pieces" },
                { id: "delivery", label: "Free delivery", hint: "No delivery charge" },
              ]}
            />
            {kind !== "delivery" && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Seg label="Percentage or amount" items={["Percentage", "Amount"]} value={unit} onChange={setUnit} />
                <input type="number" min={1} value={value} onChange={(e) => setValue(Number(e.target.value) || 0)} aria-label="Value" className={`${field} w-28`} />
                {kind === "products" && <span className="rounded-[4px] bg-[#f4f4f5] px-2 py-1 text-[12.5px]">Summer Lawn · 4 products</span>}
              </div>
            )}
          </Panel>
          <Panel title="The code">
            <div className="flex gap-1.5">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} className={`${field} font-mono font-semibold tracking-[0.06em]`} aria-label="Discount code" />
              <button type="button" onClick={() => setCode(`ZL${Math.random().toString(36).slice(2, 7).toUpperCase()}`)} className={btn()}><RefreshCw /> Make one up</button>
            </div>
            <p className="mt-1.5 text-[12px] text-[#71717a]">Customers type it at checkout. Letters and numbers, no spaces.</p>
          </Panel>
          <Panel title="Who can use it">
            <Seg label="Who can use it" items={["Everyone", "New customers", "Customers with accounts"]} value={who} onChange={setWho} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-[#3f3f46]">Smallest order it works on</span><input type="number" min={0} value={min} onChange={(e) => setMin(Number(e.target.value) || 0)} className={field} /></label>
              <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-[#3f3f46]">Times it can be used in all</span><input type="number" min={0} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 0)} className={field} /></label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-[13px]"><input type="checkbox" checked={once} onChange={() => setOnce(!once)} className={check} /> Once per customer</label>
          </Panel>
          <Panel title="When">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-[#3f3f46]">Starts</span><input type="date" defaultValue="2026-10-15" className={field} /></label>
              <label className="block"><span className="mb-1 block text-[12.5px] font-medium text-[#3f3f46]">Ends</span><input type="date" defaultValue="2026-10-20" className={field} /></label>
            </div>
          </Panel>
        </div>
        <aside className="lg:sticky lg:top-[64px] lg:self-start">
          <Panel title="What customers get">
            <p className="inline-block rounded-[6px] bg-[#eef0ff] px-2.5 py-1 font-mono text-[15px] font-bold tracking-[0.08em] text-[#3730a3] ring-1 ring-inset ring-[#c9ccff]">{code || "CODE"}</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-[#3f3f46]">
              <li className="font-semibold text-[#18181b]">{gives}</li>
              <li>For {who.toLowerCase()}</li>
              <li>{min > 0 ? `On orders of ${pkr(min)} or more` : "On any order"}</li>
              <li>{limit > 0 ? `Up to ${limit} uses` : "No limit on uses"}{once ? ", once each" : ""}</li>
              <li>15 Oct to 20 Oct</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </Page>
  );
}
