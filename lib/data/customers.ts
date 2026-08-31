import { db } from "@/lib/data/shop";

/**
 * Who buys from this shop, and what that is worth.
 *
 * The admin had no notion of a customer at all: the data existed — every order
 * carries a buyer, and shoppers can register — but nothing anywhere put the two
 * together, so "has this person ordered before?" had no answer short of
 * scanning the orders list by eye.
 *
 * Totals deliberately exclude binned orders, matching the dashboard: a merchant
 * who bins a test order should not see it counted against a customer's spend.
 */

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  /** Whether they have set a password, as opposed to only ever checking out. */
  hasAccount: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  createdAt: Date;
};

export async function listCustomers(search?: string): Promise<CustomerSummary[]> {
  const t = await db();

  const term = search?.trim();
  const customers = await t.customer.findMany({
    where: term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
            { phone: { contains: term } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      passwordHash: true,
      createdAt: true,
      orders: {
        where: { deletedAt: null, orderStatus: { not: "CANCELLED" } },
        select: { total: true, createdAt: true },
      },
    },
  });

  return customers
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      hasAccount: c.passwordHash !== null,
      orderCount: c.orders.length,
      totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
      lastOrderAt: c.orders.reduce<Date | null>(
        (latest, o) => (!latest || o.createdAt > latest ? o.createdAt : latest),
        null
      ),
      createdAt: c.createdAt,
    }))
    // Best customers first — the order a merchant actually wants them in. A
    // customer with no orders yet (registered but never bought) sorts last
    // rather than being hidden, because that is a real thing to follow up.
    .sort((a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount);
}

/**
 * One customer, with `hasAccount` in place of the password hash.
 *
 * The hash is read — it is the only way to tell a registered shopper from a
 * guest — but it is reduced to a boolean before it leaves here. Returning it
 * would be safe only for as long as every caller stayed a Server Component:
 * the day one passes a customer to a client component, the hash is serialised
 * into the payload sent to the browser. Answering the question the callers
 * actually ask removes that possibility rather than relying on care.
 */
export async function getCustomer(id: string) {
  const t = await db();
  const customer = await t.customer.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      passwordHash: true,
      createdAt: true,
      addresses: true,
      orders: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          total: true,
          orderStatus: true,
          paymentMethod: true,
          createdAt: true,
          items: { select: { title: true, quantity: true } },
        },
      },
    },
  });

  if (!customer) return null;
  const { passwordHash, ...rest } = customer;
  return { ...rest, hasAccount: passwordHash !== null };
}
