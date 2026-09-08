import "server-only";
import { prisma } from "@/lib/prisma";
import { adapterFor, openCredentials } from "@/lib/payments/gateways";
import { releaseOrder } from "@/lib/payments/reservations";
import type { GatewayProviderValue } from "@/lib/payments/providers";
import { announcePaidOrder } from "@/lib/payments/announce";
import type { Payment } from "@/lib/generated/prisma/client";

/**
 * The one place an order can become paid.
 *
 * Everything else — the provider's callback, the page the customer lands on,
 * the sweep, a merchant pressing "check again" — calls this and believes what
 * it returns. None of them is trusted to decide anything itself, and none of
 * them passes in a status: the only input is a reference, and the answer comes
 * from asking the provider.
 *
 * Why it is built this way. A gateway callback is a public endpoint. It has to
 * be: the provider's servers must reach it and cannot authenticate to us. So
 * anything in the request body is a claim by a stranger, and the widely-copied
 * integrations treat that claim as proof — the most-used PayFast library marks
 * an order paid on any POST carrying a transaction id. The field PayFast calls
 * SIGNATURE is not one. So the body is used for exactly one thing: as a hint
 * about which reference to go and ask about.
 *
 * Five rules hold this together, and every one of them is a bug somebody has
 * shipped:
 *
 *   The provider is asked, never told. Only `lookup` can produce PAID.
 *   The amount must match what we asked for, to the rupee.
 *   The currency must match.
 *   A confirmation is claimed with a conditional write, so two callbacks
 *     arriving together confirm once.
 *   Anything unclear — unreachable, unparseable, unrecognised status — leaves
 *     the order unpaid. Failing closed on a payment costs a support message.
 *     Failing open ships goods for free.
 */

export type VerifySource = "callback" | "return" | "sweep" | "admin";

export type VerifyOutcome =
  | { state: "CONFIRMED"; already: boolean; orderId: string }
  | { state: "PENDING"; orderId: string }
  | { state: "FAILED"; orderId: string; reason: string }
  | { state: "EXPIRED"; orderId: string }
  | { state: "MISMATCHED"; orderId: string; reason: string }
  | { state: "UNAVAILABLE"; orderId: string | null; reason: string }
  | { state: "UNKNOWN_REFERENCE" };

/** Amounts are whole currency units; the provider answers in decimals. */
function amountsMatch(asked: number, paid: number | null): boolean {
  if (paid == null || !Number.isFinite(paid)) return false;
  return Math.abs(paid - asked) < 0.005;
}

async function record(args: {
  payment: Payment | null;
  provider: GatewayProviderValue;
  source: VerifySource;
  outcome: string;
  detail?: string;
  ip?: string | null;
}): Promise<void> {
  try {
    await prisma.paymentEvent.create({
      data: {
        shopId: args.payment?.shopId ?? null,
        paymentId: args.payment?.id ?? null,
        provider: args.provider,
        source: args.source,
        outcome: args.outcome,
        detail: args.detail?.slice(0, 500) ?? null,
        ip: args.ip ?? null,
      },
    });
  } catch (err) {
    // A failed audit write must not swallow a real payment. Logged and stepped
    // over, because the alternative — throwing — turns a bookkeeping problem
    // into a customer who paid and got nothing.
    console.error("[payments] could not record event", err);
  }
}

/**
 * Ask the provider about one reference and act on the answer.
 *
 * `ip` is recorded, not trusted; it exists so a merchant looking at a run of
 * forged callbacks can see where they came from.
 */
