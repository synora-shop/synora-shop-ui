import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductFilters } from "@/components/storefront/product-filters";
import { getProducts, getFilterOptions, countByKind, type ProductFilters as Filters } from "@/lib/data/products";
import { KindFilter } from "@/components/storefront/kind-filter";
import { getStoreSettings } from "@/lib/data/settings";
import { getSiteText, text } from "@/lib/site-text";
import { guardStorefront } from "@/lib/maintenance";
import { toGlobalEdits, totalStock, SHOP_GRID_LG_COLS_CLASS } from "@/lib/global-edits";
import { readFilter } from "@/lib/filters";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Shop All" };

function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]);
  return {
    q: get("q") || undefined,
    size: readFilter(sp, "size"),
    color: readFilter(sp, "color"),
    sort: (get("sort") as Filters["sort"]) || undefined,
    kind: get("kind") || undefined,
    minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
  };
}

export default async function ShopPage(props: PageProps<"/shop">) {
  await guardStorefront();
  const sp = await props.searchParams;
  const settings = await getStoreSettings();
  const edits = toGlobalEdits(settings);
  const filters = parseFilters(sp);
  filters.sort = filters.sort ?? edits.defaultShopSort;

  const [allProducts, options, siteText, kindCounts] = await Promise.all([
    getProducts(filters),
    getFilterOptions(),
    getSiteText(),
    countByKind(),
  ]);
  const products = allProducts.filter(
    (p) => edits.outOfStockDisplay !== "HIDE" || totalStock(p.variants) > 0
  );
  const saleBadgeLabel = text(siteText, "product.saleBadge");

  return (
    <Container className="py-12">
      <h1 className="font-serif text-4xl font-semibold text-ink">{text(siteText, "shop.heading")}</h1>
      <p className="mt-2 text-ink-soft">{products.length} products</p>

      <div className="mt-6">
        <KindFilter counts={kindCounts} />
      </div>

      {edits.shopFilterBar && (
        <div className="mt-4">
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
        <p className="py-16 text-center text-ink-soft">{text(siteText, "shop.emptyState")}</p>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3",
            SHOP_GRID_LG_COLS_CLASS[edits.shopGridColumns] ?? "lg:grid-cols-4"
          )}
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} saleBadgeLabel={saleBadgeLabel} edits={edits} />
          ))}
        </div>
      )}
    </Container>
  );
}
