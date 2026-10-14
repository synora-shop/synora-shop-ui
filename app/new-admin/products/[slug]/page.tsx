import { readdirSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductEditor } from "@/components/new-admin/product-editor";
import { PRODUCTS } from "@/lib/new-admin/sample";

/** A product (preview): the editor, with its photos read from the repository. */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) notFound();
  let photos: string[];
  try {
    photos = readdirSync(join(process.cwd(), "public/products", slug)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).slice(0, 5).map((f) => `/products/${slug}/${f}`);
  } catch {
    photos = [p.image];
  }
  return (
    <>
      <Link href="/new-admin/products" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0a0a0a]/55 hover:text-[#0a0a0a]">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <ProductEditor p={p} photos={photos} />
    </>
  );
}
