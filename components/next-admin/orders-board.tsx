"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { NotebookText, PackageCheck, PhoneCall, Printer, Upload } from "lucide-react";
import { BulkBar, SearchBox, SortTh, Tabs, barBtn, check, useSort, useToast } from "@/components/next-admin/bits";
import { SEL, Status, T, pkr } from "@/components/next-admin/ui";
import { STAGE_TONE, payState } from "@/components/next-admin/stage";
import { A } from "@/components/next-admin/nav";
import { STAGES, type Order, type Stage } from "@/lib/new-admin/sample";

/**
 * The orders list (third design). The six stages are the tabs over the
 * table, counted, so the pipeline and the filter are one row instead of a
 * strip of cards and a row of chips. Each order is one 40px line.
 */
const QUICK = ["Cash on delivery", "Has a note"] as const;

export function OrdersBoard({ orders: start }: { orders: Order[] }) {
  const toast = useToast();
  const [orders, setOrders] = useState(start);
  const [tab, setTab] = useState("All");
  const [quick, setQuick] = useState<string[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [q, setQ] = useState("");
  const counts = Object.fromEntries([["All", orders.length], ...STAGES.map((s) => [s, orders.filter((o) => o.stage === s).length])]);
  const shown = useMemo(
    () =>
      orders.filter(
        (o) =>
          (tab === "All" || o.stage === tab) &&
          (!quick.includes("Cash on delivery") || o.payment === "Cash on delivery") &&
          (!quick.includes("Has a note") || o.note) &&
          (!q || `${o.id} ${o.customer} ${o.city}`.toLowerCase().includes(q.toLowerCase()))
      ),
    [orders, tab, quick, q]
  );
  const { sorted, sort, click } = useSort(shown, {
    order: (o) => o.id, date: (o) => o.id, customer: (o) => o.customer, total: (o) => o.total, payment: (o) => (o.paid ? 1 : 0), stage: (o) => STAGES.indexOf(o.stage),
  });
  const all = shown.length > 0 && shown.every((o) => picked.includes(o.id));
  const move = (to: Stage, label: string) => {
    const before = orders;
    const ids = picked;
    setOrders(orders.map((o) => (ids.includes(o.id) ? { ...o, stage: to } : o)));
    setPicked([]);
    toast(`${ids.length} order${ids.length > 1 ? "s" : ""} ${label}`, () => setOrders(before));
  };

  return (
    <section className="overflow-hidden rounded-[8px] border border-[#e4e4e7] bg-white">
      <div className="flex flex-wrap items-center gap-x-3 border-b border-[#e4e4e7] px-3">
        <Tabs items={["All", ...STAGES]} value={tab} onChange={setTab} counts={counts} />
        <div className="ml-auto flex flex-wrap items-center gap-1.5 py-1.5">
          {QUICK.map((f) => {
            const on = quick.includes(f);
            return (
              <button key={f} type="button" aria-pressed={on} onClick={() => setQuick(on ? quick.filter((x) => x !== f) : [...quick, f])} className={`h-7 rounded-[6px] px-2.5 text-[12.5px] font-medium ${on ? SEL : "text-[#52525b] ring-1 ring-inset ring-[#e4e4e7] hover:text-[#18181b]"}`}>
                {f}
              </button>
            );
          })}
          <SearchBox value={q} onChange={setQ} placeholder="Number, customer or city" />
        </div>
      </div>
      {/* Phones: one order, two short lines. */}
      <ul className="divide-y divide-[#f0f0f2] sm:hidden">
        {sorted.map((o) => {
          const pay = payState(o);
          return (
            <li key={o.id}>
              <Link href={`${A}/orders/${o.id}`} className="block px-3 py-2.5 active:bg-[#fafafa]">
                <span className="flex items-center gap-2 text-[13px]"><b className="font-semibold">#{o.id}</b><span className="min-w-0 flex-1 truncate">{o.customer} <span className={T.muted}>· {o.city}</span></span><b className="font-semibold tabular-nums">{pkr(o.total)}</b></span>
                <span className="mt-1 flex items-center gap-3"><Status tone={STAGE_TONE[o.stage]}>{o.stage}</Status><Status tone={pay.tone}>{pay.label}</Status><span className="ml-auto text-[12px] text-[#a1a1aa]">{o.when}</span></span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={`${T.wrap} max-sm:hidden`}>
        <table className={`${T.table} min-w-[760px]`}>
          <thead>
            <tr>
              <th className={`${T.th} w-9`}><input type="checkbox" aria-label="Select all" checked={all} onChange={() => setPicked(all ? [] : shown.map((o) => o.id))} className={check} /></th>
              <SortTh k="order" label="Order" sort={sort} onSort={click} />
              <SortTh k="date" label="Date" sort={sort} onSort={click} />
              <SortTh k="customer" label="Customer" sort={sort} onSort={click} />
              <SortTh k="payment" label="Payment" sort={sort} onSort={click} />
              <SortTh k="stage" label="Stage" sort={sort} onSort={click} />
              <SortTh k="total" label="Total" sort={sort} onSort={click} right />
            </tr>
          </thead>
          <tbody>
            {sorted.map((o) => {
              const on = picked.includes(o.id);
              const pay = payState(o);
              return (
                <tr key={o.id} className={on ? "bg-[#f7f7ff]" : T.tr}>
                  <td className={T.td}><input type="checkbox" aria-label={`Select #${o.id}`} checked={on} onChange={() => setPicked(on ? picked.filter((x) => x !== o.id) : [...picked, o.id])} className={check} /></td>
                  <td className={T.td}>
                    <Link href={`${A}/orders/${o.id}`} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
                      #{o.id}
                      {o.note && <NotebookText aria-label="Has a note" className="h-3.5 w-3.5 text-[#d97706]" />}
                    </Link>
                  </td>
                  <td className={`${T.td} ${T.muted}`}>{o.when}</td>
                  <td className={T.td}>{o.customer} <span className={T.muted}>· {o.city} · {o.items} item{o.items > 1 ? "s" : ""}</span></td>
                  <td className={T.td}><Status tone={pay.tone}>{pay.label}</Status> <span className="text-[12px] text-[#a1a1aa]">{o.payment}</span></td>
                  <td className={T.td}><Status tone={STAGE_TONE[o.stage]}>{o.stage}</Status></td>
                  <td className={`${T.td} text-right font-semibold tabular-nums`}>{pkr(o.total)}</td>
                </tr>
              );
            })}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[#71717a]">No orders here.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="flex h-9 items-center justify-between px-3 text-[12px] text-[#71717a]">
        <span>{shown.length} of {orders.length} orders</span>
        <span>Delivered and paid orders are tidied away. <button type="button" className="font-medium text-[#4f46e5] hover:underline">Show them</button></span>
      </p>
      <BulkBar count={picked.length} noun="order" onClear={() => setPicked([])}>
        <button type="button" onClick={() => move("Confirmed", "confirmed")} className={barBtn}><PhoneCall /> Confirm</button>
        <button type="button" onClick={() => move("Packed", "marked packed")} className={barBtn}><PackageCheck /> Mark packed</button>
        <button type="button" onClick={() => toast(`${picked.length} packing slips ready to print`)} className={barBtn}><Printer /> Slips</button>
        <button type="button" onClick={() => toast(`${picked.length} orders exported`)} className={barBtn}><Upload /> Export CSV</button>
      </BulkBar>
    </section>
  );
}
