import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Btn, Page } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";
import { PRODUCTS, slugOf } from "@/lib/new-admin/sample";

export const metadata = { title: "Collections" };

export default function CollectionsPage() {
  const groups = ["Summer Lawn", "Eid Edit", "Pret", "Winter"].map((name) => ({ name, items: PRODUCTS.filter((p) => p.collection === name) }));
  return (
    <Page title="Collections" crumbs={[{ label: "Products", href: `${A}/products` }]} sub="Groups of products your customers browse by." actions={<Btn kind="primary"><Plus /> Create collection</Btn>}>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {groups.map((g) => (
          <Link key={g.name} href={`${A}/products/collections/${slugOf(g.name)}`} className="flex items-center gap-3 rounded-[8px] border border-[#e4e4e7] bg-white p-2.5 hover:border-[#a1a1aa]">
            <span className="flex shrink-0 -space-x-3">
              {g.items.slice(0, 3).map((p) => <Image key={p.slug} src={p.image} alt="" width={80} height={80} className="h-10 w-10 rounded-[6px] bg-[#f4f4f5] object-cover ring-2 ring-white" />)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold">{g.name}</span>
              <span className="block text-[12px] text-[#71717a]">{g.items.length} products · {g.items.filter((p) => p.status === "Draft").length} draft</span>
            </span>
          </Link>
        ))}
      </div>
    </Page>
  );
}
