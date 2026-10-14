"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useToast } from "@/components/new-admin/shell";

/**
 * Store wording (preview): every phrase the store says, searchable and
 * editable, with the original one click away. "Add to cart" can become
 * "Add to bag", or Urdu, without touching a theme.
 */
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
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      <div className="border-b border-[#0a0a0a]/[0.06] p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search wording, e.g. cart" className="h-10 w-full rounded-[10px] bg-[#f5f5f5] px-3.5 text-[14px] outline-none" />
      </div>
      <ul>
        {rows.map(([g, d], i) => {
          const head = i === 0 || rows[i - 1][0] !== g ? g : null;
          const changed = vals[d] !== d;
          return (
            <li key={d}>
              {head && <p className="bg-[#fafafa] px-5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">{head}</p>}
              <div className="grid items-center gap-2 border-b border-[#0a0a0a]/[0.05] px-5 py-3 sm:grid-cols-[14rem_minmax(0,1fr)_2rem]">
                <span className="text-[13.5px] text-[#0a0a0a]/55">{d}</span>
                <input value={vals[d]} onChange={(e) => setVals({ ...vals, [d]: e.target.value })} className={`h-9 rounded-[10px] px-3 text-[14px] outline-none ring-1 focus:ring-2 focus:ring-[#0a0a0a] ${changed ? "ring-[#6666ff]/50" : "ring-[#0a0a0a]/12"}`} />
                {changed ? (
                  <button type="button" aria-label="Back to the original" title="Back to the original" onClick={() => { setVals({ ...vals, [d]: d }); toast(`“${d}” back to the original`); }} className="grid h-8 w-8 place-items-center rounded-lg text-[#0a0a0a]/45 hover:bg-[#f0f0f0]"><RotateCcw className="h-4 w-4" /></button>
                ) : <span />}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
