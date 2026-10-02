import type { Prisma } from "@/lib/generated/prisma/client";
import { db, currentShopId } from "@/lib/data/shop";
import { cachedForShop } from "@/lib/data/cached";

// Re-exported so existing server-side callers of these don't need to change their import
// path — see lib/product-pricing.ts for why they live in their own Prisma-free file.
export { effectivePrice, unitProfit, profitMargin } from "@/lib/product-pricing";
import { effectivePrice } from "@/lib/product-pricing";
import { PRODUCT_KINDS } from "@/lib/product-kind";

export type ProductFilters = {
  category?: string; // category slug
  q?: string; // search query
  size?: string[];
  color?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price-asc" | "price-desc" | "featured";
  /** "NORMAL" | "BULK" | "CUSTOM" — how the product is sold. */
  kind?: string;
};

/** What a product card renders, and nothing else. */
export const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  images: true,
  basePrice: true,
  salePrice: true,
  createdAt: true,
  kind: true,
  bulkPricing: true,
  bulkPriceMin: true,
  bulkPriceMax: true,
  bulkTiers: true,
  variants: {
    // A card shows a price, whether the thing is in stock, and the colours it
    // comes in. It was handed whole variant rows — every option, SKU, barcode,
    // weight, image URL and the CSV passthrough blob — for every product on
    // the page, all of it serialised into the payload the browser downloads.
    select: {
      id: true,
      size: true,
      color: true,
      stock: true,
      priceOverride: true,
      trackInventory: true,
      continueSellingWhenOutOfStock: true,
    },
  },
  // `categories` used to be included here. Neither the shop page nor the
  // collection page reads it — the card does not show a category — so it was
  // a join per product for nothing.
} satisfies Prisma.ProductSelect;

export type ProductListing = {
  products: Prisma.ProductGetPayload<{ select: typeof PRODUCT_CARD_SELECT }>[];
  /** Matching the filters, before paging — what the count on the page says. */
  total: number;
};

/** How many products a storefront page shows. */
export const PRODUCTS_PER_PAGE = 24;

export type ListingOptions = {
  /** 1-based. */
  page?: number;
  perPage?: number;
  /** The merchant's "hide out of stock" setting, applied in SQL. */
  hideOutOfStock?: boolean;
};

/**
 * One page of the storefront listing.
 *
 * Every filter and both sorts are now the database's job. They used to be
 * partly the page's: the whole catalogue was read with every variant and
 * category attached, then price-filtered, price-sorted and out-of-stock
 * filtered in JavaScript. That is unbounded work per request, and it is the
 * reason this could not be paginated — you cannot take the first 24 of a list
 * you have not finished sorting.
 */
