import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductFilters } from "@/components/storefront/product-filters";
import { getProducts, getFilterOptions, getCategories, type ProductFilters as Filters } from "@/lib/data/products";
import { getStoreSettings } from "@/lib/data/settings";
import { getSiteText, text } from "@/lib/site-text";
import { guardStorefront } from "@/lib/maintenance";
import { findRedirect } from "@/lib/data/redirects";
import { toGlobalEdits, totalStock, SHOP_GRID_LG_COLS_CLASS } from "@/lib/global-edits";
import { cn } from "@/lib/utils";
import { readFilter } from "@/lib/filters";

function parseFilters(sp: Record<string, string | string[] | undefined>, category: string): Filters {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]);
  return {
    category,
    q: get("q") || undefined,
    size: readFilter(sp, "size"),
    color: readFilter(sp, "color"),
    sort: (get("sort") as Filters["sort"]) || undefined,
  };
}

export async function generateMetadata(props: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: "Collection" };
  // The name is the right title far more often than not, so the override only
  // applies when someone has actually set one.
  return {
    title: category.seoTitle?.trim() || category.name,
    description: category.seoDescription?.trim() || undefined,
  };
}

export default async function CollectionPage(props: PageProps<"/collections/[slug]">) {
  await guardStorefront();
  const { slug } = await props.params;

  const sp = await props.searchParams;

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) {
    // A collection that no longer exists may still be linked from a menu, an
    // old bookmark or a search result — send those somewhere useful instead of
    // a dead end, if a redirect has been set up for it.
    const target = await findRedirect(`/collections/${slug}`);
    if (target) redirect(target);
    notFound();
  }

  const settings = await getStoreSettings();
  const edits = toGlobalEdits(settings);
  const filters = parseFilters(sp, slug);
  filters.sort = filters.sort ?? edits.defaultShopSort;

  const [allProducts, options, siteText] = await Promise.all([
    getProducts(filters),
    getFilterOptions(),
    getSiteText(),
  ]);
  const products = allProducts.filter(
    (p) => edits.outOfStockDisplay !== "HIDE" || totalStock(p.variants) > 0
  );

  return (
    <Container className="py-12">
      {category.image && (
        <div className="relative mb-8 aspect-[3/1] w-full overflow-hidden rounded-xl bg-brand-50">
          {/* Decorative: the heading below already names the collection, so
              repeating it in alt text only makes a screen reader say it twice. */}
          <Image src={category.image} alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
      )}
      <h1 className="font-serif text-4xl font-semibold text-ink">{category.name}</h1>
      {category.description && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{category.description}</p>
      )}
      <p className="mt-2 text-ink-soft">{products.length} products</p>

      {edits.shopFilterBar && (
        <div className="mt-8">
          <ProductFilters
            options={options}
            labels={{
              searchPlaceholder: text(siteText, "filters.searchPlaceholder"),
              filtersButton: text(siteText, "filters.filtersButton"),
              sizeLabel: text(siteText, "filters.sizeLabel"),
              colorLabel: text(siteText, "filters.colorLabel"),
              clearAll: text(siteText, "filters.clearAll"),
            }}
          />
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-16 text-center text-ink-soft">{text(siteText, "collections.emptyState")}</p>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3",
            SHOP_GRID_LG_COLS_CLASS[edits.shopGridColumns] ?? "lg:grid-cols-4"
          )}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} saleBadgeLabel={text(siteText, "product.saleBadge")} edits={edits} />
          ))}
        </div>
      )}
    </Container>
  );
}
