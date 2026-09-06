import { Download, Plus } from "lucide-react";
import { db, requireShop } from "@/lib/data/shop";
import { ProductList } from "@/components/admin/product-list";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { FilterDisclosure } from "@/components/admin/filter-disclosure";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { ButtonLink, buttonClass } from "@/components/ui/primitives";
import { activeCount, keepKnown, readFilter, whereIn } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
import { registryBusinessType } from "@/lib/themes/business-type";
import { vocabularyFor } from "@/lib/themes/vocabulary";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
];

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const sp = await props.searchParams;
  const shop = await requireShop();
  const words = vocabularyFor(registryBusinessType(shop.businessType));

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

  // Free-text search, in the URL like the filters. Title and SKU because those
  // are the two things a merchant actually knows about a product they are
  // trying to find — nobody searches a description.
  const q = readFilter(sp, "q")[0] ?? "";
  const where = {
    deletedAt: null,
    status: whereIn(status as ("PUBLISHED" | "DRAFT")[]),
    // Several categories read as "in any of these", which is what picking two
    // of them looks like it ought to do.
    ...(category.length > 0 ? { categories: { some: { slug: { in: category } } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { sku: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const total = await (await db()).product.count({ where });
  const { skip, take } = readPaging(sp, total);

  const products = await (await db()).product.findMany({
    where,
    include: { categories: true, variants: true },
    orderBy: { createdAt: "desc" },
    skip,
    take,
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
    <div className="space-y-4">
      {/* Everything you can do to this list, in the one place every list keeps
          it: search, filters, how many rows, and the buttons that make or take
          away rows. */}
      <ActionBar>
        <ListSearch placeholder="Search products" />
        <FilterDisclosure activeCount={activeCount(filters)}>
          <FilterBar basePath="/admin/products" groups={groups} filters={filters} />
        </FilterDisclosure>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PerPageSelect basePath="/admin/products" searchParams={sp} total={total} />
          {/* A plain link, not a form: the answer is a file, and the browser
              already knows how to receive one. */}
          <a
            href="/admin/products/export"
            className={buttonClass("secondary", "sm")}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            {words.addProduct}
          </ButtonLink>
        </div>
      </ActionBar>

      <ProductList products={products} />

      <PaginationBar basePath="/admin/products" searchParams={sp} total={total} />
    </div>
  );
}
