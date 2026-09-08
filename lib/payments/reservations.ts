import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

/**
 * Stock held by an order that has not been paid for yet.
 *
 * Checkout decrements stock when the order is written, before the customer has
 * paid. That is the right way round — the alternative is two people buying the
 * last item and one of them paying for something that does not exist — but it
 * has a cost: a customer who reaches the gateway and wanders off leaves the
 * item unavailable to everybody else.
 *
 * So a gateway order carries a deadline. Past it, with nothing confirmed, the
 * order is cancelled and everything it took goes back: the stock, the discount
 * use, and the redemption row that counts against a per-customer limit. All
 * three, or a promotion limited to one per customer is quietly spent by
 * somebody who never paid.
 *
 * Deliberately does not delete the order. A cancelled order is a record that
 * somebody tried, which is worth keeping and is what the merchant sees when
 * they ask why their stock moved.
 */

/**
 * Release one order's hold, if it still has one.
 *
 * Idempotent and safe to race: the guard is in the WHERE clause, so two callers
 * arriving together produce one release and one no-op rather than restocking
 * twice. Returns whether this call was the one that did it.
 */
export async function releaseOrder(orderId: string, reason: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    // Claim it first. Only an order that is still unpaid and still holding a
    // reservation can be released, and only once.
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        reservedUntil: { not: null },
        paymentStatus: { in: ["PENDING", "FAILED"] },
        orderStatus: "PENDING",
      },
      data: {
        reservedUntil: null,
        paymentStatus: "FAILED",
        orderStatus: "CANCELLED",
      },
    });
    if (claimed.count !== 1) return false;

    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return false;

    for (const item of order.items) {
      if (!item.variantId) continue;
      await tx.productVariant.updateMany({
        where: { id: item.variantId, shopId: order.shopId },
        data: { stock: { increment: item.quantity } },
      });
    }

    if (order.discountId) {
      await giveBackDiscount(tx, order.discountId, order.shopId, orderId);
    }

    console.log(`[payments] released reservation on order ${orderId}: ${reason}`);
    return true;
  });
}

/**
 * Hand a discount use back.
 *
 * Both halves. The counter on the discount is what enforces a total usage
 * limit; the redemption row is what enforces a per-customer one. Reversing only
 * the counter leaves a "one per customer" code permanently spent for a shopper
 * whose payment never went through.
 *
 * The counter is floored at zero rather than decremented blindly, because a
 * discount whose count has been edited elsewhere must not be driven negative by
 * a cancellation.
 */
async function giveBackDiscount(
  tx: Prisma.TransactionClient,
  discountId: string,
  shopId: string,
  orderId: string
): Promise<void> {
  await tx.$executeRaw`
    UPDATE "Discount"
    SET "usageCount" = GREATEST("usageCount" - 1, 0)
    WHERE "id" = ${discountId} AND "shopId" = ${shopId}
  `;
  await tx.discountRedemption.deleteMany({ where: { orderId, shopId } });
}

/**
 * Release every hold that has run out, for one shop.
 *
 * Called on the paths that care — a checkout about to price the same stock, and
 * the admin order list — rather than only from a scheduled job. The scheduler
 * available on this plan runs once a day, and a thirty-minute reservation swept
 * daily is a day-long reservation. Doing it where it matters keeps the promise
 * without needing a minute-by-minute cron.
 *
 * Bounded on purpose: a shop with a thousand stale orders releases them over
 * several visits rather than turning one shopper's page load into a long
 * transaction.
 */
export async function releaseExpiredForShop(shopId: string, limit = 25): Promise<number> {
  const due = await prisma.order.findMany({
    where: {
      shopId,
      reservedUntil: { lt: new Date() },
      paymentStatus: { in: ["PENDING", "FAILED"] },
      orderStatus: "PENDING",
    },
    select: { id: true },
    orderBy: { reservedUntil: "asc" },
    take: limit,
  });

  let released = 0;
  for (const order of due) {
    if (await releaseOrder(order.id, "reservation expired")) released += 1;
  }
  return released;
}

/**
 * The same sweep, across every shop. The daily cron's backstop.
 *
 * The per-shop version above is what normally does the work; this catches
 * orders belonging to a shop nobody has visited since.
 */
export async function releaseExpiredEverywhere(limit = 500): Promise<number> {
  const due = await prisma.order.findMany({
    where: {
      reservedUntil: { lt: new Date() },
      paymentStatus: { in: ["PENDING", "FAILED"] },
      orderStatus: "PENDING",
    },
    select: { id: true },
    orderBy: { reservedUntil: "asc" },
    take: limit,
  });

  let released = 0;
  for (const order of due) {
    if (await releaseOrder(order.id, "reservation expired (sweep)")) released += 1;
  }
  return released;
}
