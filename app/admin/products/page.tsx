import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/data/shop";
import { ProductList } from "@/components/admin/product-list";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { keepKnown, readFilter, whereIn } from "@/lib/filters";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
];

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const sp = await props.searchParams;

  // Live-fetched every render, so a deleted category simply stops appearing
  // here — no stale filter option left dangling.
  const categories = await (await db()).category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  // Unknown values are dropped rather than handed to the query: a bookmarked
  // URL naming a deleted category should show everything, not nothing.
  const status = keepKnown(
    readFilter(sp, "status"),
    STATUSES.map((s) => s.value)
  );
  const category = keepKnown(
    readFilter(sp, "category"),
    categories.map((c) => c.slug)
  );
  const filters = { status, category };

  const products = await (await db()).product.findMany({
    where: {
      deletedAt: null,
      status: whereIn(status as ("PUBLISHED" | "DRAFT")[]),
      // Several categories read as "in any of these", which is what picking two
      // of them looks like it ought to do.
      ...(category.length > 0 ? { categories: { some: { slug: { in: category } } } } : {}),
    },
    include: { categories: true, variants: true },
    orderBy: { createdAt: "desc" },
  });

  const groups: FilterGroup[] = [
    { key: "status", label: "Status", options: STATUSES },
    {
      key: "category",
      label: "Category",
      options: categories.map((c) => ({ value: c.slug, label: c.name })),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-1.5 rounded-full bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <FilterBar basePath="/admin/products" groups={groups} filters={filters} />

      <ProductList products={products} />
    </div>
  );
}
