"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NotebookText, PackageCheck, PhoneCall, Printer, Upload, X } from "lucide-react";
import { Pill, pkr, td } from "@/components/new-admin/ui";
import { PlainTh, SortNote, SortTh, thead, useSort } from "@/components/new-admin/sort";
import { useToast } from "@/components/new-admin/shell";
import { STAGES, type Order, type Stage } from "@/lib/new-admin/sample";

/**
 * The orders list (preview): the six real stages as a pipeline across the
 * top, counted, and each a filter; ticked rows bring up a bar of what can be
 * done to them next, every action undoable.
 */
export const STAGE_TONE: Record<Stage, "wait" | "info" | "good" | "off" | "bad"> = {
  Pending: "wait", Confirmed: "info", Packed: "info", Shipped: "info", Delivered: "good", Cancelled: "off",
};

export function OrdersBoard({ orders: start }: { orders: Order[] }) {
  const toast = useToast();
  const [orders, setOrders] = useState(start);
  const [stage, setStage] = useState<Stage | "All">("All");
  const [picked, setPicked] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const shown = useMemo(
    () => orders.filter((o) => (stage === "All" || o.stage === stage) && (!q || `${o.id} ${o.customer} ${o.city}`.toLowerCase().includes(q.toLowerCase()))),
    [orders, stage, q]
  );
  const { sorted, sort, click, reset } = useSort(shown, {
    order: (o) => o.id, date: (o) => o.id, customer: (o) => o.customer, total: (o) => o.total,
    payment: (o) => (o.paid ? 1 : 0), stage: (o) => STAGES.indexOf(o.stage),
  });
  const count = (s: Stage) => orders.filter((o) => o.stage === s).length;
  const all = shown.length > 0 && shown.every((o) => picked.includes(o.id));

  const move = (to: Stage, label: string) => {
    const before = orders;
    const ids = picked;
    setOrders(orders.map((o) => (ids.includes(o.id) ? { ...o, stage: to } : o)));
    setPicked([]);
    toast(`${ids.length} order${ids.length > 1 ? "s" : ""} ${label}`, () => setOrders(before));
  };

  return (
    <>
      {/* The pipeline: one strip, read the way an order travels (17 October). */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[#0a0a0a]/[0.07] ring-1 ring-[#0a0a0a]/[0.07] sm:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((s) => {
          const on = stage === s;
          const n = count(s);
          const waiting = s === "Pending" && n > 0 && !on;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStage(on ? "All" : s)}
              aria-pressed={on}
              className={`flex items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors ${on ? "bg-[#0a0a0a] text-white" : "bg-white hover:bg-[#fafafa]"}`}
            >
              <span className={`flex min-w-0 items-center gap-2 truncate text-[12.5px] font-medium ${on ? "text-white/70" : "text-[#0a0a0a]/55"}`}>
                <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${{ Pending: "bg-[#f2a33a]", Confirmed: "bg-[#6666ff]", Packed: "bg-[#b7b9ff]", Shipped: "bg-[#8cc8f5]", Delivered: "bg-[#6fd6a8]", Cancelled: "bg-[#0a0a0a]/15" }[s]}`} />
                {s}
              </span>
              <span className={`text-[18px] font-semibold leading-none tabular-nums ${waiting ? "text-[#c2410c]" : ""}`} title={waiting ? "Waiting for you" : undefined}>{n}</span>
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        <div className="flex flex-col gap-2 border-b border-[#0a0a0a]/[0.06] px-3 py-2.5 sm:flex-row sm:items-center">
          <div className="flex gap-1 overflow-x-auto">
            {(["All", "Cash on delivery", "Has a note"] as const).map((v, i) => (
              <span key={v} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold ${i === 0 ? "bg-[#f0f0f0]" : "text-[#0a0a0a]/55"}`}>{v}</span>
            ))}
          </div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number, customer or city" className="h-9 flex-1 rounded-[10px] bg-[#f5f5f5] px-3 text-[13.5px] outline-none placeholder:text-[#0a0a0a]/40 focus:ring-2 focus:ring-[#0a0a0a]/15 sm:ml-2" />
          <SortNote sort={sort} reset={reset} labels={{ order: "Order", date: "Date", customer: "Customer", total: "Total", payment: "Payment", stage: "Stage" }} numeric={["order", "date", "total", "payment", "stage"]} />
          {stage !== "All" && (
            <button type="button" onClick={() => setStage("All")} className="inline-flex items-center gap-1 rounded-full bg-[#0a0a0a] px-3 py-1.5 text-[12.5px] font-semibold text-white">
              {stage} <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className={thead}>
              <tr>
                <PlainTh className="w-10">
                  <input type="checkbox" aria-label="Select all" checked={all} onChange={() => setPicked(all ? [] : shown.map((o) => o.id))} className="h-4 w-4 accent-white" />
                </PlainTh>
                <SortTh k="order" label="Order" sort={sort} onSort={click} />
                <SortTh k="date" label="Date" sort={sort} onSort={click} />
                <SortTh k="customer" label="Customer" sort={sort} onSort={click} />
                <SortTh k="total" label="Total" sort={sort} onSort={click} align="right" />
                <SortTh k="payment" label="Payment" sort={sort} onSort={click} />
                <SortTh k="stage" label="Stage" sort={sort} onSort={click} />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
              {sorted.map((o) => {
                const on = picked.includes(o.id);
                return (
                  <tr key={o.id} className={on ? "bg-[#f5f5ff]" : "hover:bg-[#fafafa]"}>
                    <td className={td}>
                      <input type="checkbox" aria-label={`Select #${o.id}`} checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== o.id) : [...picked, o.id])} className="h-4 w-4 accent-[#0a0a0a]" />
                    </td>
                    <td className={`${td} font-semibold`}>
                      <Link href={`/new-admin/orders/${o.id}`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                        #{o.id}
                        {o.note && <NotebookText aria-label="Has a note" className="h-3.5 w-3.5 text-[#b45309]" />}
                      </Link>
                    </td>
                    <td className={`${td} text-[#0a0a0a]/60`}>{o.when}</td>
                    <td className={td}>
                      <span className="block font-medium">{o.customer}</span>
                      <span className="block text-[12.5px] text-[#0a0a0a]/50">{o.city} · {o.items} item{o.items > 1 ? "s" : ""}</span>
                    </td>
                    <td className={`${td} text-right font-semibold tabular-nums`}>{pkr(o.total)}</td>
                    <td className={td}>
                      <span className="flex flex-col items-start gap-1">
                        {o.paid ? <Pill tone="good">Paid</Pill> : <Pill tone="wait">{o.payment === "Cash on delivery" ? "Collect on delivery" : "Awaiting payment"}</Pill>}
                        <span className="text-[12px] text-[#0a0a0a]/50">{o.payment}</span>
                      </span>
                    </td>
                    <td className={td}><Pill tone={STAGE_TONE[o.stage]}>{o.stage}</Pill></td>
                  </tr>
                );
              })}
              {shown.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[14px] text-[#0a0a0a]/50">No orders here. {stage !== "All" && <button type="button" onClick={() => setStage("All")} className="font-semibold text-[#0a0a0a] underline">Show all</button>}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* What can be done to the ticked rows. */}
      {picked.length > 0 && (
        <div className="fixed inset-x-3 bottom-5 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl bg-[#0a0a0a] p-2 pl-4 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] lg:left-[16rem]">
          <span className="mr-auto text-[13.5px] font-semibold">{picked.length} selected</span>
          <button type="button" onClick={() => move("Confirmed", "confirmed")} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-white/10"><PhoneCall className="h-4 w-4" /> Confirm</button>
          <button type="button" onClick={() => move("Packed", "marked packed")} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-white/10"><PackageCheck className="h-4 w-4" /> Mark packed</button>
          <button type="button" onClick={() => toast(`${picked.length} packing slips ready to print`)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold hover:bg-white/10"><Printer className="h-4 w-4" /> Slips</button>
          <button type="button" onClick={() => toast(`${picked.length} orders exported`)} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-[13px] font-semibold text-[#0a0a0a]"><Upload className="h-4 w-4" /> Export CSV</button>
          <button type="button" aria-label="Clear selection" onClick={() => setPicked([])} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
      )}
    </>
  );
}
