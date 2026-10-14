import { readdirSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { Box, Field, Row, Toggle } from "@/components/new-admin/bits";
import { Button, Card, Pill, pkr, td, th } from "@/components/new-admin/ui";
import { PRODUCTS } from "@/lib/new-admin/sample";

/**
 * A product (preview), laid out as Shopify lays it out: the product on the
 * left (words, photos, price, sizes and stock, how search shows it), and
 * about the product on the right (status, where it sells, how it is filed,
 * and the store's own custom fields).
 */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) notFound();
  let photos: string[] = [];
  try {
    photos = readdirSync(join(process.cwd(), "public/products", slug)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).slice(0, 5).map((f) => `/products/${slug}/${f}`);
  } catch {
    photos = [p.image];
  }
  const sizes = ["S", "M", "L", "XL"].slice(0, p.variants);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/new-admin/products" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0a0a0a]/55 hover:text-[#0a0a0a]">
            <ArrowLeft className="h-4 w-4" /> Products
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{p.name}</h1>
            {p.status === "Active" ? <Pill tone="good">Active</Pill> : <Pill tone="off">Draft</Pill>}
          </div>
        </div>
        <div className="flex gap-2"><Button>Preview</Button><Button primary>Save</Button></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Box>
            <Field label="Title" value={p.name} />
            <Field label="Description" area value="Three-piece embroidered lawn with a printed chiffon dupatta and dyed cotton trousers. Unstitched: 3 m shirt, 2.5 m dupatta, 2.5 m trousers. Machine embroidery on the front and sleeves." />
          </Box>

          <Card title="Photos" action={<span className="text-[12.5px] font-semibold text-[#0a0a0a]/50">{photos.length} of 10</span>}>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {photos.map((src, i) => (
                <Image key={src} src={src} alt="" width={200} height={260} className={`w-full rounded-xl bg-[#f0f0f0] object-cover ${i === 0 ? "col-span-2 row-span-2 aspect-[3/4]" : "aspect-square"}`} />
              ))}
              <span className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[#0a0a0a]/15 text-[#0a0a0a]/40"><ImagePlus className="h-5 w-5" /></span>
            </div>
          </Card>

          <Box title="Price">
            <div className="grid sm:grid-cols-3">
              <Field label="Price" value={pkr(p.price)} />
              <Field label="Compare-at price" value={pkr(Math.round(p.price * 1.2 / 100) * 100)} hint="Shown struck through" />
              <Field label="Cost per item" value={pkr(Math.round(p.price * 0.45 / 50) * 50)} hint={`Margin ${55}%`} />
            </div>
          </Box>

          <Card title="Sizes and stock" pad={false}>
            <table className="w-full">
              <thead className="bg-[#fafafa]"><tr><th className={th}>Size</th><th className={th}>SKU</th><th className={`${th} text-right`}>Price</th><th className={`${th} text-right`}>In stock</th></tr></thead>
              <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
                {sizes.map((s, i) => {
                  const left = p.stock === null ? null : Math.max(0, Math.round((p.stock / p.variants) * [1.2, 1, 0.9, 0.7][i]));
                  return (
                    <tr key={s}>
                      <td className={`${td} font-semibold`}>{s}</td>
                      <td className={`${td} font-mono text-[12.5px] text-[#0a0a0a]/55`}>{p.slug.toUpperCase().replace("-", "")}-{s}</td>
                      <td className={`${td} text-right tabular-nums`}>{pkr(p.price)}</td>
                      <td className={`${td} text-right`}>
                        <span className={`inline-block min-w-[3rem] rounded-lg px-2.5 py-1 text-center font-semibold tabular-nums ring-1 ${left === 0 ? "text-[#a3330c] ring-[#a3330c]/25" : left !== null && left < 4 ? "text-[#b45309] ring-[#b45309]/25" : "ring-[#0a0a0a]/12"}`}>{left ?? "∞"}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          <Card title="How search shows it">
            <p className="text-[12.5px] text-[#0a0a0a]/55">zohralawn.pk › products › {p.slug}</p>
            <p className="mt-0.5 text-[17px] text-[#1a0dab]">{p.name} · Zohra Lawn</p>
            <p className="mt-1 text-[13.5px] text-[#0a0a0a]/65">{pkr(p.price)} · Three-piece embroidered lawn with a printed chiffon dupatta. Cash on delivery across Pakistan.</p>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Box title="Status">
            <Row label={p.status} value={p.status === "Active" ? "Customers can buy it" : "Only you can see it"} right={<Toggle on={p.status === "Active"} label="Active" />} />
          </Box>
          <Box title="Sells on">
            <Row label="Online store" value="zohralawn.pk" right={<Toggle on label="Online store" />} />
          </Box>
          <Box title="Filed under">
            <Field label="Collection" value={p.collection} />
            <Field label="Type" value="Unstitched 3-piece" />
            <Field label="Tags" value="lawn, embroidered, summer" />
          </Box>
          <Box title="Custom fields">
            <Field label="Fabric" value="Lawn, 80 count" />
            <Field label="Care" value="Hand wash cold, dry in shade" />
          </Box>
        </div>
      </div>
    </>
  );
}
