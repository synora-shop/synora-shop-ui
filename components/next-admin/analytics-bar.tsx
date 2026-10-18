"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Seg, Toggle, useToast } from "@/components/next-admin/bits";
import { btn } from "@/components/next-admin/ui";

/** The window, the comparison and live visitors, in one row. */
export function AnalyticsBar() {
  const toast = useToast();
  const [range, setRange] = useState("30 days");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Seg label="Period" items={["Today", "7 days", "30 days", "This year"]} value={range} onChange={setRange} />
      <label className="inline-flex h-8 items-center gap-2 rounded-[6px] bg-white px-2.5 text-[12.5px] ring-1 ring-inset ring-[#d4d4d8]"><Toggle on label="Compare" /> Compare with the {range === "Today" ? "day" : range === "This year" ? "year" : range} before</label>
      <span className="inline-flex h-8 items-center gap-2 rounded-[6px] bg-white px-2.5 text-[12.5px] ring-1 ring-inset ring-[#d4d4d8]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#16a34a] motion-reduce:animate-none" /> Live · 12 on the store</span>
      <button type="button" onClick={() => toast("Figures exported as a spreadsheet")} className={`${btn()} ml-auto`}><Upload /> Export</button>
    </div>
  );
}
