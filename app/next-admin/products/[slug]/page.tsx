import { readdirSync } from "node:fs";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/next-admin/product-editor";
import { PRODUCTS } from "@/lib/new-admin/sample";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: PRODUCTS.find((x) => x.slug === slug)?.name ?? "Product" };
}

/** A product (third design): the editor, with its photos read from the repository. */
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PRODUCTS.find((x) => x.slug === slug);
  if (!p) notFound();
  let photos: string[];
  try {
    photos = readdirSync(join(process.cwd(), "public/products", slug)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).slice(0, 7).map((f) => `/products/${slug}/${f}`);
  } catch {
    photos = [p.image];
  }
  return <ProductEditor p={p} photos={photos} />;
}
