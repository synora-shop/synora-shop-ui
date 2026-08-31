import { db } from "@/lib/data/shop";
import { CategoryList } from "@/components/admin/category-list";
import { AddCategoryForm } from "@/components/admin/add-category-form";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await (await db()).category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Categories</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Click a name to rename it, or a picture to edit the collection, products stay
        linked and every menu link updates automatically, only the label changes. Creating a
        category also creates a matching page you can add to the header/footer from Menus. A
        category can only be deleted once no products are assigned to it.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <CategoryList
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            productCount: c._count.products,
            details: {
              image: c.image ?? "",
              description: c.description ?? "",
              seoTitle: c.seoTitle ?? "",
              seoDescription: c.seoDescription ?? "",
            },
          }))}
        />

        <AddCategoryForm />
      </div>
    </div>
  );
}
