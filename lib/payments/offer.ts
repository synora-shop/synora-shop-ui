import "server-only";
import { allGatewayRows } from "@/lib/payments/gateways";
import { paymentCryptoReady } from "@/lib/payments/crypto";
import { gatewayMeta, providerSupportsCurrency } from "@/lib/payments/providers";
import type { OfferableGateway } from "@/lib/payment-methods";
import type { PaymentGateway } from "@/lib/generated/prisma/client";

/**
 * Which gateways this visitor may be offered.
 *
 * The one asymmetry in the whole system, and it is deliberate: a gateway still
 * in test mode is offered to the shop's own staff and to nobody else.
 *
 * That is how the go-live gate is passed. The merchant places a real order
 * through the real checkout, is sent to the provider's sandbox, pays with a
 * test card and comes back — and the payment confirms through exactly the same
 * verification path a customer's would. Nothing about the test is a special
 * case, which is the only kind of test worth having. Meanwhile a shopper is
 * never shown a gateway that would take pretend money and hand them an order
 * confirmation for it.
 *
 * `isStaff` must come from a server-side membership check, never from anything
 * the browser said.
 */
export async function offerableGateways(
  shopId: string,
  currency: string,
  isStaff: boolean
): Promise<OfferableGateway[]> {
  if (!paymentCryptoReady()) return [];

  const rows = await allGatewayRows(shopId);
  return rows.filter((r) => offerable(r, currency, isStaff)).map((r) => ({
    value: r.provider,
    label: gatewayMeta(r.provider)?.label ?? r.provider,
    testMode: r.mode === "SANDBOX",
  }));
}

function offerable(row: PaymentGateway, currency: string, isStaff: boolean): boolean {
  if (!row.secret) return false;
  if (!row.isActive) return false;
  if (!providerSupportsCurrency(row.provider, currency)) return false;
  if (row.mode === "SANDBOX") return isStaff;
  return true;
}

/**
 * The same question, for one provider, at the moment an order is submitted.
 *
 * Asked again on the server rather than trusting that the checkout only showed
 * what it should have: a stale tab, a replayed request or a hand-made POST must
 * be refused by the same rule the page was rendered with.
 */
export async function mayUseGateway(
  shopId: string,
  provider: string,
  currency: string,
  isStaff: boolean
): Promise<boolean> {
  const offers = await offerableGateways(shopId, currency, isStaff);
  return offers.some((o) => o.value === provider);
}
