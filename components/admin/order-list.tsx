"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatPKR, cn } from "@/lib/utils";
import { useServerRows } from "@/components/ui/use-server-rows";
import { orderStatusDotStyle, orderStatusStyle, paymentLabel, statusLabel } from "@/lib/order-status-style";
import { moveOrderToBin } from "@/app/admin/orders/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { isNavigationError } from "@/lib/is-redirect";

type OrderRow = {
  id: string;
  customerName: string;
  shippingCity: string;
  /**
   * Already written out, both of them.
   *
   * Formatting a date inside a client component is a hydration mismatch
   * waiting to happen: toLocaleString follows the browser's locale and zone,
   * and a relative time reads Date.now(), so the server's HTML and the
   * client's first render disagree. Both strings are made once, on the server,
   * in the shop's own zone.
   */
  placed: string;
  placedExact: string;
  total: number;
  paymentMethod: string;
  orderStatus: string;
  items: { price: number; costPrice: number; quantity: number }[];
};

export function OrderList({ orders }: { orders: OrderRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useServerRows(orders);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: `Move order ${id} to the Bin?`,
      description: "It'll drop out of revenue/profit totals immediately. Restore it anytime from Admin → Bin.",
      confirmLabel: "Move to Bin",
      danger: true,
    });
    if (!ok) return;

    const previous = rows;
    setRows((r) => r.filter((o) => o.id !== id));
    const formData = new FormData();
    formData.set("id", id);
    try {
      await moveOrderToBin(formData);
      router.refresh();
    } catch (error) {
      // moveOrderToBin redirects on success, and a redirect announces itself
      // by throwing — catching it here would report a completed delete as a
      // failure and put the row back.
      if (isNavigationError(error)) throw error;
      // Rolling the row back without a word reads as the action having
      // worked and then quietly undone itself.
      setRows(previous);
      toast.error("Couldn't remove that order. Try again.", { blocking: true });
    }
  }

  if (rows.length === 0) {
    return (
      <>
        {dialog}
        <p className="rounded-xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-ink-soft">
          No orders match this.
        </p>
      </>
    );
  }

  return (
    <>
      {dialog}
      {/* Columns, not two blocks pushed to opposite ends. The row used to carry
          the order number and a name on the left and everything else on the
          right, with the whole middle of a 1500px screen empty — and no date,
          which is the column an order list is scanned by. */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden items-center gap-3 border-b border-border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-faint lg:flex">
          <span className="w-24">Order</span>
          <span className="min-w-0 flex-1">Customer</span>
          <span className="w-28">Placed</span>
          <span className="w-16 text-right">Items</span>
          <span className="w-36">Payment</span>
          <span className="w-24">Status</span>
          <span className="w-28 text-right">Total</span>
        </div>

        <div className="divide-y divide-border">
          {rows.map((o) => {
            const units = o.items.reduce((n, i) => n + i.quantity, 0);
            const profit = o.items.reduce((sum, i) => sum + (i.price - i.costPrice) * i.quantity, 0);
            return (
              <SwipeRow
                key={o.id}
                actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(o.id) }]}
              >
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="no-tap-scale flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 transition-colors hover:bg-subtle active:bg-subtle lg:flex-nowrap"
                >
                  <span className="w-24 flex-shrink-0 font-mono text-xs text-ink-soft">{o.id}</span>

                  <span className="min-w-0 flex-1 basis-full lg:basis-auto">
                    <span className="block truncate text-[13px] font-medium text-ink">{o.customerName}</span>
                    <span className="block truncate text-[11px] text-ink-faint">{o.shippingCity}</span>
                  </span>

                  <span className="w-28 flex-shrink-0 text-[11px] text-ink-soft" title={o.placedExact}>
                    {o.placed}
                  </span>

                  <span className="w-16 flex-shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-soft">
                    {units}
                  </span>

                  <span className="w-36 flex-shrink-0 truncate text-[11px] text-ink-soft">
                    {paymentLabel(o.paymentMethod)}
                  </span>

                  <span className="w-24 flex-shrink-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        orderStatusStyle(o.orderStatus)
                      )}
                    >
                      {/* A dot as well as a fill, so the state is not carried by
                          colour alone. */}
                      <span className={cn("h-1.5 w-1.5 rounded-full", orderStatusDotStyle(o.orderStatus))} aria-hidden />
                      {statusLabel(o.orderStatus)}
                    </span>
                  </span>

                  <span className="w-28 flex-shrink-0 text-right">
                    <span className="block font-mono text-[13px] font-medium tabular-nums text-ink">
                      {formatPKR(o.total)}
                    </span>
                    <span className="block font-mono text-[10px] tabular-nums text-ink-faint">
                      {formatPKR(profit)} profit
                    </span>
                  </span>
                </Link>
              </SwipeRow>
            );
          })}
        </div>
      </div>
    </>
  );
}
