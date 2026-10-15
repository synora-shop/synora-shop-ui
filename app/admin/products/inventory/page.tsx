import Image from "next/image";
import Link from "next/link";
import { Boxes } from "lucide-react";
import { db } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { Figures } from "@/components/admin/kit";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { SortHeading } from "@/components/admin/sort-heading";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { StockCell } from "@/components/admin/stock-cell";
import { readPaging } from "@/lib/paging";
import type { SearchParams } from "@/lib/analytics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inventory" };

/**
 * Inventory (new admin, 15 October): every size of every product, and how
 * many are left, as the design draws it. All, Running low and Sold out; search
 * by product or SKU; sort by any column; and the stock edited in its own cell.
 *
 * Only sizes whose stock is counted: a made-to-order piece or a service
 * (trackInventory off) has no number to keep, so it is not listed here.
 */
const INVENTORY_SORTS = [
  { value: "product" }, { value: "product-desc" },
  { value: "size" }, { value: "size-desc" },
  { value: "sku" }, { value: "sku-desc" },
  { value: "left" }, { value: "left-desc" },
] as const;
const GRID = "lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.2fr)_6rem] lg:items-center";

export default async function InventoryPage(props: PageProps<"/admin/products/inventory">) {
  const sp = (await props.searchParams) as SearchParams;
  const search = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = typeof sp.sort === "string" && INVENTORY_SORTS.some((s) => s.value === sp.sort) ? sp.sort : "left";

  const [variants, settings] = await Promise.all([
    (await db()).productVariant.findMany({
      where: {
        trackInventory: true,
        product: { deletedAt: null },
        ...(search
          ? { OR: [{ sku: { contains: search, mode: "insensitive" } }, { product: { title: { contains: search, mode: "insensitive" } } }] }
          : {}),
      },
      select: {
        id: true, sku: true, stock: true, option1: true, option2: true, option3: true, size: true, color: true,
        product: { select: { id: true, title: true, images: true } },
      },
      take: 5000,
    }),
    getStoreSettings(),
  ]);
  const low = settings.lowStockThreshold;

  const rows = variants.map((v) => ({
    ...v,
    sizeLabel: [v.option1 || v.size, v.option2 || v.color, v.option3].filter(Boolean).join(" · ") || "One size",
  }));
  const counts = {
    all: rows.length,
    low: rows.filter((r) => r.stock > 0 && r.stock < low).length,
    out: rows.filter((r) => r.stock <= 0).length,
    units: rows.reduce((n, r) => n + Math.max(0, r.stock), 0),
  };

  const VIEWS = [
    { key: "all", label: "All", keep: () => true },
    { key: "low", label: "Running low", keep: (r: (typeof rows)[number]) => r.stock > 0 && r.stock < low },
    { key: "out", label: "Sold out", keep: (r: (typeof rows)[number]) => r.stock <= 0 },
  ];
  const view = VIEWS.find((v) => v.key === sp.view) ?? VIEWS[0];
  const by = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
  const compare: Record<string, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    product: (a, b) => by(a.product.title, b.product.title) || by(a.sizeLabel, b.sizeLabel),
    size: (a, b) => by(a.sizeLabel, b.sizeLabel) || by(a.product.title, b.product.title),
    sku: (a, b) => by(a.sku, b.sku),
    left: (a, b) => a.stock - b.stock || by(a.product.title, b.product.title),
  };
  const key = sort.replace(/-desc$/, "");
  const shown = rows.filter(view.keep).sort((a, b) => (sort.endsWith("-desc") ? -1 : 1) * compare[key](a, b));
  const { skip, take } = readPaging(sp, shown.length);
  const page = take === undefined ? shown : shown.slice(skip, skip + take);

  const viewHref = (k: string) => {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (typeof sp.sort === "string") qs.set("sort", sp.sort);
    if (k !== "all") qs.set("view", k);
    const q = qs.toString();
    return q ? `/admin/products/inventory?${q}` : "/admin/products/inventory";
  };
  const heading = (label: string, asc: string, desc: string, align: "left" | "right" = "left") => (
    <SortHeading label={label} asc={asc} desc={desc} current={sort} basePath="/admin/products/inventory" searchParams={sp} options={INVENTORY_SORTS} align={align} />
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory" description="Every size of every product, and how many are left." />

      {counts.all > 0 && (
        <Figures
          items={[
            { label: "Pieces in stock", value: counts.units.toLocaleString("en-PK") },
            { label: "Sizes counted", value: counts.all.toLocaleString("en-PK") },
            { label: `Running low (under ${low})`, value: String(counts.low) },
            { label: "Sold out", value: String(counts.out), down: counts.out > 0 },
          ]}
        />
      )}

      <ActionBar>
        <nav aria-label="Views" className="flex gap-1 overflow-x-auto">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={viewHref(v.key)}
              aria-current={v.key === view.key ? "true" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold ${v.key === view.key ? "bg-[#0a0a0a] text-white" : "text-[#0a0a0a]/55 hover:bg-[#0a0a0a]/[0.05] hover:text-[#0a0a0a]"}`}
            >
              {v.label}
              {v.key !== "all" && <span className="ml-1.5 tabular-nums opacity-60">{v.key === "low" ? counts.low : counts.out}</span>}
            </Link>
          ))}
        </nav>
        <ListSearch placeholder="Search by product or SKU" />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PerPageSelect basePath="/admin/products/inventory" searchParams={sp} total={shown.length} />
        </div>
      </ActionBar>

      {page.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title={search ? `Nothing matches "${search}"` : view.key === "out" ? "Nothing is sold out" : view.key === "low" ? "Nothing is running low" : "No stock to count yet"}
          description={search ? "Try a product name or part of a SKU." : view.key === "all" ? "Sizes appear here once a product counts its stock." : "Every size has enough for now."}
        />
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
          <div role="row" className={`hidden gap-4 bg-[#0a0a0a] px-4 py-1.5 lg:grid ${GRID}`}>
            {heading("Product", "product", "product-desc")}
            {heading("Size", "size", "size-desc")}
            {heading("SKU", "sku", "sku-desc")}
            {heading("Available", "left", "left-desc", "right")}
          </div>
          <div className="divide-y divide-[#0a0a0a]/[0.06]">
            {page.map((r) => (
              <div key={r.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 ${GRID}`}>
                <Link href={`/admin/products/${r.product.id}`} className="flex min-w-0 basis-full items-center gap-3 hover:underline lg:basis-auto">
                  {r.product.images[0] ? (
                    <Image src={r.product.images[0]} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                  ) : (
                    <span className="h-8 w-8 shrink-0 rounded-md bg-[#f0f0f0]" />
                  )}
                  <span className="truncate text-[14px] font-medium">{r.product.title}</span>
                </Link>
                <span className="text-[13.5px]">{r.sizeLabel}</span>
                <span className="min-w-0 truncate font-mono text-[12.5px] text-[#0a0a0a]/55">{r.sku}</span>
                <span className="ml-auto lg:text-right">
                  <StockCell id={r.id} stock={r.stock} low={low} label={`${r.product.title} ${r.sizeLabel}`} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      <PaginationBar basePath="/admin/products/inventory" searchParams={sp} total={shown.length} />
    </div>
  );
}
