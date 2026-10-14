import Image from "next/image";
import { Plus } from "lucide-react";
import { Button, PageHeader } from "@/components/new-admin/ui";
import { PRODUCTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Collections" };

export default function CollectionsPage() {
  const groups = ["Summer Lawn", "Eid Edit", "Pret", "Winter"].map((name) => ({ name, items: PRODUCTS.filter((p) => p.collection === name) }));
  return (
    <>
      <PageHeader icon="products" title="Collections" sub="Groups of products your customers browse by." actions={<Button primary><Plus className="h-4 w-4" /> Create collection</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <article key={g.name} className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">
            <div className="grid aspect-[4/3] grid-cols-2 gap-0.5 bg-[#f0f0f6]">
              {g.items.slice(0, 2).map((p) => (
                <Image key={p.slug} src={p.image} alt="" width={240} height={320} className="h-full w-full object-cover" />
              ))}
            </div>
            <div className="p-4">
              <p className="text-[15px] font-semibold">{g.name}</p>
              <p className="text-[13px] text-[#0d0d50]/55">{g.items.length} products</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
