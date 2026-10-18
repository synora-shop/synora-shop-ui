import Image from "next/image";
import { notFound } from "next/navigation";
import { GripVertical, Plus, X } from "lucide-react";
import { Btn, Field, Page, Panel, Status, Thumb, link, pkr } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { A } from "@/components/next-admin/nav";
import { PRODUCTS, slugOf } from "@/lib/new-admin/sample";

/** One collection (third design): its words, its products in the order shoppers see them, and how it reads in Google. */
const NAMES = ["Summer Lawn", "Eid Edit", "Pret", "Winter"];
export function generateStaticParams() {
  return NAMES.map((n) => ({ slug: slugOf(n) }));
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = NAMES.find((n) => slugOf(n) === slug);
  if (!name) notFound();
  const items = PRODUCTS.filter((p) => p.collection === name);
  const words = `The ${name} collection: three-piece suits and separates, cut and stitched in Lahore.`;
  return (
    <Page title={name} crumbs={[{ label: "Products", href: `${A}/products` }, { label: "Collections", href: `${A}/products/collections` }]} actions={<><Btn href="#">View in store</Btn><Act kind="primary" msg={`${name} saved`}>Save</Act></>}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel>
            <div className="flex flex-col gap-3">
              <Field label="Name" value={name} />
              <Field label="Description" area value={words} />
            </div>
          </Panel>
          <Panel title={`Products · ${items.length}`} action={<button type="button" className={`inline-flex items-center gap-1 ${link}`}><Plus className="h-3.5 w-3.5" /> Add products</button>} flush>
            <ul className="divide-y divide-[#f1f1f1]">
              {items.map((p, i) => (
                <li key={p.slug} className="flex h-10 items-center gap-2.5 px-3">
                  <GripVertical className="h-3.5 w-3.5 cursor-grab text-[#a3a3a3]" />
                  <span className="w-4 text-[12px] tabular-nums text-[#a3a3a3]">{i + 1}</span>
                  <Thumb src={p.image} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span>
                  {p.status === "Draft" && <Status tone="off">Draft</Status>}
                  <span className="w-20 text-right text-[13px] font-semibold tabular-nums">{pkr(p.price)}</span>
                  <button type="button" aria-label={`Take ${p.name} out`}><X className="h-3.5 w-3.5 text-[#a3a3a3] hover:text-[#0a0a0a]" /></button>
                </li>
              ))}
            </ul>
            <p className="border-t border-[#f1f1f1] px-3 py-2 text-[12px] text-[#737373]">Drag to set the order shoppers see. Or sort by newest, price or best selling.</p>
          </Panel>
          <Panel title="In Google" action={<button type="button" className={link}>Change how it reads</button>}>
            <p className="text-[12px] text-[#737373]">zohralawn.pk › collections › {slug}</p>
            <p className="mt-0.5 text-[15px] text-[#1a0dab]">{name} · Zohra Lawn</p>
            <p className="text-[12.5px] text-[#555555]">{words}</p>
          </Panel>
        </div>
        <div className="flex flex-col gap-3">
          <Panel title="Picture">
            {items[0] && <Image src={items[0].image} alt="" width={320} height={400} className="aspect-[4/5] w-full rounded-[10px] object-cover" />}
            <p className="mt-2 text-[12px] text-[#737373]">Shown on the collection&apos;s banner and in menus.</p>
          </Panel>
          <Panel title="Shown in">
            <ul className="flex flex-col gap-1 text-[13px]"><li>Main menu › Shop</li><li>Home page · Featured collection</li></ul>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
