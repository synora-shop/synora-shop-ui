import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { db } from "@/lib/data/shop";
import { getCurrency } from "@/lib/data/settings";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { StatePill } from "@/components/admin/kit";
import { draftLabel, draftTotals, readDraftLines } from "@/lib/draft-orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Draft orders" };

/** Orders the merchant builds by hand (new admin, 15 October), as the design lists them. */
const GRID = "lg:grid lg:grid-cols-[5rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_8rem_8.5rem] lg:items-center";

export default async function DraftOrdersPage() {
  const [drafts, currency] = await Promise.all([
    (await db()).draftOrder.findMany({ orderBy: { updatedAt: "desc" }, take: 500 }),
    getCurrency(),
  ]);
  const money = (n: number) => formatMoney(n, currency);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Draft orders"
        description="Orders you build yourself, for a customer who messaged or called."
        actions={
          <Link href="/admin/orders/drafts/new" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white">
            <Plus className="h-4 w-4" /> Create draft
          </Link>
        }
      />
      {drafts.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No draft orders yet"
          description="When someone orders on WhatsApp or over the phone, build it here, send them the summary to confirm, then make it an order in one click."
        />
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
          <div role="row" className={`hidden gap-4 bg-[#0a0a0a] px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white/55 lg:grid ${GRID}`}>
            <span>Draft</span><span>Customer</span><span>Came in by</span><span>Created</span><span className="text-right">Total</span><span>Status</span>
          </div>
          <div className="divide-y divide-[#0a0a0a]/[0.06]">
            {drafts.map((d) => {
              const { total } = draftTotals({ lines: readDraftLines(d.lines), shippingFee: d.shippingFee, discountAmount: d.discountAmount });
              return (
                <Link
                  key={d.id}
                  href={d.status === "COMPLETED" && d.orderId ? `/admin/orders/${d.orderId}` : `/admin/orders/drafts/${d.id}`}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-[#fafafa] ${GRID}`}
                >
                  <b className="font-semibold">#{draftLabel(d.number)}</b>
                  <span className="truncate text-[14px]">{d.customerName || <span className="text-[#0a0a0a]/40">No name yet</span>}</span>
                  <span className="text-[13.5px] text-[#0a0a0a]/60">{d.channel}</span>
                  <span className="text-[13.5px] text-[#0a0a0a]/60">{formatRelativeTime(d.createdAt)}</span>
                  <b className="font-semibold tabular-nums lg:text-right">{money(total)}</b>
                  <span>
                    {d.status === "COMPLETED" ? (
                      <StatePill tone="good">Order #{d.orderId}</StatePill>
                    ) : d.status === "SENT" ? (
                      <StatePill tone="info">Sent to confirm</StatePill>
                    ) : (
                      <StatePill tone="off">Open</StatePill>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
