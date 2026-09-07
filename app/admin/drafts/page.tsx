import { FilePen, Plus } from "lucide-react";
import { db } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { toGlobalEdits } from "@/lib/global-edits";
import { ProductList } from "@/components/admin/product-list";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { FilterDisclosure } from "@/components/admin/filter-disclosure";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";
import { activeCount, keepKnown, readFilter } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
import { PRODUCT_SORTS, readSort, sortHref } from "@/lib/sorting";
import { SortMenu } from "@/components/admin/sort-menu";
import { ViewToggle, readView } from "@/components/admin/view-toggle";

export const dynamic = "force-dynamic";

/**
 * Everything started and not yet put out.
 *
 * The same list as Products, standing still on one question: what have I begun
 * and not finished? It was answerable before — Products has a status filter —
 * but only by someone who knew the filter was there, and a merchant with
 * fourteen half-written products does not need a filter, they need a screen
 * that is about them.
 *
 * Every control is the catalogue's own, deliberately: the search, the sort,
 * the two views, the paging and the tick-and-publish bar are the same
 * components, so this is a place to stand rather than a second thing to learn.
 * Publishing from here is the reason it exists — ticking four drafts and
 * pressing Publish is the shape of the job.
 */
export default async function AdminDraftsPage(props: PageProps<"/admin/drafts">) {
  const sp = await props.searchParams;

  const categories = await (await db()).category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  const category = keepKnown(
    readFilter(sp, "category"),
    categories.map((c) => c.slug)
  );
  const filters = { category };

  const q = readFilter(sp, "q")[0] ?? "";
  const where = {
    deletedAt: null,
    // The one thing this screen is. Not a filter a merchant can drop, because
    // dropping it would leave them on the catalogue wearing the wrong name.
    status: "DRAFT" as const,
    ...(category.length > 0 ? { categories: { some: { slug: { in: category } } } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { variants: { some: { sku: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };

  const total = await (await db()).product.count({ where });
  const { skip, take } = readPaging(sp, total);
  const sort = readSort(sp, PRODUCT_SORTS);
  const view = readView(sp);
  const globals = toGlobalEdits(await getStoreSettings());

  const products = await (await db()).product.findMany({
    where,
    include: { categories: true, variants: true },
    orderBy: sort.orderBy as { createdAt: "desc" },
    skip,
    take,
  });

  const groups: FilterGroup[] = [
    {
      key: "category",
      label: "Category",
      options: categories.map((c) => ({ value: c.slug, label: c.name })),
    },
  ];

  // Nothing in drafts is good news, and reads as such — not as a list that
  // failed to load.
  if (total === 0 && q === "" && activeCount(filters) === 0) {
    return (
      <EmptyState
        icon={FilePen}
        title="Nothing waiting"
        description="Every product you have started is published. Anything you save as a draft appears here until you put it out."
        action={
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Add a product
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-sm text-ink-soft">
        {total === 1 ? "One product is" : `${total} products are`} started and not yet published.
        Tick any of them and press Publish to put them out together.
      </p>

      <ActionBar>
        <ListSearch placeholder="Search drafts" />
        <FilterDisclosure activeCount={activeCount(filters)}>
          <FilterBar basePath="/admin/drafts" groups={groups} filters={filters} />
        </FilterDisclosure>
        <SortMenu
          current={sort.value}
          options={PRODUCT_SORTS.map((o) => ({
            value: o.value,
            label: o.label,
            href: sortHref("/admin/drafts", sp, o.value, PRODUCT_SORTS),
          }))}
        />
        <ViewToggle basePath="/admin/drafts" searchParams={sp} current={view} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PerPageSelect basePath="/admin/drafts" searchParams={sp} total={total} />
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Add product
          </ButtonLink>
        </div>
      </ActionBar>

      <ProductList
        products={products}
        view={view}
        filtered={q.length > 0 || activeCount(filters) > 0}
        lowStock={globals.lowStockThreshold}
        // Every row here is a draft. A column repeating that is a column
        // saying nothing, in the width of one that could say something.
        showStatus={false}
      />

      <PaginationBar basePath="/admin/drafts" searchParams={sp} total={total} />
    </div>
  );
}
