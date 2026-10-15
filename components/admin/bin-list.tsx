"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import { useServerRows } from "@/components/ui/use-server-rows";
import { restoreProduct, permanentlyDeleteProduct } from "@/app/admin/products/actions";
import { restoreOrder, permanentlyDeleteOrder } from "@/app/admin/orders/actions";
import { emptyBin } from "@/app/admin/bin/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { Thumb } from "@/components/admin/product-elements";
import { StatePill } from "@/components/admin/kit";
import { EmptyState } from "@/components/ui/primitives";

/**
 * The Bin as the design draws it (new admin, 15 October): one list of what
 * was deleted, newest first, each with Restore and Delete for good, and
 * Empty the Bin at the foot. Things stay until they are deleted for good.
 */
export type BinRow = {
  id: string;
  kind: "Product" | "Order";
  name: string;
  detail: string;
  image?: string;
  deletedAt: Date;
};

export function BinList({ rows: initial, canEmpty }: { rows: BinRow[]; canEmpty: boolean }) {
  const router = useRouter();
  const [rows, setRows] = useServerRows(initial);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const [emptying, start] = useTransition();

  async function restore(r: BinRow) {
    const previous = rows;
    setRows((x) => x.filter((y) => y !== r));
    const formData = new FormData();
    formData.set("id", r.id);
    try {
      await (r.kind === "Product" ? restoreProduct(formData) : restoreOrder(formData));
      toast.success(`${r.name} restored.`);
      router.refresh();
    } catch {
      setRows(previous);
      toast.error("Could not restore that. Try again.", { blocking: true });
    }
  }

  async function destroy(r: BinRow) {
    const ok = await confirm({
      title: `Delete ${r.name} for good?`,
      description: r.kind === "Product" ? "This cannot be undone. Its pictures are deleted too. Past orders keep their own copy of it." : "This cannot be undone. It leaves every report.",
      confirmLabel: "Delete for good",
      danger: true,
    });
    if (!ok) return;
    const previous = rows;
    setRows((x) => x.filter((y) => y !== r));
    const formData = new FormData();
    formData.set("id", r.id);
    try {
      await (r.kind === "Product" ? permanentlyDeleteProduct(formData) : permanentlyDeleteOrder(formData));
      toast.success(`${r.name} deleted for good.`);
      router.refresh();
    } catch {
      setRows(previous);
      toast.error("Could not delete that. Try again.", { blocking: true });
    }
  }

  async function empty() {
    const ok = await confirm({
      title: "Empty the Bin?",
      description: `${rows.length === 1 ? "The one thing in it is" : `All ${rows.length} things in it are`} deleted for good. This cannot be undone.`,
      confirmLabel: "Empty the Bin",
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const result = await emptyBin();
      if (!result.ok) return toast.error(result.error, { blocking: true });
      setRows([]);
      toast.success("The Bin is empty.");
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return <EmptyState icon={Trash2} title="The Bin is empty" description="Products and orders you delete land here first, and can be restored until you delete them for good." />;
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      {dialog}
      <ul className="divide-y divide-[#0a0a0a]/[0.06]">
        {rows.map((r) => (
          <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
            <StatePill tone="off">{r.kind}</StatePill>
            {r.kind === "Product" && <Thumb src={r.image} size="row" />}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14.5px] font-medium">{r.name}</span>
              <span className="text-[12.5px] text-[#0a0a0a]/50">{[r.detail, `Deleted ${formatRelativeTime(r.deletedAt)}`].filter(Boolean).join(" · ")}</span>
            </span>
            <span className="flex gap-2">
              <button type="button" onClick={() => restore(r)} className="inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">
                <RotateCcw className="h-4 w-4" /> Restore
              </button>
              <button type="button" onClick={() => destroy(r)} aria-label={`Delete ${r.name} for good`} className="grid h-8 w-8 place-items-center rounded-[10px] text-[#a3330c] hover:bg-[#ffe9e2]">
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {canEmpty && (
        <div className="flex justify-end border-t border-[#0a0a0a]/[0.06] px-5 py-3">
          <button type="button" onClick={empty} disabled={emptying} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#a3330c] disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Empty the Bin
          </button>
        </div>
      )}
    </section>
  );
}
