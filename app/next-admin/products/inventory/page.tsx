import { Page, Status, T, Thumb } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { Table } from "@/components/next-admin/table";
import { A } from "@/components/next-admin/nav";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Inventory" };

/** Every size of every product, with how many are left: the stock room. */
const SIZES = ["S", "M", "L", "XL"];

export default function InventoryPage() {
  const rows = PRODUCTS.filter((p) => p.stock !== null).flatMap((p) =>
    SIZES.slice(0, p.variants).map((s, i) => ({ p, size: s, sku: `${p.slug.toUpperCase().replace("-", "")}-${s}`, left: Math.max(0, Math.round(((p.stock ?? 0) / p.variants) * [1.2, 1, 0.9, 0.7][i])) }))
  );
  return (
    <Page title="Inventory" crumbs={[{ label: "Products", href: `${A}/products` }]} sub="Every size of every product, and how many are left." actions={<Act msg="Stock counts saved">Save counts</Act>}>
      <Table
        views={["All", "Running low", "Sold out"]}
        search="Search by product or SKU"
        cols={[
          { key: "product", label: "Product" },
          { key: "size", label: "Size" },
          { key: "sku", label: "SKU" },
          { key: "state", label: "" , sort: false },
          { key: "left", label: "Available", right: true },
        ]}
        rows={rows.map(({ p, size, sku, left }) => ({
          id: sku,
          views: left === 0 ? ["Sold out"] : left < 4 ? ["Running low"] : [],
          by: { product: p.name, size: SIZES.indexOf(size), sku, left },
          text: `${p.name} ${sku}`,
          cells: {
            product: <span className="flex items-center gap-2.5"><Thumb src={p.image} size={24} /><span className="truncate">{p.name}</span></span>,
            size,
            sku: <span className="font-mono text-[12px] text-[#737373]">{sku}</span>,
            state: left === 0 ? <Status tone="bad">Sold out</Status> : left < 4 ? <Status tone="wait">Low</Status> : null,
            left: <input defaultValue={left} aria-label={`Available, ${p.name} ${size}`} inputMode="numeric" className={`h-7 w-16 rounded-[10px] px-2 text-right text-[13px] font-semibold tabular-nums outline-none ring-1 ring-inset focus:ring-[#6666ff] ${left === 0 ? "text-[#b91c1c] ring-[#fecaca]" : left < 4 ? "text-[#b45309] ring-[#fde68a]" : "ring-[#ebebeb]"}`} />,
          },
        }))}
        minWidth={620}
        foot={<span className={T.muted}>Type a new count and save. Each change is written to the product&apos;s history.</span>}
      />
    </Page>
  );
}