export async function verifyPayment(
  reference: string,
  source: VerifySource,
  ip?: string | null
): Promise<VerifyOutcome> {
  // Read by reference alone, which is safe because the reference is random and
  // globally unique — see the Payment model for why it is not the order id.
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) {
    // Nothing to look up. Recorded without a shop, because a reference nobody
    // issued belongs to nobody, and filing it against a merchant would be a
    // lie about their records.
    await prisma.paymentEvent
      .create({
        data: { provider: "PAYFAST", source, outcome: "unknown-reference", detail: reference.slice(0, 120), ip: ip ?? null },
      })
      .catch(() => {});
    return { state: "UNKNOWN_REFERENCE" };
  }

  const provider = payment.provider;

  // Already settled. Answered from the row without troubling the provider —
  // and, importantly, without any path that could change a confirmed payment.
  if (payment.status === "CONFIRMED") {
    await record({ payment, provider, source, outcome: "already-confirmed", ip });
    return { state: "CONFIRMED", already: true, orderId: payment.orderId };
  }
  if (payment.status === "MISMATCHED") {
    await record({ payment, provider, source, outcome: "already-mismatched", ip });
    return { state: "MISMATCHED", orderId: payment.orderId, reason: payment.failureReason ?? "Amount did not match" };
  }

  const gateway = payment.gatewayId
    ? await prisma.paymentGateway.findUnique({ where: { id: payment.gatewayId } })
    : await prisma.paymentGateway.findUnique({
        where: { shopId_provider: { shopId: payment.shopId, provider } },
      });

  if (!gateway?.secret) {
    await record({ payment, provider, source, outcome: "provider-error", detail: "gateway disconnected", ip });
    return {
      state: "UNAVAILABLE",
      orderId: payment.orderId,
      reason: "This store's payment gateway is no longer connected.",
    };
  }

  let answer;
  try {
    answer = await adapterFor(provider).lookup(openCredentials(gateway), payment.mode, reference);
  } catch (err) {
    await record({
      payment,
      provider,
      source,
      outcome: "provider-error",
      detail: err instanceof Error ? err.message : "lookup threw",
      ip,
    });
    return { state: "UNAVAILABLE", orderId: payment.orderId, reason: "Could not reach the payment provider." };
  }

  if (!answer.ok) {
    await record({ payment, provider, source, outcome: "provider-error", detail: answer.error, ip });
    // Left exactly as it was. An unreachable provider is not a failed payment,
    // and marking it one would cancel an order somebody may have paid for.
    return { state: "UNAVAILABLE", orderId: payment.orderId, reason: answer.error };
  }

  if (answer.state === "PAID") {
    // Everything below has to hold before a single rupee is called received.
    if (!amountsMatch(payment.amount, answer.amount)) {
      return mismatch(
        payment,
        source,
        `Expected ${payment.amount} ${payment.currency}, provider reported ${answer.amount ?? "nothing"}`,
        ip
      );
    }
    if (answer.currency && answer.currency.toUpperCase() !== payment.currency.toUpperCase()) {
      return mismatch(
        payment,
        source,
        `Expected ${payment.currency}, provider reported ${answer.currency}`,
        ip
      );
    }
    return confirm(payment, answer.providerRef, source, ip);
  }

  if (answer.state === "FAILED") {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: { in: ["INITIATED", "PENDING"] } },
      data: { status: "FAILED", failureReason: (answer.detail || "Declined").slice(0, 300) },
    });
    await record({ payment, provider, source, outcome: "failed", detail: answer.detail, ip });
    // The order keeps its reservation until the deadline, so the customer can
    // try again with another card rather than losing the basket to one decline.
    return { state: "FAILED", orderId: payment.orderId, reason: answer.detail || "The payment was declined." };
  }

  // PENDING or UNKNOWN. If the window has closed, the hold goes back.
  if (payment.expiresAt.getTime() < Date.now()) {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: { in: ["INITIATED", "PENDING"] } },
      data: { status: "EXPIRED", failureReason: "Not completed in time" },
    });
    await releaseOrder(payment.orderId, "payment window closed");
    await record({ payment, provider, source, outcome: "expired", ip });
    return { state: "EXPIRED", orderId: payment.orderId };
  }

  await prisma.payment.updateMany({
    where: { id: payment.id, status: "INITIATED" },
    data: { status: "PENDING" },
  });
  await record({ payment, provider, source, outcome: "pending", detail: answer.detail, ip });
  return { state: "PENDING", orderId: payment.orderId };
}

