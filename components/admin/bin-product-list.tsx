"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { RotateCcw, Trash2 } from "lucide-react";
import { formatPKR } from "@/lib/utils";
import { useServerRows } from "@/components/ui/use-server-rows";
import { effectivePrice } from "@/lib/product-pricing";
import { restoreProduct, permanentlyDeleteProduct } from "@/app/admin/products/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format-relative-time";

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
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-white">
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
            <div className="flex items-center gap-4 px-5 py-3">
              <div className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded bg-brand-50">
                {p.images[0] && (
                  <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover opacity-60" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium">{p.title}</p>
                <p className="text-xs text-ink-soft">
                  {p.categories.map((c) => c.name).join(", ") || "Uncategorized"} ·{" "}
                  {formatPKR(effectivePrice(p))}
                </p>
                <p className="text-xs text-ink-soft">Deleted {formatRelativeTime(p.deletedAt)}</p>
              </div>
            </div>
          </SwipeRow>
        ))}
        {rows.length === 0 && (
          <p className="px-5 py-4 text-sm text-ink-soft">The product bin is empty.</p>
        )}
      </div>
    </>
  );
}
