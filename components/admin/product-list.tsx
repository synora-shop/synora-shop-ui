"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { formatPKR, cn } from "@/lib/utils";
import { useServerRows } from "@/components/ui/use-server-rows";
import { effectivePrice, unitProfit, profitMargin } from "@/lib/product-pricing";
import { moveProductToBin } from "@/app/admin/products/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type ProductRow = {
  id: string;
  title: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  costPrice: number;
  isActive: boolean;
  status: "DRAFT" | "PUBLISHED";
  categories: { name: string }[];
  variants: { stock: number }[];
};

export function ProductList({ products }: { products: ProductRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useServerRows(products);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();

  async function handleDelete(id: string, title: string) {
    const ok = await confirm({
      title: `Move "${title}" to the Bin?`,
      description: "It'll disappear from the store immediately. Restore it anytime from Admin → Bin, or delete it permanently from there.",
      confirmLabel: "Move to Bin",
      danger: true,
    });
    if (!ok) return;

    const previous = rows;
    setRows((r) => r.filter((p) => p.id !== id));
    const formData = new FormData();
    formData.set("id", id);
    try {
      await moveProductToBin(formData);
      router.refresh();
    } catch {
      // Rolling the row back without a word reads as the action having
      // worked and then quietly undone itself.
      setRows(previous);
      toast.error("Couldn't remove that product. Try again.", { blocking: true });
    }
  }

  return (
    <>
      {dialog}
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-white">
        {rows.map((p) => {
          const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
          return (
            <SwipeRow
              key={p.id}
              actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(p.id, p.title) }]}
            >
              <Link
                href={`/admin/products/${p.id}`}
                className="no-tap-scale flex items-center gap-4 px-5 py-3 transition-colors hover:bg-subtle active:bg-subtle"
              >
                <div className="relative h-14 w-11 flex-shrink-0 overflow-hidden rounded bg-brand-50">
                  {p.images[0] && (
                    <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium">{p.title}</p>
                    <span
                      className={cn(
                        "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                        p.status === "DRAFT" ? "bg-amber-bg text-amber" : "bg-green-bg text-green"
                      )}
                    >
                      {p.status === "DRAFT" ? "Draft" : "Published"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    {p.categories.map((c) => c.name).join(", ") || "Uncategorized"} ·{" "}
                    {formatPKR(effectivePrice(p))} · {stock} in stock
                    {!p.isActive && " · Hidden"}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Cost {formatPKR(p.costPrice)} · Profit{" "}
                    <span className={unitProfit(p) < 0 ? "font-medium text-rose" : "font-medium text-brand-600"}>
                      {formatPKR(unitProfit(p))}/unit ({profitMargin(p)?.toFixed(0) ?? 0}%)
                    </span>
                  </p>
                </div>
              </Link>
            </SwipeRow>
          );
        })}
        {rows.length === 0 && (
          <p className="px-5 py-4 text-sm text-ink-soft">No products here.</p>
        )}
      </div>
    </>
  );
}
