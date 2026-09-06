import { db } from "@/lib/data/shop";
import { PageCrumb } from "@/components/admin/page-crumb";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await (await db()).category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      {/* The chrome names the screen; this names the record being made. */}
      <PageCrumb label="New" />
      <div>
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
