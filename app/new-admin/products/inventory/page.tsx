import Image from "next/image";
import { ListBar, PageHeader } from "@/components/new-admin/ui";
import { DataTable } from "@/components/new-admin/sort";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Inventory" };

/** Every size of every product, with how many are left: the stock room. */
const SIZES = ["S", "M", "L", "XL"];

export default function InventoryPage() {
  const rows = PRODUCTS.filter((p) => p.stock !== null).flatMap((p) =>
    SIZES.slice(0, p.variants).map((s, i) => ({ p, size: s, sku: `${p.slug.toUpperCase().replace("-", "")}-${s}`, left: Math.max(0, Math.round(((p.stock ?? 0) / p.variants) * [1.2, 1, 0.9, 0.7][i])) }))
  );
  return (
    <>
      <PageHeader icon="products" tone="mint" title="Inventory" sub="Every size of every product, and how many are left." />
      <DataTable
        toolbar={<div className="-m-3"><ListBar views={["All", "Running low", "Sold out"]} placeholder="Search by product or SKU" /></div>}
        cols={[
          { key: "product", label: "Product" },
          { key: "size", label: "Size" },
          { key: "sku", label: "SKU" },
          { key: "left", label: "Available", align: "right", numeric: true },
        ]}
        rows={rows.slice(0, 18).map(({ p, size, sku, left }) => ({
          id: sku,
          by: { product: p.name, size: SIZES.indexOf(size), sku, left },
          cells: {
            product: <span className="flex items-center gap-3"><Image src={p.image} alt="" width={32} height={32} className="h-8 w-8 rounded-md object-cover" /><span className="truncate">{p.name}</span></span>,
            size,
            sku: <span className="font-mono text-[12.5px] text-[#0a0a0a]/55">{sku}</span>,
            left: <span className={`inline-block min-w-[3.5rem] rounded-lg px-2.5 py-1 text-center font-semibold tabular-nums ${left === 0 ? "bg-[#ffe9e2] text-[#a3330c]" : left < 4 ? "bg-[#fff1d6] text-[#7a4b00]" : "bg-[#f0f0f0]"}`}>{left}</span>,
          },
        }))}
      />
    </>
  );
}
