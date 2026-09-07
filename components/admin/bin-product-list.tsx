"use client";

import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";

import { useServerRows } from "@/components/ui/use-server-rows";
import { effectivePrice } from "@/lib/product-pricing";
import { restoreProduct, permanentlyDeleteProduct } from "@/app/admin/products/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { Thumb } from "@/components/admin/product-elements";
import { EmptyState } from "@/components/ui/primitives";
import { useMoney } from "@/components/ui/currency";

type BinProductRow = {
  id: string;
  title: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  deletedAt: Date | null;
  categories: { name: string }[];
};

export function BinProductList({ products }: { products: BinProductRow[] }) {
  const money = useMoney();
  const router = useRouter();
  const [rows, setRows] = useServerRows(products);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  async function handleRestore(id: string) {
    const previous = rows;
    setRows((r) => r.filter((p) => p.id !== id));
    const formData = new FormData();
    formData.set("id", id);
    try {
      await restoreProduct(formData);
      router.refresh();
      toast.success("Product restored.");
    } catch {
      // Putting the row back without a word means the click looked like it
      // worked and then quietly undid itself, which is worse than an error.
      setRows(previous);
      toast.error("Couldn't restore that product. Try again.", { blocking: true });
    }
  }

  async function handlePermanentDelete(id: string, title: string) {
    const ok = await confirm({
      title: `Permanently delete "${title}"?`,
      description: "This can't be undone. The product row and any Vercel Blob images are freed immediately.",
      confirmLabel: "Delete Forever",
      danger: true,
    });
    if (!ok) return;

    const previous = rows;
    setRows((r) => r.filter((p) => p.id !== id));
    const formData = new FormData();
    formData.set("id", id);
    try {
      await permanentlyDeleteProduct(formData);
      router.refresh();
      toast.success("Product deleted for good.");
    } catch {
      setRows(previous);
      toast.error("Couldn't delete that product. Try again.", { blocking: true });
    }
  }

  return (
    <>
      {dialog}
      {rows.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="The product bin is empty"
          description="Products you delete land here first, and can be restored for as long as they sit in it."
        />
      ) : (
      <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
        {rows.map((p) => (
          <SwipeRow
            key={p.id}
            actions={[
              { key: "restore", label: "Restore", icon: RotateCcw, tone: "success", onClick: () => handleRestore(p.id) },
              {
                key: "delete",
                label: "Delete Forever",
                icon: Trash2,
                tone: "danger",
                onClick: () => handlePermanentDelete(p.id, p.title),
              },
            ]}
          >
            {/* The same row as the catalogue's, dimmed: a binned product should
                be recognisably the thing it was, not a different object. */}
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 opacity-75 lg:grid-cols-[2.75rem_minmax(0,1fr)_9rem_9rem] lg:gap-4">
              <Thumb src={p.images[0]} size="row" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                <p className="truncate text-xs text-ink-faint">
                  {p.categories.map((c) => c.name).join(", ") || "Uncategorised"}
                </p>
                <p className="mt-1 text-xs text-ink-faint lg:hidden">
                  {money(effectivePrice(p))} · deleted {formatRelativeTime(p.deletedAt)}
                </p>
              </div>
              <p className="hidden text-xs text-ink-faint lg:block">
                Deleted {formatRelativeTime(p.deletedAt)}
              </p>
              <p className="hidden text-right text-sm font-medium tabular-nums text-ink lg:block">
                {money(effectivePrice(p))}
              </p>
            </div>
          </SwipeRow>
        ))}
      </div>
      )}
    </>
  );
}
