"use server";

import { db } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { quoteDiscount } from "@/lib/data/discounts";
import { effectivePrice } from "@/lib/data/products";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { storefrontClosure } from "@/lib/maintenance";
import { describeDiscount } from "@/lib/discounts";

export type CartLine = { variantId: string; quantity: number };

export type PreviewResult =
  | { ok: true; code: string; saving: number; description: string }
  | { ok: false; error: string };

/**
 * What a discount code would be worth on this cart, before checking out.
 *
 * The cart's value is recomputed here from the variant ids rather than taken
 * from the request. A preview built on a client-supplied subtotal would let
 * anyone claim a 10,000 order, watch a "minimum spend 5,000" code come back
 * valid, and then be refused at checkout for reasons the page had just told
 * them did not apply. Same prices, same rules, same answer as the order.
 */
export async function previewDiscount(
  code: string,
  lines: CartLine[]
): Promise<PreviewResult> {
  // Trying codes is guessing at somebody's promotions, and it is unauthenticated.
  const limited = await rateLimit("discountPreview", await clientIp());
  if (!limited.ok) return { ok: false, error: limited.message };

  if (await storefrontClosure()) {
    return { ok: false, error: "This store isn't taking orders at the moment." };
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Add something to your basket first." };
  }

  const t = await db();
  const variants = await t.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) } },
    include: { product: true },
  });

  const subtotal = lines.reduce((sum, line) => {
    const variant = variants.find((v) => v.id === line.variantId);
    if (!variant) return sum;
    const price = variant.priceOverride ?? effectivePrice(variant.product);
    // Quantity comes from the client, so it is clamped rather than trusted —
    // a negative or absurd number must not produce a subtotal that unlocks a
    // code it shouldn't.
    const quantity = Math.max(0, Math.min(Math.floor(line.quantity) || 0, 999));
    return sum + price * quantity;
  }, 0);

  if (subtotal <= 0) return { ok: false, error: "Add something to your basket first." };

  const settings = await getStoreSettings();
  const shippingFee =
    settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingFee;

  // Guest preview: a per-customer limit can only be counted once the buyer is
  // known, which is at checkout. A code at its per-customer limit therefore
  // previews as valid and is refused on submit — the alternative is asking for
  // an email address before showing a price, which is worse.
  const quote = await quoteDiscount({ code, cart: { subtotal, shippingFee }, customerId: null });
  if (!quote.ok) return { ok: false, error: quote.reason };

  const discount = await t.discount.findFirst({
    where: { id: quote.discountId },
    select: { type: true, value: true },
  });

  return {
    ok: true,
    code: quote.code,
    saving: quote.outcome.totalSaving,
    description: discount ? describeDiscount(discount.type, discount.value) : "Discount",
  };
}
