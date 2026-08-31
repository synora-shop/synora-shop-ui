import type { Prisma } from "@/lib/generated/prisma/client";
import { db } from "@/lib/data/shop";

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

export async function getProducts(filters: ProductFilters = {}) {
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
  // Size and colour describe stocked variants, which only standard products
  // have. Applying them would silently drop every bulk and made-to-order item
  // from a filtered list, so they are skipped when browsing those.
  const sizes = filters.size ?? [];
  const colors = filters.color ?? [];
  if ((sizes.length > 0 || colors.length > 0) && filters.kind !== "BULK" && filters.kind !== "CUSTOM") {
    // Several sizes mean "available in any of them", which is what ticking two
    // of them looks like it should do. Both together still have to be satisfied
    // by one variant — a medium in red, not a medium and a red somewhere.
    where.variants = {
      some: {
        ...(sizes.length > 0 ? { size: { in: sizes } } : {}),
        ...(colors.length > 0 ? { color: { in: colors } } : {}),
      },
    };
  }

  let products = await (await db()).product.findMany({
    where,
    include: { variants: true, categories: true },
    omit: { costPrice: true }, // storefront-facing — never leak cost price to the client
    orderBy:
      filters.sort === "featured"
        ? [{ isFeatured: "desc" }, { createdAt: "desc" }]
        : filters.sort === "newest" || !filters.sort
          ? { createdAt: "desc" }
          : undefined,
  });

  // Price filtering/sorting applied in JS since effective price depends on salePrice fallback logic.
  if (filters.minPrice != null) {
    products = products.filter((p) => effectivePrice(p) >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    products = products.filter((p) => effectivePrice(p) <= filters.maxPrice!);
  }
  if (filters.sort === "price-asc") {
    products = products.sort((a, b) => effectivePrice(a) - effectivePrice(b));
  } else if (filters.sort === "price-desc") {
    products = products.sort((a, b) => effectivePrice(b) - effectivePrice(a));
  }

  return products;
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
export async function getFilterOptions() {
  const variants = await (await db()).productVariant.findMany({
    where: { product: { isActive: true, status: "PUBLISHED", deletedAt: null } },
    select: { size: true, color: true, colorHex: true },
    distinct: ["size", "color"],
  });
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
