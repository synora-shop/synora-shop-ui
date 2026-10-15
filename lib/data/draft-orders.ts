import { db } from "@/lib/data/shop";
import { effectivePrice } from "@/lib/product-pricing";
import type { CatalogueItem } from "@/lib/draft-orders";

/**
 * Every size a hand order can include: the shop's products that are not in
 * the Bin, published or not (a merchant may sell something by message before
 * it is on the site), with the price a checkout would charge today.
 */
export async function draftCatalogue(): Promise<CatalogueItem[]> {
  const variants = await (await db()).productVariant.findMany({
    where: { product: { deletedAt: null } },
    select: {
      id: true, productId: true, sku: true, stock: true, trackInventory: true, priceOverride: true,
      option1: true, option2: true, option3: true, size: true, color: true,
      product: { select: { title: true, images: true, basePrice: true, salePrice: true } },
    },
    orderBy: [{ product: { title: "asc" } }, { sku: "asc" }],
    take: 3000,
  });
  return variants.map((v) => ({
    variantId: v.id,
    productId: v.productId,
    title: v.product.title,
    option: [v.option1 || v.size, v.option2 || v.color, v.option3].filter(Boolean).join(" · "),
    sku: v.sku,
    price: v.priceOverride ?? effectivePrice(v.product),
    stock: v.trackInventory ? v.stock : null,
    image: v.product.images[0] ?? null,
  }));
}
