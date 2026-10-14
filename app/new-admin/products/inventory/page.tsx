import Image from "next/image";
import { ListBar, PageHeader, td, th } from "@/components/new-admin/ui";
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
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        <ListBar views={["All", "Running low", "Sold out"]} placeholder="Search by product or SKU" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-[#fafafa]"><tr><th className={th}>Product</th><th className={th}>Size</th><th className={th}>SKU</th><th className={`${th} text-right`}>Available</th></tr></thead>
            <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
              {rows.slice(0, 18).map(({ p, size, sku, left }) => (
                <tr key={sku}>
                  <td className={td}><span className="flex items-center gap-3"><Image src={p.image} alt="" width={32} height={32} className="h-8 w-8 rounded-md object-cover" /><span className="truncate">{p.name}</span></span></td>
                  <td className={td}>{size}</td>
                  <td className={`${td} font-mono text-[12.5px] text-[#0a0a0a]/55`}>{sku}</td>
                  <td className={`${td} text-right`}>
                    <span className={`inline-block min-w-[3.5rem] rounded-lg px-2.5 py-1 text-center font-semibold tabular-nums ring-1 ${left === 0 ? "text-[#a3330c] ring-[#a3330c]/25" : left < 4 ? "text-[#b45309] ring-[#b45309]/25" : "ring-[#0a0a0a]/12"}`}>{left}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
