"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { SearchBox, useToast } from "@/components/next-admin/bits";

/** Store wording (third design): every phrase in one dense list, original on the left, yours on the right. */
const WORDS: [string, string, string][] = [
  ["Product page", "Add to cart", "Add to bag"],
  ["Product page", "Sold out", "Sold out"],
  ["Product page", "Size guide", "Size chart"],
  ["Cart", "Your cart is empty", "Your bag is empty"],
  ["Cart", "Checkout", "Checkout"],
  ["Checkout", "Cash on delivery", "Cash on delivery (pay the rider)"],
  ["Checkout", "Place order", "Place order"],
  ["Footer", "Subscribe", "Subscribe"],
  ["Search", "No results found", "Nothing matched. Try another word?"],
];

export function Words() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [vals, setVals] = useState(Object.fromEntries(WORDS.map(([, d, v]) => [d, v])));
  const rows = WORDS.filter(([g, d]) => !q || `${g} ${d} ${vals[d]}`.toLowerCase().includes(q.toLowerCase()));
  const changed = WORDS.filter(([, d]) => vals[d] !== d).length;
  return (
    <section className="overflow-hidden rounded-[16px] border border-[#ebebeb] bg-white">
      <div className="flex items-center gap-3 border-b border-[#ebebeb] px-3 py-1.5">
        <SearchBox value={q} onChange={setQ} placeholder="Search wording, e.g. cart" />
        <span className="ml-auto text-[12px] text-[#737373]">{changed} of {WORDS.length} changed</span>
      </div>
      <ul>
        {rows.map(([g, d], i) => {
          const head = i === 0 || rows[i - 1][0] !== g ? g : null;
          const on = vals[d] !== d;
          return (
            <li key={d}>
              {head && <p className="border-b border-[#f1f1f1] bg-[#fafafa] px-4 py-1.5 text-[11.5px] font-medium text-[#737373]">{head}</p>}
              <div className="grid h-11 items-center gap-3 border-b border-[#f1f1f1] px-4 sm:grid-cols-[13rem_minmax(0,1fr)_1.75rem]">
                <span className="truncate text-[13px] text-[#737373]">{d}</span>
                <input value={vals[d]} onChange={(e) => setVals({ ...vals, [d]: e.target.value })} aria-label={`Wording for ${d}`} className={`h-8 rounded-[10px] px-2.5 text-[13px] outline-none ring-1 ring-inset focus:ring-[#6666ff] ${on ? "bg-[#f5f5ff] ring-[#d6d5ff]" : "ring-[#ebebeb]"}`} />
                {on ? (
                  <button type="button" aria-label="Back to the original" title="Back to the original" onClick={() => { setVals({ ...vals, [d]: d }); toast(`“${d}” back to the original`); }} className="grid h-7 w-7 place-items-center rounded-[10px] text-[#a3a3a3] hover:bg-[#f3f3f3] hover:text-[#0a0a0a]"><RotateCcw className="h-3.5 w-3.5" /></button>
                ) : <span />}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
