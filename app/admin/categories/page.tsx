import { db } from "@/lib/data/shop";
import { PageHeader } from "@/components/ui/primitives";
import { CategoryList } from "@/components/admin/category-list";
import { AddCategoryForm } from "@/components/admin/add-category-form";

export const dynamic = "force-dynamic";

/** Collections, as the design draws them (new admin, 15 October). */
export default async function AdminCategoriesPage() {
  const categories = await (await db()).category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true } },
      // Two pictures for a card whose collection has none of its own.
      products: { where: { deletedAt: null, NOT: { images: { isEmpty: true } } }, select: { images: true }, take: 2 },
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collections"
        description="Groups of products your customers browse by. A name is changed in place and every menu link follows."
        actions={<AddCategoryForm />}
      />
      <CategoryList
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          productCount: c._count.products,
          previews: c.products.map((p) => p.images[0]).filter(Boolean),
          details: {
            image: c.image ?? "",
            description: c.description ?? "",
            seoTitle: c.seoTitle ?? "",
            seoDescription: c.seoDescription ?? "",
          },
        }))}
      />
    </div>
  );
}
