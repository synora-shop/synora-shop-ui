import type { Prisma } from "@/lib/generated/prisma/client";
import { db, currentShopId } from "@/lib/data/shop";
import { applyDiscount, normaliseCode, type Cart, type DiscountOutcome } from "@/lib/discounts";

/**
 * Looking a discount code up and deciding what it is worth.
 *
 * The rules themselves live in lib/discounts.ts and are pure. This is only the
 * part that needs a database: finding the code, and counting what this customer
 * has already used.
 *
 * Every function here takes the client to use rather than reaching for one.
 * That is not ceremony: checkout runs inside an interactive transaction, and a
 * query issued on the pooled client from in there waits for a connection the
 * transaction is itself holding. With a small pool that is a deadlock, and the
 * first version of this file hit exactly that — every discounted checkout died
 * on a five-second transaction timeout.
 */

export type QuoteInput = {
  code: string;
  cart: Cart;
  /** Null for a guest who has never bought here before. */
  customerId: string | null;
  now?: Date;
};

export type Quote =
  | { ok: true; discountId: string; code: string; outcome: Extract<DiscountOutcome, { ok: true }> }
  | { ok: false; reason: string };

/** Anything that can run these queries: the scoped client, or a transaction. */
type Client = Pick<Prisma.TransactionClient, "discount" | "discountRedemption">;

/**
 * What a code would do to this cart, on a caller-supplied client.
 *
 * `shopId` is explicit because a transaction client does not go through the
 * scoping extension — inside a transaction nothing is filtered unless it says
 * so, and a discount found across shops would be one merchant's promotion
 * spending another's margin.
 */
export async function quoteDiscountWith(
  client: Client,
  shopId: string,
  input: QuoteInput
): Promise<Quote> {
  const code = normaliseCode(input.code);
  if (!code) return { ok: false, reason: "Enter a discount code." };

  const discount = await client.discount.findFirst({ where: { code, shopId } });
  // Deliberately the same message for "no such code" and "code is switched
  // off": a checkout form that distinguishes them is a way to enumerate a
  // shop's unreleased codes.
  if (!discount) return { ok: false, reason: "That code isn't valid." };

  const customerUses = input.customerId
    ? await client.discountRedemption.count({
        where: { discountId: discount.id, customerId: input.customerId, shopId },
      })
    : 0;

  const outcome = applyDiscount(
    {
      code: discount.code,
      type: discount.type,
      value: discount.value,
      minSubtotal: discount.minSubtotal,
      usageLimit: discount.usageLimit,
      perCustomerLimit: discount.perCustomerLimit,
      usageCount: discount.usageCount,
      startsAt: discount.startsAt,
      endsAt: discount.endsAt,
      isActive: discount.isActive,
    },
    input.cart,
    { now: input.now ?? new Date(), customerUses }
  );

  if (!outcome.ok) return { ok: false, reason: outcome.reason };
  return { ok: true, discountId: discount.id, code: discount.code, outcome };
}

/**
 * The same quote, for callers outside a transaction — the storefront's
 * "apply code" button. Uses the scoped client, so it needs no shopId.
 */
export async function quoteDiscount(input: QuoteInput): Promise<Quote> {
  const [client, shopId] = await Promise.all([db(), currentShopId()]);
  return quoteDiscountWith(client as unknown as Client, shopId, input);
}

/**
 * Claims one use of a discount, refusing if that would exceed its limit.
 *
 * Raw SQL because the condition compares two columns of the same row —
 * `usageCount < usageLimit` — which Prisma's filter language cannot express.
 * Doing it in one statement is the entire point: reading the count and then
 * incrementing it lets two checkouts arriving together both see "9 of 10 used"
 * and both proceed, handing out eleven uses of a ten-use code.
 *
 * The shop is named explicitly. Raw SQL does not go through the scoping
 * extension in lib/tenant.ts, so nothing here is filtered unless it says so.
 */
export async function claimDiscountUse(
  tx: Prisma.TransactionClient,
  discountId: string,
  shopId: string
): Promise<boolean> {
  const updated = await tx.$executeRaw`
    UPDATE "Discount"
    SET "usageCount" = "usageCount" + 1
    WHERE "id" = ${discountId}
      AND "shopId" = ${shopId}
      AND "isActive" = true
      AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")
  `;
  return updated === 1;
}

/** Every discount for the shop, newest first. */
export async function listDiscounts() {
  const t = await db();
  return t.discount.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  });
}
