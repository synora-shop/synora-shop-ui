"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import { formatPKR, cn } from "@/lib/utils";
import { useServerRows } from "@/components/ui/use-server-rows";
import { orderStatusStyle } from "@/lib/order-status-style";
import { restoreOrder, permanentlyDeleteOrder } from "@/app/admin/orders/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format-relative-time";

type BinOrderRow = {
  id: string;
  customerName: string;
  total: number;
  orderStatus: string;
  paymentMethod: string;
  deletedAt: Date | null;
};

export function BinOrderList({ orders }: { orders: BinOrderRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useServerRows(orders);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  async function handleRestore(id: string) {
    const previous = rows;
    setRows((r) => r.filter((o) => o.id !== id));
    const formData = new FormData();
    formData.set("id", id);
    try {
      await restoreOrder(formData);
      router.refresh();
      toast.success("Order restored.");
    } catch {
      // See bin-product-list: a silent rollback reads as the action having
      // worked and then changed its mind.
      setRows(previous);
      toast.error("Couldn't restore that order. Try again.", { blocking: true });
    }
  }

  async function handlePermanentDelete(id: string) {
    const ok = await confirm({
      title: `Permanently delete order ${id}?`,
      description: "This can't be undone, the order and its line items are removed for good.",
      confirmLabel: "Delete Forever",
      danger: true,
    });
    if (!ok) return;

    const previous = rows;
    setRows((r) => r.filter((o) => o.id !== id));
    const formData = new FormData();
    formData.set("id", id);
    try {
      await permanentlyDeleteOrder(formData);
      router.refresh();
      toast.success("Order deleted for good.");
    } catch {
      setRows(previous);
      toast.error("Couldn't delete that order. Try again.", { blocking: true });
    }
  }

  return (
    <>
      {dialog}
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-white">
        {rows.map((o) => (
          <SwipeRow
            key={o.id}
            actions={[
              { key: "restore", label: "Restore", icon: RotateCcw, tone: "success", onClick: () => handleRestore(o.id) },
              {
                key: "delete",
                label: "Delete Forever",
                icon: Trash2,
                tone: "danger",
                onClick: () => handlePermanentDelete(o.id),
              },
            ]}
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="font-mono text-xs text-ink-soft">{o.id}</p>
                <p className="text-sm font-medium">{o.customerName}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                  <span>{o.paymentMethod}</span>
                  <span
                    className={cn(
                      "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                      orderStatusStyle(o.orderStatus)
                    )}
                  >
                    {o.orderStatus}
                  </span>
                  <span>· Deleted {formatRelativeTime(o.deletedAt)}</span>
                </div>
              </div>
              <p className="flex-shrink-0 text-sm font-medium">{formatPKR(o.total)}</p>
            </div>
          </SwipeRow>
        ))}
        {rows.length === 0 && (
          <p className="px-5 py-4 text-sm text-ink-soft">The orders bin is empty.</p>
        )}
      </div>
    </>
  );
}
