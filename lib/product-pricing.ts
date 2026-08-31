// Pure pricing helpers with zero server-only dependencies (no Prisma import) — safe to import
// from Client Components. lib/data/products.ts re-exports these for existing server-side
// callers; client components (product-list.tsx, bin-product-list.tsx, etc.) should import
// straight from here so their bundle never drags in `pg`/Prisma.

/** Effective price is salePrice if set, otherwise basePrice. */
export function effectivePrice(product: { basePrice: number; salePrice: number | null }) {
  return product.salePrice ?? product.basePrice;
}

/**
 * Per-unit profit at the product's current selling/cost price — admin-only.
 * Never call this with a storefront-fetched product (its costPrice is omitted).
 */
export function unitProfit(product: { basePrice: number; salePrice: number | null; costPrice: number }) {
  return effectivePrice(product) - product.costPrice;
}

/** Profit as a percentage of the selling price, e.g. 42.5 for a 42.5% margin. Null when price is 0. */
export function profitMargin(product: { basePrice: number; salePrice: number | null; costPrice: number }) {
  const price = effectivePrice(product);
  if (price <= 0) return null;
  return (unitProfit(product) / price) * 100;
}
