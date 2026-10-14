import { NotebookText } from "lucide-react";
import { ListBar, Pill, pkr, td, th } from "@/components/new-admin/ui";
import type { Order } from "@/lib/new-admin/sample";

/** The orders list: who, where, how they paid, and what is left to do. */
export function OrdersTable({ orders, views, placeholder }: { orders: Order[]; views: string[]; placeholder: string }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      <ListBar views={views} placeholder={placeholder} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-[#fafafa]">
            <tr>
              <th className={`${th} w-10`}>
                <span className="block h-4 w-4 rounded border border-[#0a0a0a]/25" />
              </th>
              <th className={th}>Order</th>
              <th className={th}>Date</th>
              <th className={th}>Customer</th>
              <th className={`${th} text-right`}>Total</th>
              <th className={th}>Payment</th>
              <th className={th}>Fulfilment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-[#fafafa]">
                <td className={td}>
                  <span className="block h-4 w-4 rounded border border-[#0a0a0a]/25" />
                </td>
                <td className={`${td} font-semibold`}>
                  <a href={`/new-admin/orders/${o.id}`} className="inline-flex items-center gap-1.5 underline-offset-4 hover:underline">
                    #{o.id}
                    {o.note && <NotebookText aria-label="Has an order note" className="h-3.5 w-3.5 text-[#0a0a0a]/40" />}
                  </a>
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
                <td className={td}>
                  {o.fulfilled === "Fulfilled" ? <Pill tone="off">Fulfilled</Pill> : o.fulfilled === "Returned" ? <Pill tone="bad">Returned</Pill> : <Pill tone="info">Unfulfilled</Pill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#0a0a0a]/[0.06] px-5 py-3 text-[13px] text-[#0a0a0a]/55">
        <span>1 to {orders.length} of 48</span>
        <span className="flex gap-1">
          <span className="rounded-lg px-2.5 py-1 ring-1 ring-[#0a0a0a]/10">Previous</span>
          <span className="rounded-lg px-2.5 py-1 font-semibold text-[#0a0a0a] ring-1 ring-[#0a0a0a]/10">Next</span>
        </span>
      </div>
    </section>
  );
}
