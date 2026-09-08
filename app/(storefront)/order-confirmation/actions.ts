"use server";

import { db } from "@/lib/data/shop";
import { currentShopId, requireShop } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { startPayment } from "@/lib/payments/start";
import { canonicalUrl } from "@/lib/data/shop";
import { shopSession } from "@/lib/auth-guard";
import { isGatewayProvider } from "@/lib/payments/providers";
import { headers } from "next/headers";

/**
 * Another go at paying for an order that is still waiting.
 *
 * A declined card must not cost the customer their basket. The order already
 * exists and is still holding its stock, so this starts a fresh attempt against
 * the same order rather than making them shop again.
 *
 * Public and unauthenticated, because a guest checkout has no session and
 * somebody whose card was declined has to be able to try again. So what stands
 * in for one is **the payment reference**: 24 random bytes, minted when the
 * customer was sent to the provider and handed back to them in the return URL.
 *
 * Requiring it matters. Order ids are five characters, and the confirmation
 * page has always been reachable by anyone who guesses one. Without the
 * reference, this action would inherit that — a stranger walking order ids
 * could start payment attempts against other people's orders and learn each
 * one's state from the refusals. With it, guessing an order id is not enough,
 * and the reference is only ever known to the person who was sent to pay.
 *
 * Everything else is belt and braces: rate limited, only ever an order that is
 * unpaid and still inside its window, and the amount is read from the order
 * rather than taken from the caller.
 */
export type RetryResult =
  | { ok: true; url: string; fields: Record<string, string> }
  | { ok: false; error: string };

export async function retryPayment(orderId: string, reference: string): Promise<RetryResult> {
  const limited = await rateLimit("paymentCheck", await clientIp());
  if (!limited.ok) return { ok: false, error: limited.message };

  if (typeof reference !== "string" || reference.length < 16 || reference.length > 200) {
    return { ok: false, error: "That payment link is not valid." };
  }

  const t = await db();
  const order = await t.order.findFirst({ where: { id: orderId } });
  if (!order) return { ok: false, error: "That order could not be found." };

  // The reference must be one this shop issued, for this order. Scoped through
  // db(), so a reference belonging to another shop does not resolve at all.
  const attempt = await t.payment.findFirst({ where: { reference, orderId: order.id } });
  if (!attempt) return { ok: false, error: "That payment link is not valid." };

  if (order.paymentStatus === "CONFIRMED") {
    return { ok: false, error: "This order is already paid for." };
  }
  if (order.orderStatus === "CANCELLED") {
    return { ok: false, error: "This order was cancelled. Please start a new one." };
  }
  if (!order.reservedUntil || order.reservedUntil.getTime() < Date.now()) {
    return { ok: false, error: "The time to pay for this order has passed. Please start a new one." };
  }
  if (!isGatewayProvider(order.paymentMethod)) {
    return { ok: false, error: "This order isn't paid for online." };
  }

  const sid = await currentShopId();
  const shop = await requireShop();
  const settings = await getStoreSettings();
  const staff = await shopSession();
  const host = (await headers()).get("host");

  const started = await startPayment({
    orderId: order.id,
    shopId: sid,
    provider: order.paymentMethod,
    // From the order, never from the caller. This is the whole reason the
    // amount is not a parameter.
    amount: order.total,
    currency: resolveStoreDefaults(settings).currency,
    shopName: shop.name,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    origin: host ? `https://${host}` : await canonicalUrl(sid),
    callbackOrigin: await canonicalUrl(sid),
    allowTestMode: !!staff && staff.shop.id === sid,
  });

  if (!started.ok) return { ok: false, error: started.error };
  return { ok: true, url: started.url, fields: started.fields };
}
