import { notFound } from "next/navigation";
import { PageCrumb } from "@/components/admin/page-crumb";
import { db } from "@/lib/data/shop";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  const { id } = await props.params;
  const [product, categories] = await Promise.all([
    (await db()).product.findUnique({ where: { id }, include: { variants: true, categories: true } }),
    (await db()).category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product || product.deletedAt) notFound();

  return (
    <div>
      <PageCrumb label={product.title} />
      <div>
        <ProductForm categories={categories} product={product} />
      </div>
    </div>
  );
}
