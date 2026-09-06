"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";
import { ListEmpty } from "@/components/admin/list-empty";
import { StatusMark, StockMark, Thumb } from "@/components/admin/product-elements";
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


/**
 * The catalogue, as rows or as tiles.
 *
 * Which is better depends on what is being sold — a rail of dresses is a wall
 * of pictures, a shelf of spare parts is a table of names and numbers — so the
 * merchant picks and the choice is in the URL. Deleting, the confirm dialog and
 * the optimistic row removal are shared between both; only the markup differs.
 */
export function ProductList({
  products,
  view = "list",
  filtered = false,
  lowStock,
}: {
  products: ProductRow[];
  view?: "list" | "grid";
  /** Whether a search or filter is what emptied this — see ListEmpty. */
  filtered?: boolean;
  /** The store's own low-stock threshold, so "3 left" means what Settings says. */
  lowStock: number;
}) {
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

  if (rows.length === 0) {
    return (
      <>
        {dialog}
        <ListEmpty
          filtered={filtered}
          basePath="/admin/products"
          thing="products"
          icon={Package}
          action={
            <ButtonLink href="/admin/products/new" variant="primary" size="sm">
              Add your first product
            </ButtonLink>
          }
        />
      </>
    );
  }

  if (view === "grid") {
    return (
      <>
        {dialog}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((p) => {
            const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
            return (
              <li
                key={p.id}
                // A column so every tile's Bin bar lands on the same line,
                // whatever the text above it happens to be.
                className="group/tile flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-sm"
              >
                <Link href={`/admin/products/${p.id}`} className="flex flex-1 flex-col">
                  <div className="relative">
                    <Thumb src={p.images[0]} size="tile" />
                    {/* On a picture, the state goes on the picture — a merchant
                        scanning a wall of tiles never reaches the text. */}
                    <span className="absolute left-2 top-2">
                      <StatusMark status={p.status} />
                    </span>
                    {!p.isActive && (
                      <span className="absolute right-2 top-2 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-medium text-white">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium text-ink">{p.title}</p>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium tabular-nums text-ink">
                        {formatPKR(effectivePrice(p))}
                      </span>
                      {p.salePrice != null && p.salePrice < p.basePrice && (
                        <span className="text-[11px] tabular-nums text-ink-faint line-through">
                          {formatPKR(p.basePrice)}
                        </span>
                      )}
                    </div>
                    <StockMark stock={stock} low={lowStock} className="block" />
                  </div>
                </Link>
                {/* No swipe in the grid — a tile has no long edge to swipe
                    along, so the action has to be a button you can see. */}
                <button
                  type="button"
                  onClick={() => handleDelete(p.id, p.title)}
                  aria-label={`Move ${p.title} to the Bin`}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-border py-1.5 text-[11px] text-ink-soft transition-colors hover:bg-rose-bg hover:text-rose"
                >
                  <Trash2 className="h-3 w-3" />
                  Bin
                </button>
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <>
      {dialog}
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.map((p) => {
          const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
          return (
            <SwipeRow
              key={p.id}
              actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(p.id, p.title) }]}
            >
              <Link
                href={`/admin/products/${p.id}`}
                className="no-tap-scale grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-subtle active:bg-subtle lg:grid-cols-[2.75rem_minmax(0,1fr)_7.5rem_9rem_7rem] lg:gap-4"
              >
                <Thumb src={p.images[0]} size="row" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{p.title}</p>
                  <p className="truncate text-xs text-ink-faint">
                    {p.categories.map((c) => c.name).join(", ") || "Uncategorised"}
                    {!p.isActive && " · Hidden"}
                  </p>
                  {/* Narrow screens have no columns to put these in, so they
                      fold under the name rather than disappearing. */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 lg:hidden">
                    <span className="text-xs font-medium tabular-nums text-ink">
                      {formatPKR(effectivePrice(p))}
                    </span>
                    <StockMark stock={stock} low={lowStock} />
                    <StatusMark status={p.status} />
                  </div>
                </div>

                <div className="hidden lg:block">
                  <StockMark stock={stock} low={lowStock} />
                </div>

                {/* Figures right-aligned and tabular, so the column reads down
                    as a column of money instead of ragged sentences. */}
                <div className="hidden text-right lg:block">
                  <p className="text-sm font-medium tabular-nums text-ink">
                    {formatPKR(effectivePrice(p))}
                    {p.salePrice != null && p.salePrice < p.basePrice && (
                      <span className="ml-1.5 text-[11px] font-normal tabular-nums text-ink-faint line-through">
                        {formatPKR(p.basePrice)}
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] tabular-nums text-ink-faint">
                    <span className={unitProfit(p) < 0 ? "font-medium text-rose" : undefined}>
                      {formatPKR(unitProfit(p))}
                    </span>{" "}
                    profit · {profitMargin(p)?.toFixed(0) ?? 0}%
                  </p>
                </div>

                <div className="hidden justify-end lg:flex">
                  <StatusMark status={p.status} />
                </div>
              </Link>
            </SwipeRow>
          );
        })}
      </div>
    </>
  );
}
