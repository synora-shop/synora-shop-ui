import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { adapterFor, gatewayRow, openCredentials } from "@/lib/payments/gateways";
import { paymentCryptoReady } from "@/lib/payments/crypto";
import {
  providerSupportsCurrency,
  RESERVATION_MS,
  type GatewayProviderValue,
} from "@/lib/payments/providers";

/**
 * Sending a customer to a gateway.
 *
 * Creates the attempt first and the redirect second, in that order and never
 * the other way round: a customer who reaches a payment page for a reference we
 * have no record of is a payment we can never verify, and the provider would be
 * holding money against an order that does not know about it.
 */

export type StartPaymentResult =
  | { ok: true; url: string; fields: Record<string, string>; reference: string }
  | { ok: false; error: string };

export type StartPaymentArgs = {
  orderId: string;
  /**
   * The shopper's address, as this request saw it.
   *
   * Recorded on the attempt because the provider wants it back before it will
   * say what happened — and by then the browser it belonged to is long gone.
   */
  customerIp: string | null;
  shopId: string;
  provider: GatewayProviderValue;
  /** Whole currency units, matching Order.total. */
  amount: number;
  currency: string;
  shopName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  /** The storefront the customer is actually on, so they come back to it. */
  origin: string;
  /** Where the provider should post its notification. Always the canonical host. */
  callbackOrigin: string;
  /**
   * Whether a gateway still in test mode may be used.
   *
   * True only for a signed-in member of the shop buying from their own store.
   * That is how the go-live test is done: the merchant places a real order
   * through the real path, which is the only test worth having, while a
   * customer is never offered a gateway that would take pretend money.
   */
  allowTestMode: boolean;
};

/**
 * The order date, in the one format that must match on both calls.
 *
 * Formatted here rather than inside the adapter, and stored, because the value
 * sent when the customer left and the value sent when we ask what happened
 * have to be the same string. Deriving it twice from a timestamp is how they
 * end up a second apart and the provider stops recognising the request.
 */
function gatewayOrderDate(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}-${p(now.getUTCMonth() + 1)}-${p(now.getUTCDate())}`;
}

/**
 * A reference that is safe to hand to a third party and to put in a URL.
 *
 * 24 random bytes. Not the order id: order ids are five characters and unique
 * only within a shop, so two shops routinely hold the same one — sent to a
 * gateway as a shared basket id, that is one shop's callback confirming
 * another shop's order.
 */
function newReference(): string {
  return randomBytes(24).toString("base64url");
}

export async function startPayment(args: StartPaymentArgs): Promise<StartPaymentResult> {
  if (!paymentCryptoReady()) {
    return { ok: false, error: "Online payments are not available on this store right now." };
  }

  const gateway = await gatewayRow(args.shopId, args.provider);
  if (!gateway?.secret) {
    return { ok: false, error: "This store is not connected to that payment provider." };
  }
  if (!providerSupportsCurrency(args.provider, args.currency)) {
    return { ok: false, error: "That payment provider cannot take this store's currency." };
  }
  if (!gateway.isActive) {
    return { ok: false, error: "That payment method is switched off." };
  }
  if (gateway.mode === "SANDBOX" && !args.allowTestMode) {
    // Reached only by a stale tab or a hand-made request: the checkout does not
    // offer a test-mode gateway to anyone but the shop's own staff.
    return { ok: false, error: "That payment method is not available yet." };
  }

  const reference = newReference();
  const expiresAt = new Date(Date.now() + RESERVATION_MS);

  const payment = await prisma.payment.create({
    data: {
      shopId: args.shopId,
      orderId: args.orderId,
      gatewayId: gateway.id,
      provider: args.provider,
      mode: gateway.mode,
      reference,
      // Frozen here. Verification compares the provider's figure against this
      // row rather than against the order, so a later edit to the order cannot
      // make an underpayment match after the fact.
      amount: args.amount,
      currency: args.currency,
      status: "INITIATED",
      customerIp: args.customerIp,
      orderDate: gatewayOrderDate(),
      expiresAt,
    },
  });

  const returnUrl = `${args.origin}/order-confirmation/${args.orderId}?ref=${encodeURIComponent(reference)}`;

  const started = await adapterFor(args.provider).start({
    credentials: openCredentials(gateway),
    mode: gateway.mode,
    reference,
    amount: args.amount,
    currency: args.currency,
    description: `${args.shopName} order ${args.orderId}`,
    shopName: args.shopName,
    customerName: args.customerName,
    customerEmail: args.customerEmail,
    customerPhone: args.customerPhone,
    returnUrl,
    failureUrl: `${returnUrl}&failed=1`,
    // Always the platform address, never the host the customer happens to be
    // on: a custom domain can be removed from a shop between the order and the
    // callback, and the notification would then arrive nowhere.
    callbackUrl: `${args.callbackOrigin}/api/payments/${args.provider.toLowerCase()}/callback`,
  });

  if (!started.ok) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: started.error.slice(0, 300) },
    });
    await prisma.paymentGateway.update({
      where: { id: gateway.id },
      data: { lastCheckedAt: new Date(), lastError: started.error.slice(0, 300) },
    });
    return { ok: false, error: started.error };
  }

  await prisma.paymentGateway.update({
    where: { id: gateway.id },
    data: { lastCheckedAt: new Date(), lastError: null },
  });

  return { ok: true, url: started.url, fields: started.fields, reference };
}
