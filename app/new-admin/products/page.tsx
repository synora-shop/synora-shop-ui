import Image from "next/image";
import { Download, Plus, Upload } from "lucide-react";
import { Button, ListBar, PageHeader, Pill, StatStrip, pkr, td, th } from "@/components/new-admin/ui";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        icon="products"
        title="Products"
        sub="What you sell, with its sizes, stock and price."
        actions={<><Button><Upload className="h-4 w-4" /> Import</Button><Button><Download className="h-4 w-4" /> Export</Button><Button primary><Plus className="h-4 w-4" /> Add product</Button></>}
      />
      <StatStrip stats={[{ label: "Active", value: "10" }, { label: "Drafts", value: "2" }, { label: "Running low", value: "3", down: true, delta: "Under 10 left" }, { label: "Sold out", value: "1", down: true }]} />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">
        <ListBar views={["All", "Active", "Drafts", "Running low", "Sold out"]} placeholder="Search products" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-[#fafafc]">
              <tr><th className={th}>Product</th><th className={th}>Status</th><th className={th}>Stock</th><th className={th}>Collection</th><th className={`${th} text-right`}>Price</th></tr>
            </thead>
            <tbody className="divide-y divide-[#0d0d50]/[0.06]">
              {PRODUCTS.map((p) => (
                <tr key={p.slug} className="hover:bg-[#fafafc]">
                  <td className={td}>
                    <span className="flex items-center gap-3">
                      <Image src={p.image} alt="" width={44} height={44} className="h-11 w-11 rounded-lg bg-[#f0f0f6] object-cover" />
                      <span className="font-medium">{p.name}</span>
                    </span>
                  </td>
                  <td className={td}>{p.status === "Active" ? <Pill tone="good">Active</Pill> : <Pill tone="off">Draft</Pill>}</td>
                  <td className={td}>
                    {p.stock === null ? (
                      <span className="text-[#0d0d50]/45">Not tracked</span>
                    ) : (
                      <span>
                        <b className={`font-semibold ${p.stock === 0 ? "text-[#a3330c]" : p.stock < 10 ? "text-[#b45309]" : ""}`}>{p.stock === 0 ? "Sold out" : `${p.stock} in stock`}</b>
                        <span className="text-[#0d0d50]/50"> · {p.variants} sizes</span>
                      </span>
                    )}
                  </td>
                  <td className={`${td} text-[#0d0d50]/70`}>{p.collection}</td>
                  <td className={`${td} text-right font-semibold tabular-nums`}>{pkr(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
