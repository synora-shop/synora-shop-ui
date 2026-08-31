"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatPKR, cn } from "@/lib/utils";
import { useServerRows } from "@/components/ui/use-server-rows";
import { orderStatusStyle } from "@/lib/order-status-style";
import { moveOrderToBin } from "@/app/admin/orders/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { isNavigationError } from "@/lib/is-redirect";

type OrderRow = {
  id: string;
  customerName: string;
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

  return (
    <>
      {dialog}
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-white">
        {rows.map((o) => (
          <SwipeRow
            key={o.id}
            actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(o.id) }]}
          >
            <Link
              href={`/admin/orders/${o.id}`}
              className="no-tap-scale flex items-center justify-between px-5 py-3 transition-colors hover:bg-subtle active:bg-subtle"
            >
              <div>
                <p className="font-mono text-xs text-ink-soft">{o.id}</p>
                <p className="text-sm font-medium">{o.customerName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatPKR(o.total)}</p>
                <div className="mt-0.5 flex items-center justify-end gap-1.5 text-xs text-ink-soft">
                  <span>{o.paymentMethod}</span>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                      orderStatusStyle(o.orderStatus)
                    )}
                  >
                    {o.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-brand-600">
                  Profit {formatPKR(o.items.reduce((sum, i) => sum + (i.price - i.costPrice) * i.quantity, 0))}
                </p>
              </div>
            </Link>
          </SwipeRow>
        ))}
        {rows.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No orders found.</p>}
      </div>
    </>
  );
}
