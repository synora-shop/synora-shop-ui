import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/data/shop";
import { getCurrency, getStoreSettings } from "@/lib/data/settings";
import { formatMoney } from "@/lib/money";
import { paymentLabel } from "@/lib/order-status-style";
import { PrintNow } from "@/components/admin/print-now";

export const dynamic = "force-dynamic";

/**
 * Packing slips (new admin, 15 October): one page per order, for the
 * orders list's bulk bar and the order page's Print slip. What goes in the
 * parcel, who it goes to, the customer's note, and on a cash order the amount
 * the courier is to collect. Opens the print dialog by itself.
 */
export default async function PackingSlips(props: { searchParams: Promise<{ ids?: string }> }) {
  await requireRole("STAFF");
  const { ids = "" } = await props.searchParams;
  const list = ids.split(",").map((x) => x.trim()).filter((x) => /^[\w-]{1,40}$/.test(x)).slice(0, 200);
  if (list.length === 0) notFound();

  const [orders, settings, currency] = await Promise.all([
    (await db()).order.findMany({
      where: { id: { in: list }, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { items: true },
    }),
    getStoreSettings(),
    getCurrency(),
  ]);
  if (orders.length === 0) notFound();
  const money = (n: number) => formatMoney(n, currency);
  const shop = settings.storeName || "Packing slip";
  const day = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: settings.timeZone || "Asia/Karachi" }).format(d);

  return (
    <div className="h-full overflow-y-auto bg-[#f4f4f4] print:h-auto print:overflow-visible print:bg-white">
      <style>{`@media print { body, body > div { height: auto !important; overflow: visible !important; } .slip { break-after: page; box-shadow: none !important; margin: 0 !important; } .no-print { display: none !important; } }`}</style>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between bg-[#0a0a0a] px-5 py-3 text-white">
        <p className="text-[14px] font-semibold">{orders.length} packing slip{orders.length === 1 ? "" : "s"}</p>
        <PrintNow />
      </div>
      <div className="mx-auto flex max-w-[48rem] flex-col gap-6 p-6 print:max-w-none print:p-0">
        {orders.map((o) => {
          const collect = o.paymentMethod === "COD" && o.paymentStatus !== "CONFIRMED";
          return (
            <section key={o.id} className="slip rounded-2xl bg-white p-8 text-[#0a0a0a] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <header className="flex items-start justify-between gap-6 border-b border-[#0a0a0a]/15 pb-5">
                <div>
                  <p className="text-[20px] font-bold tracking-[-0.01em]">{shop}</p>
                  <p className="text-[13px] text-[#0a0a0a]/60">Packing slip</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[18px] font-bold">#{o.id}</p>
                  <p className="text-[13px] text-[#0a0a0a]/60">{day(o.createdAt)}</p>
                </div>
              </header>
              <div className="grid grid-cols-2 gap-6 py-5 text-[14px]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]/50">Deliver to</p>
                  <p className="mt-1 font-semibold">{o.customerName}</p>
                  <p className="leading-snug">
                    {o.shippingLine1}
                    {o.shippingLine2 ? `, ${o.shippingLine2}` : ""}
                    <br />
                    {o.shippingCity}, {o.shippingProvince} {o.shippingPostalCode}
                  </p>
                  <p className="mt-1">{o.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]/50">Payment</p>
                  <p className="mt-1">{paymentLabel(o.paymentMethod)}</p>
                  {collect ? (
                    <p className="mt-2 inline-block rounded-lg border-2 border-[#0a0a0a] px-3 py-1.5 text-[16px] font-bold">Collect {money(o.total)}</p>
                  ) : o.paymentStatus === "CONFIRMED" ? (
                    <p className="mt-2 font-semibold">Paid</p>
                  ) : (
                    // Not cash, and not confirmed: a transfer still to be checked.
                    <p className="mt-2 font-semibold">Payment not confirmed yet</p>
                  )}
                </div>
              </div>
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-y border-[#0a0a0a]/15 text-left text-[11px] uppercase tracking-[0.08em] text-[#0a0a0a]/50">
                    <th className="py-2 font-semibold">Item</th>
                    <th className="py-2 font-semibold">Size</th>
                    <th className="py-2 text-right font-semibold">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.id} className="border-b border-[#0a0a0a]/[0.08]">
                      <td className="py-2.5">{i.title}</td>
                      <td className="py-2.5">{[i.size, i.color].filter(Boolean).join(" · ") || "None"}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{i.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {o.notes && (
                <div className="mt-5 rounded-xl border-2 border-dashed border-[#0a0a0a]/30 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]/50">Note from the customer</p>
                  <p className="mt-1 text-[15px]">{o.notes}</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
