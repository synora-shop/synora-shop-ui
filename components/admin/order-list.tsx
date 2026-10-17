"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { NotebookText, PackageCheck, PhoneCall, Printer, ShoppingBag, Trash2, Upload } from "lucide-react";
import { BarButton, BulkBar } from "@/components/admin/bulk-bar";
import { ListEmpty } from "@/components/admin/list-empty";
import { ORDER_GRID, STAGE_TONE, StatePill, paymentState } from "@/components/admin/kit";
import { useServerRows } from "@/components/ui/use-server-rows";
import { paymentLabel, statusLabel } from "@/lib/order-status-style";
import { bulkOrderStage, moveOrderToBin } from "@/app/admin/orders/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { isNavigationError } from "@/lib/is-redirect";
import { useMoney } from "@/components/ui/currency";

/**
 * The orders list (new admin, 15 October).
 *
 * A black head whose column names sort the list on the server (the page
 * hands them in as `head`, because the ordering lives in the address), then
 * one row per order: its number, who and where, when, what it came to and the
 * profit on it, how it is being paid and whether that is done, and the stage
 * it is at. Each stage and payment state wears its colour; nothing else does.
 *
 * Moving an order to the Bin is unchanged: asked first, removed at once, put
 * back if the server refuses. On a phone it is a swipe.
 */
type OrderRow = {
  id: string;
  customerName: string;
  shippingCity: string;
  placed: string;
  placedExact: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  notes: string | null;
  items: { price: number; costPrice: number; quantity: number }[];
};

export function OrderList({ orders, filtered = false, head }: { orders: OrderRow[]; filtered?: boolean; head?: ReactNode }) {
  const money = useMoney();
  const router = useRouter();
  const [rows, setRows] = useServerRows(orders);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  // Ticked orders, and what can be done to them together (new admin): move
  // them on a stage, print their packing slips, or export just them.
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [running, startBulk] = useTransition();
  const selected = rows.filter((o) => picked.has(o.id)).map((o) => o.id);
  const allPicked = rows.length > 0 && selected.length === rows.length;
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function moveAll(to: string, verb: string) {
    const ids = selected;
    startBulk(async () => {
      const result = await bulkOrderStage(ids, to);
      if (!result.ok) {
        toast.error(result.error, { blocking: true });
        return;
      }
      setPicked(new Set());
      toast.success(result.changed === 0 ? "Those were already there." : `${result.changed} order${result.changed === 1 ? "" : "s"} ${verb}.`);
      router.refresh();
    });
  }

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
      if (isNavigationError(error)) throw error;
      setRows(previous);
      toast.error("Couldn't remove that order. Try again.", { blocking: true });
    }
  }

  if (rows.length === 0) {
    return (
      <>
        {dialog}
        <ListEmpty filtered={filtered} basePath="/admin/orders" thing="orders" icon={ShoppingBag} />
      </>
    );
  }

  return (
    <>
      {dialog}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        {head && (
          <div role="row" className={`hidden gap-x-4 bg-[#0a0a0a] py-1.5 pl-4 pr-16 lg:grid ${ORDER_GRID}`}>
            <input
              type="checkbox"
              aria-label="Select every order on this page"
              checked={allPicked}
              onChange={() => setPicked(allPicked ? new Set() : new Set(rows.map((o) => o.id)))}
              className="h-4 w-4 accent-white"
            />
            {head}
          </div>
        )}
        <div className="divide-y divide-[#0a0a0a]/[0.06]">
          {rows.map((o) => {
            const units = o.items.reduce((n, i) => n + i.quantity, 0);
            const profit = o.items.reduce((sum, i) => sum + (i.price - i.costPrice) * i.quantity, 0);
            const pay = paymentState(o.paymentMethod, o.paymentStatus);
            return (
              <SwipeRow key={o.id} actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(o.id) }]}>
                <div className={`group relative flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 transition-colors ${picked.has(o.id) ? "bg-[#f5f5ff]" : "hover:bg-[#fafafa]"} ${ORDER_GRID}`}>
                  <input
                    type="checkbox"
                    aria-label={`Select order ${o.id}`}
                    checked={picked.has(o.id)}
                    onChange={() => toggle(o.id)}
                    className="relative z-10 h-4 w-4 accent-[#0a0a0a]"
                  />
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-1.5 font-mono text-[13.5px] font-semibold text-[#0a0a0a] underline-offset-4 after:absolute after:inset-0 hover:underline">
                    #{o.id}
                    {o.notes && <NotebookText aria-label="Has a note" className="h-3.5 w-3.5 text-[#b45309]" />}
                  </Link>
                  <span className="min-w-0 basis-full lg:basis-auto">
                    <span className="block truncate text-[14px] font-medium text-[#0a0a0a]">{o.customerName}</span>
                    <span className="block truncate text-[12.5px] text-[#0a0a0a]/50">{o.shippingCity} · {units} item{units === 1 ? "" : "s"}</span>
                  </span>
                  <span className="text-[13px] text-[#0a0a0a]/60" title={o.placedExact}>{o.placed}</span>
                  <span className="flex flex-col items-start gap-0.5">
                    <StatePill tone={pay.tone}>{pay.label}</StatePill>
                    <span className="text-[12px] text-[#0a0a0a]/50">{paymentLabel(o.paymentMethod)}</span>
                  </span>
                  <span className="lg:text-right">
                    <span className="block text-[14px] font-semibold tabular-nums text-[#0a0a0a]">{money(o.total)}</span>
                    <span className="block text-[11.5px] tabular-nums text-[#0a0a0a]/45">{money(profit)} profit</span>
                  </span>
                  <span><StatePill tone={STAGE_TONE[o.orderStatus] ?? "off"}>{statusLabel(o.orderStatus)}</StatePill></span>
                </div>
              </SwipeRow>
            );
          })}
        </div>
      </section>
      {selected.length > 0 && (
        <BulkBar count={selected.length} noun="order" onClear={() => setPicked(new Set())}>
          <BarButton disabled={running} onClick={() => moveAll("CONFIRMED", "confirmed")}>
            <PhoneCall /> Confirm
          </BarButton>
          <BarButton disabled={running} onClick={() => moveAll("PACKED", "marked packed")}>
            <PackageCheck /> Mark packed
          </BarButton>
          <BarButton onClick={() => window.open(`/admin/slips?ids=${selected.join(",")}`, "_blank", "noopener")}>
            <Printer /> Packing slips
          </BarButton>
          <BarButton onClick={() => download(`/admin/orders/export?ids=${selected.join(",")}`)}>
            <Upload /> Export CSV
          </BarButton>
        </BulkBar>
      )}
    </>
  );
}

/** A file, not a page: a link the browser follows to save it. */
function download(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