export async function getProducts(
  filters: ProductFilters = {},
  options: ListingOptions = {}
): Promise<ProductListing> {
  const where: Prisma.ProductWhereInput = { isActive: true, status: "PUBLISHED", deletedAt: null };

  if (filters.category) {
    where.categories = { some: { slug: filters.category } };
  }
  if (filters.q) {
    where.title = { contains: filters.q, mode: "insensitive" };
  }
  if (filters.kind && (PRODUCT_KINDS as readonly string[]).includes(filters.kind)) {
    where.kind = filters.kind as (typeof PRODUCT_KINDS)[number];
  }

  // Price, in SQL rather than after the fact. `effectivePrice` is the stored
  // form of `salePrice ?? basePrice` — see the column's comment in the schema.
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.effectivePrice = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }

  // Size and colour describe stocked variants, which only standard products
  // have. Applying them would silently drop every bulk and made-to-order item
  // from a filtered list, so they are skipped when browsing those.
  const sizes = filters.size ?? [];
  const colors = filters.color ?? [];
  const variantFilters: Prisma.ProductVariantWhereInput[] = [];
  if ((sizes.length > 0 || colors.length > 0) && filters.kind !== "BULK" && filters.kind !== "CUSTOM") {
    // Several sizes mean "available in any of them", which is what ticking two
    // of them looks like it should do. Both together still have to be satisfied
    // by one variant — a medium in red, not a medium and a red somewhere.
    variantFilters.push({
      ...(sizes.length > 0 ? { size: { in: sizes } } : {}),
      ...(colors.length > 0 ? { color: { in: colors } } : {}),
    });
  }

  // "Hide out of stock" was `allProducts.filter(...)` on both pages, which is
  // the one thing pagination cannot survive: filtering after taking 24 returns
  // short pages, and a count taken before it is a lie.
  //
  // "In stock" now means what the checkout means by it. A variant that does
  // not track inventory never runs out, and one that continues selling when
  // out of stock is a pre-order — neither is unavailable, and hiding them
  // would hide exactly the products a merchant set up to sell at zero.
  if (options.hideOutOfStock) {
    variantFilters.push({
      OR: [
        { stock: { gt: 0 } },
        { trackInventory: false },
        { continueSellingWhenOutOfStock: true },
      ],
    });
  }
  // One `some` per condition: two conditions inside a single `some` would be
  // satisfied by one variant meeting both, which is right for size+colour and
  // wrong across unrelated filters.
  if (variantFilters.length > 0) {
    where.AND = variantFilters.map((v) => ({ variants: { some: v } }));
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    filters.sort === "featured"
      ? [{ isFeatured: "desc" }, { createdAt: "desc" }]
      : filters.sort === "price-asc"
        ? [{ effectivePrice: "asc" }, { createdAt: "desc" }]
        : filters.sort === "price-desc"
          ? [{ effectivePrice: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];

  const perPage = options.perPage ?? PRODUCTS_PER_PAGE;
  const page = Math.max(1, options.page ?? 1);

  const client = await db();
  // Counted in the same round trip as the page. The count is what the heading
  // says and what the pagination bar divides, so it has to be the count of the
  // same query — not of a looser one.
  const [products, total] = await Promise.all([
    client.product.findMany({
      where,
      select: PRODUCT_CARD_SELECT,
      orderBy,
      take: perPage,
      skip: (page - 1) * perPage,
    }),
    client.product.count({ where }),
  ]);

  return { products, total };
}

export async function getProductBySlug(slug: string) {
  return (await db()).product.findFirst({
    where: { slug, isActive: true, status: "PUBLISHED", deletedAt: null },
    include: { variants: true, categories: true },
    omit: { costPrice: true }, // storefront-facing — never leak cost price to the client
  });
}

export async function getRelatedProducts(categoryIds: string[], excludeProductId: string) {
  return (await db()).product.findMany({
    where: {
      categories: { some: { id: { in: categoryIds } } },
      isActive: true,
      status: "PUBLISHED",
      deletedAt: null,
      id: { not: excludeProductId },
    },
    include: { variants: true, categories: true },
    omit: { costPrice: true }, // storefront-facing — never leak cost price to the client
    take: 4,
  });
}

export async function getFeaturedProducts() {
  return (await db()).product.findMany({
    where: { isActive: true, isFeatured: true, status: "PUBLISHED", deletedAt: null },
    include: { variants: true, categories: true },
    omit: { costPrice: true }, // storefront-facing — never leak cost price to the client
    take: 8,
  });
}

export async function getCategories() {
  return (await db()).category.findMany({ orderBy: { name: "asc" } });
}

/** Distinct sizes/colors across all active products, used to build filter options. */
/**
 * The sizes and colours the filter panel offers.
 *
 * Read on every shop and collection page, and it is the widest query the
 * storefront makes: every variant of every live product. `distinct` does not
 * save the read — Postgres still visits the rows and then de-duplicates — so
 * at a thousand concurrent visitors this was a thousand full variant scans for
 * an answer that is the same for all of them and changes only when a merchant
 * edits a product.
 *
 * Cached per shop, dropped by the same writers that drop the catalogue.
 */
export async function getFilterOptions() {
  const variants = await cachedForShop(await currentShopId(), "filters", (t) =>
    t.productVariant.findMany({
      where: { product: { isActive: true, status: "PUBLISHED", deletedAt: null } },
      select: { size: true, color: true, colorHex: true },
      distinct: ["size", "color"],
      // Bounded as well as cached. A shop with a pathological number of
      // option combinations should make the filter panel useless slowly
      // rather than make every page slow immediately.
      take: 500,
    })
  );
  const sizes = Array.from(new Set(variants.map((v) => v.size))).sort();
  const colorMap = new Map<string, string | null>();
  for (const v of variants) colorMap.set(v.color, v.colorHex);
  const colors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  return { sizes, colors };
}

/**
 * How many published products of each kind exist, for the shop's type tabs.
 *
 * Counted independently of the current filters so the tabs stay stable while
 * browsing — a count that changed as you filtered would read as the catalog
 * shrinking rather than the view narrowing.
 */
export async function countByKind(categorySlug?: string) {
  const rows = await (await db()).product.groupBy({
    by: ["kind"],
    where: {
      isActive: true,
      status: "PUBLISHED",
      deletedAt: null,
      ...(categorySlug ? { categories: { some: { slug: categorySlug } } } : {}),
    },
    _count: true,
  });
  return Object.fromEntries(rows.map((r) => [r.kind, r._count])) as Record<string, number>;
}
