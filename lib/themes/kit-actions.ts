"use client";

import { useCartStore } from "@/lib/cart-store";
import type { KitProductPage } from "@/lib/themes/kit";

/**
 * What a theme kit's sections may *do*, as opposed to read: the platform's
 * own cart, behind the one door every kit uses. A kit never imports the cart
 * store directly, so the cart can change underneath without every theme
 * changing with it.
 */
export function useKitCart() {
  const addItem = useCartStore((s) => s.addItem);
  return {
    /**
     * Add the variant with this colour and size. Returns false — and adds
     * nothing — when there is no such variant or it is out of stock: the same
     * two refusals the platform's own product panel makes.
     */
    add(product: KitProductPage, choice: { colour?: string; size?: string }, quantity: number): boolean {
      const v = product.variants.find(
        (x) => (!choice.size || x.size === choice.size) && (!choice.colour || x.color === choice.colour)
      );
      if (!v || v.stock <= 0) return false;
      addItem({
        productId: product.id,
        variantId: v.id,
        slug: product.slug,
        title: product.title,
        image: product.photos[0]?.src ?? "",
        size: v.size,
        color: v.color,
        price: product.amount,
        quantity: Math.max(1, quantity),
        stock: v.stock,
      });
      return true;
    },
  };
}