async function mismatch(
  payment: Payment,
  source: VerifySource,
  reason: string,
  ip?: string | null
): Promise<VerifyOutcome> {
  await prisma.payment.updateMany({
    where: { id: payment.id, status: { in: ["INITIATED", "PENDING"] } },
    data: { status: "MISMATCHED", failureReason: reason.slice(0, 300) },
  });
  await record({ payment, provider: payment.provider, source, outcome: "mismatch", detail: reason, ip });
  // Never confirmed, and never quietly cancelled either: money may genuinely
  // have moved, and this is a human's problem to look at rather than a state
  // for software to guess its way out of.
  return { state: "MISMATCHED", orderId: payment.orderId, reason };
}

/**
 * Mark it paid — once.
 *
 * The conditional update is the whole safety of this function. Two callbacks,
 * a callback racing the return page, a merchant pressing check at the same
 * moment: whichever transaction gets there first flips the row, and the others
 * update nothing and are told it was already done. Nothing downstream — the
 * order, the emails — runs twice, because it hangs off `count === 1`.
 */
async function confirm(
  payment: Payment,
  providerRef: string | null,
  source: VerifySource,
  ip?: string | null
): Promise<VerifyOutcome> {
  const now = new Date();

  let claimed: { count: number };
  try {
    claimed = await prisma.payment.updateMany({
      where: { id: payment.id, status: { in: ["INITIATED", "PENDING"] } },
      data: { status: "CONFIRMED", providerRef, verifiedAt: now, failureReason: null },
    });
  } catch (err) {
    // The unique index on (provider, providerRef) fired: this transaction id
    // is already recorded against a different attempt. That is one payment
    // being claimed for two orders, which is exactly what the index is for.
    const duplicate = err && typeof err === "object" && "code" in err && err.code === "P2002";
    if (!duplicate) throw err;
    return mismatch(payment, source, "The provider's transaction is already recorded against another order", ip);
  }

  if (claimed.count !== 1) {
    await record({ payment, provider: payment.provider, source, outcome: "already-confirmed", ip });
    return { state: "CONFIRMED", already: true, orderId: payment.orderId };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.updateMany({
      where: { id: payment.orderId, shopId: payment.shopId },
      data: { paymentStatus: "CONFIRMED", reservedUntil: null },
    });

    // Moved forward only if it is still sitting where checkout left it. A
    // merchant who marked the order packed while the callback was in flight
    // does not get their work undone by an arriving confirmation.
    await tx.order.updateMany({
      where: { id: payment.orderId, shopId: payment.shopId, orderStatus: "PENDING" },
      data: { orderStatus: "CONFIRMED" },
    });

    // The go-live proof, written here and nowhere else: a merchant cannot
    // unlock live payments by saving a form, only by a test that worked.
    if (payment.gatewayId) {
      await tx.paymentGateway.updateMany({
        where: {
          id: payment.gatewayId,
          ...(payment.mode === "SANDBOX" ? { sandboxVerifiedAt: null } : { liveVerifiedAt: null }),
        },
        data: payment.mode === "SANDBOX" ? { sandboxVerifiedAt: now } : { liveVerifiedAt: now },
      });
    }
  });

  await record({ payment, provider: payment.provider, source, outcome: "confirmed", detail: providerRef ?? undefined, ip });

  // The merchant and the customer are told now, not at checkout.
  //
  // A manual order is announced the moment it is placed, because placing it is
  // the whole event. A gateway order placed is only an intention: telling a
  // merchant "new order" for a card that then declines is how a shop packs a
  // parcel nobody paid for. Sent after the money is verified, and only on the
  // transaction that won the claim above, so it is sent exactly once.
  await announcePaidOrder(payment.orderId).catch((err) => {
    // A mail failure must not unpick a confirmed payment.
    console.error("[payments] could not announce paid order", err);
  });

  return { state: "CONFIRMED", already: false, orderId: payment.orderId };
}
