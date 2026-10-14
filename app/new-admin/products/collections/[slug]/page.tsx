import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GripVertical, Plus, X } from "lucide-react";
import { Card, Pill, pkr } from "@/components/new-admin/ui";
import { Field } from "@/components/new-admin/bits";
import { PRODUCTS, slugOf } from "@/lib/new-admin/sample";

/**
 * One collection (preview), as the real one works: its name and words, its
 * picture, the products in it in the order shoppers see them, and how it
 * reads in Google.
 */
const NAMES = ["Summer Lawn", "Eid Edit", "Pret", "Winter"];
export function generateStaticParams() {
  return NAMES.map((n) => ({ slug: slugOf(n) }));
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = NAMES.find((n) => slugOf(n) === slug);
  if (!name) notFound();
  const items = PRODUCTS.filter((p) => p.collection === name);
  return (
    <>
      <Link href="/new-admin/products/collections" className="-mb-2 inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-[#0a0a0a]/55 hover:text-[#0a0a0a]"><ArrowLeft className="h-4 w-4" /> Collections</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">{name}</h1>
        <span className="flex gap-2"><span className="rounded-[10px] px-3.5 py-2 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12">View in store</span><span className="rounded-[10px] bg-[#0a0a0a] px-3.5 py-2 text-[13.5px] font-semibold text-white">Save</span></span>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-5">
          <Card pad={false}>
            <Field label="Name" value={name} />
            <Field label="Description" area value={`The ${name} collection: three-piece suits and separates, cut and stitched in Lahore.`} />
          </Card>
          <Card title={`Products · ${items.length}`} action={<span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#4b4bea]"><Plus className="h-4 w-4" /> Add products</span>} pad={false}>
            <ul className="mt-2 divide-y divide-[#0a0a0a]/[0.06]">
              {items.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 px-5 py-3">
                  <GripVertical className="h-4 w-4 text-[#0a0a0a]/30" />
                  <span className="w-5 text-[12.5px] text-[#0a0a0a]/40">{i + 1}</span>
                  <Image src={p.image} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{p.name}</span>
                  {p.status === "Draft" ? <Pill tone="off">Draft</Pill> : null}
                  <span className="text-[13.5px] font-semibold tabular-nums">{pkr(p.price)}</span>
                  <X className="h-4 w-4 text-[#0a0a0a]/35" />
                </li>
              ))}
            </ul>
            <p className="px-5 py-3 text-[12.5px] text-[#0a0a0a]/50">Drag to set the order shoppers see. Or sort by: newest, price, best selling.</p>
          </Card>
          <Card title="In Google">
            <div className="rounded-xl bg-[#fafafa] p-4">
              <p className="text-[12.5px] text-[#0a0a0a]/55">zohralawn.pk › collections › {slug}</p>
              <p className="mt-0.5 text-[17px] text-[#1a0dab]">{name} · Zohra Lawn</p>
              <p className="text-[13px] text-[#0a0a0a]/65">The {name} collection: three-piece suits and separates, cut and stitched in Lahore.</p>
            </div>
            <p className="mt-2 text-[12.5px] font-semibold text-[#4b4bea]">Change how it reads</p>
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card title="Picture">
            {items[0] && <Image src={items[0].image} alt="" width={320} height={400} className="aspect-[4/5] w-full rounded-xl object-cover" />}
            <p className="mt-2 text-[12.5px] text-[#0a0a0a]/50">Shown on the collection&apos;s banner and in menus.</p>
          </Card>
          <Card title="Shown in">
            <div className="flex flex-col gap-1.5 text-[13.5px]"><span>Main menu › Shop</span><span>Home page · Featured collection</span></div>
          </Card>
        </div>
      </div>
    </>
  );
}
