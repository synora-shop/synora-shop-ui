"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Eye, EyeOff, Package, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";
import { BarButton, BulkBar } from "@/components/admin/bulk-bar";
import { ListEmpty } from "@/components/admin/list-empty";
import { StatusMark, StockMark, Thumb } from "@/components/admin/product-elements";
import { PRODUCT_GRID, PRODUCT_GRID_NO_STATUS } from "@/components/admin/kit";
import { cn } from "@/lib/utils";
import { useServerRows } from "@/components/ui/use-server-rows";
import { effectivePrice, unitProfit, profitMargin } from "@/lib/product-pricing";
import { bulkProducts, moveProductToBin, type BulkAction } from "@/app/admin/products/actions";
import { SwipeRow } from "@/components/ui/swipe-row";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useMoney } from "@/components/ui/currency";

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
 *
 * New admin (15 October): the rows sit under a black head whose column names
 * sort the list on the server (the page hands it in as `head`), ticked rows
 * bring up the black bar of what can be done to them, and tiles are portrait,
 * the shape clothes are photographed in. What each action does is unchanged.
 */
export function ProductList({
  products,
  view = "list",
  filtered = false,
  lowStock,
  showStatus = true,
  head,
}: {
  products: ProductRow[];
  view?: "list" | "grid";
  /** Whether a search or filter is what emptied this — see ListEmpty. */
  filtered?: boolean;
  /** The store's own low-stock threshold, so "3 left" means what Settings says. */
  lowStock: number;
  /**
   * Whether to draw the Draft/Published mark. Off on a screen where every row
   * is the same state: a column reading "Draft" on a screen called Drafts says
   * nothing.
   */
  showStatus?: boolean;
  /** The sorting head of the list view, drawn by the server page. */
  head?: ReactNode;
}) {
  const router = useRouter();
  const money = useMoney();
  const [rows, setRows] = useServerRows(products);
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [running, startBulk] = useTransition();

  // A tick on a row that has since been filtered away, or binned, would be
  // acted on invisibly. The selection is always intersected with what is on
  // screen, so what the bar counts is what the merchant can see.
  const selected = useMemo(() => rows.filter((p) => picked.has(p.id)).map((p) => p.id), [rows, picked]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(action: BulkAction, verb: string) {
    if (selected.length === 0) return;
    if (action === "bin") {
      const ok = await confirm({
        title: `Move ${selected.length} product${selected.length === 1 ? "" : "s"} to the Bin?`,
        description: "They disappear from the store immediately. Restore them anytime from Admin → Bin.",
        confirmLabel: "Move to Bin",
        danger: true,
      });
      if (!ok) return;
    }
    const ids = selected;
    startBulk(async () => {
      const result = await bulkProducts(action, ids);
      if ("error" in result) {
        toast.error(result.error, { blocking: true });
        return;
      }
      setPicked(new Set());
      toast.success(
        result.changed === 0 ? "Nothing needed changing." : `${result.changed} product${result.changed === 1 ? "" : "s"} ${verb}.`
      );
      router.refresh();
    });
  }

  function Tick({ id, title }: { id: string; title: string }) {
    const on = picked.has(id);
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={on}
        aria-label={`Select ${title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(id);
        }}
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[5px] border transition-colors",
          on ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[#0a0a0a]/25 bg-white text-transparent hover:border-[#0a0a0a]/50"
        )}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </button>
    );
  }

  const bulkBar = selected.length > 0 && (
    <BulkBar count={selected.length} noun="product" onClear={() => setPicked(new Set())}>
      <BarButton disabled={running} onClick={() => runBulk("publish", "published")}>
        <Eye /> Publish
      </BarButton>
      <BarButton disabled={running} onClick={() => runBulk("unpublish", "moved to drafts")}>
        <EyeOff /> Unpublish
      </BarButton>
      <BarButton danger disabled={running} onClick={() => runBulk("bin", "moved to the Bin")}>
        <Trash2 /> Bin
      </BarButton>
    </BulkBar>
  );

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
                className={cn(
                  "group/tile flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 transition-shadow hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.45)]",
                  picked.has(p.id) ? "ring-2 ring-[#0a0a0a]" : "ring-[#0a0a0a]/[0.07]"
                )}
              >
                <Link href={`/admin/products/${p.id}`} className="flex flex-1 flex-col">
                  <div className="relative">
                    <Thumb src={p.images[0]} size="tile" />
                    <span className="absolute left-2.5 top-2.5 z-10">
                      <Tick id={p.id} title={p.title} />
                    </span>
                    {/* On a picture, the state goes on the picture: a merchant
                        scanning a wall of tiles never reaches the text. */}
                    {showStatus && (
                      <span className="absolute bottom-2.5 left-2.5">
                        <StatusMark status={p.status} />
                      </span>
                    )}
                    {!p.isActive && (
                      <span className="absolute right-2.5 top-2.5 rounded-full bg-[#0a0a0a]/75 px-2 py-0.5 text-[11px] font-semibold text-white">Hidden</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <p className="line-clamp-2 text-[13.5px] font-semibold text-[#0a0a0a]">{p.title}</p>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13px] font-semibold tabular-nums text-[#0a0a0a]">{money(effectivePrice(p))}</span>
                      {p.salePrice != null && p.salePrice < p.basePrice && (
                        <span className="text-[11.5px] tabular-nums text-[#0a0a0a]/40 line-through">{money(p.basePrice)}</span>
                      )}
                    </div>
                    <StockMark stock={stock} low={lowStock} className="block" />
                  </div>
                </Link>
                {/* No swipe in the grid: a tile has no long edge to swipe
                    along, so the action has to be a button you can see. */}
                <button
                  type="button"
                  onClick={() => handleDelete(p.id, p.title)}
                  aria-label={`Move ${p.title} to the Bin`}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-[#0a0a0a]/[0.06] py-2 text-[12px] font-semibold text-[#0a0a0a]/45 transition-colors hover:bg-[#ffe9e2] hover:text-[#a3330c]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Bin
                </button>
              </li>
            );
          })}
        </ul>
        {bulkBar}
      </>
    );
  }

  return (
    <>
      {dialog}
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        {head}
        <div className="divide-y divide-[#0a0a0a]/[0.06]">
          {rows.map((p) => {
            const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
            return (
              <SwipeRow
                key={p.id}
                actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => handleDelete(p.id, p.title) }]}
              >
                <Link
                  href={`/admin/products/${p.id}`}
                  className={cn(
                    "no-tap-scale grid grid-cols-[1.25rem_2rem_minmax(0,1fr)] items-center gap-3 px-4 py-2 transition-colors hover:bg-[#fafafa] lg:min-h-11 lg:gap-4 lg:py-1.5",
                    showStatus ? PRODUCT_GRID : PRODUCT_GRID_NO_STATUS,
                    picked.has(p.id) && "bg-[#f5f5ff] hover:bg-[#f0f0ff]"
                  )}
                >
                  <Tick id={p.id} title={p.title} />
                  <Thumb src={p.images[0]} size="row" />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px]">
                      <span className="font-medium text-[#0a0a0a]">{p.title}</span>
                      <span className="text-[#0a0a0a]/45"> · {p.categories.map((c) => c.name).join(", ") || "Uncategorised"}{!p.isActive && " · Hidden"}</span>
                    </p>
                    {/* Narrow screens have no columns to put these in, so they
                        fold under the name rather than disappearing. */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 lg:hidden">
                      <span className="text-[13px] font-semibold tabular-nums text-[#0a0a0a]">{money(effectivePrice(p))}</span>
                      <StockMark stock={stock} low={lowStock} />
                      {showStatus && <StatusMark status={p.status} />}
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <StockMark stock={stock} low={lowStock} />
                  </div>
                  {/* Figures right-aligned and tabular, so the column reads down
                      as a column of money instead of ragged sentences. */}
                  <div className="hidden items-baseline justify-end gap-1.5 lg:flex" title={`${money(unitProfit(p))} profit · ${profitMargin(p)?.toFixed(0) ?? 0}% margin`}>
                    <span className={cn("text-[11.5px] tabular-nums", unitProfit(p) < 0 ? "font-semibold text-[#a3330c]" : "text-[#1d7a52]/80")}>{profitMargin(p)?.toFixed(0) ?? 0}%</span>
                    {p.salePrice != null && p.salePrice < p.basePrice && (
                      <span className="text-[11.5px] tabular-nums text-[#0a0a0a]/40 line-through">{money(p.basePrice)}</span>
                    )}
                    <span className="text-[13.5px] font-semibold tabular-nums text-[#0a0a0a]">{money(effectivePrice(p))}</span>
                  </div>
                  {showStatus && (
                    <div className="hidden justify-end lg:flex">
                      <StatusMark status={p.status} />
                    </div>
                  )}
                </Link>
              </SwipeRow>
            );
          })}
        </div>
      </section>
      {bulkBar}
    </>
  );
}
