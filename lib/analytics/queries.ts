import { db, requireShop } from "@/lib/data/shop";
import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/data/settings";
import { seriesByDay, topBy, type Point } from "@/lib/analytics";

/**
 * Everything the analytics screen reads, in one place.
 *
 * Two rules run through this file.
 *
 * Orders go through the tenant-scoped client, which stamps the shop on every
 * query so no read can reach another merchant's rows.
 *
 * Visits do not, because they need `date_trunc` in the shop's own time zone and
 * Prisma has no way to express that. Every raw query here therefore carries its
 * own `"shopId" = ${shopId}`, and that is the whole of the isolation — so it is
 * asserted in scripts/check-analytics.ts rather than left to review.
 *
 * The window is always a pair: the range asked for, and the one immediately
 * before it of the same length. Without the second, a number is just a number —
 * "Rs 1.2m" says nothing until you know last month was Rs 900k.
 */

export type Window = { from: Date; to: Date; previousFrom: Date };

/** The range asked for, plus the equal-length one before it. */
export function windowFor(days: number, now = new Date()): Window {
  const to = now;
  const from = new Date(now.getTime() - days * 86_400_000);
  const previousFrom = new Date(from.getTime() - days * 86_400_000);
  return { from, to, previousFrom };
}

export type Totals = {
  revenue: number;
  orders: number;
  customers: number;
  profit: number;
  averageOrder: number;
};

const CANCELLED_EXCLUDED = { orderStatus: { not: "CANCELLED" as const }, deletedAt: null };

/**
 * The headline figures for one window.
 *
 * Cancelled orders are excluded from every one of them. A cancelled order is
 * not revenue, was never profit, and counting it in the order total makes a bad
 * week look like a good one.
 */
async function totalsBetween(from: Date, to: Date): Promise<Totals> {
  const t = await db();
  const [agg, lines, customers] = await Promise.all([
    t.order.aggregate({
      _sum: { total: true },
      _count: true,
      where: { ...CANCELLED_EXCLUDED, createdAt: { gte: from, lte: to } },
    }),
    // Profit is per line — price and cost are both on the item — so it cannot
    // be a single SQL sum. Reduced in JS from the smallest possible select.
    t.orderItem.findMany({
      where: { order: { ...CANCELLED_EXCLUDED, createdAt: { gte: from, lte: to } } },
      select: { price: true, costPrice: true, quantity: true },
    }),
    t.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
  ]);

  const revenue = agg._sum.total ?? 0;
  const orders = agg._count;
  const cost = lines.reduce((s, l) => s + l.costPrice * l.quantity, 0);
  return {
    revenue,
    orders,
    customers,
    profit: revenue - cost,
    // Dividing by nothing is not zero, it is undefined — and a screen showing
    // "Rs NaN" is how a merchant stops trusting the whole page.
    averageOrder: orders > 0 ? Math.round(revenue / orders) : 0,
  };
}

export type VisitPoint = { day: string; views: number; people: number };

/**
 * Visits per day, and how many distinct people they came from.
 *
 * Grouped in Postgres rather than in JS: a year of a busy shop's traffic is
 * more rows than a page should ever load to count them.
 */
async function visitsByDay(shopId: string, from: Date, to: Date, timeZone: string): Promise<VisitPoint[]> {
  const rows = await prisma.$queryRaw<{ day: string; views: bigint; people: bigint }[]>`
    SELECT to_char(("createdAt" AT TIME ZONE ${timeZone})::date, 'YYYY-MM-DD') AS day,
           count(*) AS views,
           count(DISTINCT "visitor") AS people
      FROM "Visit"
     WHERE "shopId" = ${shopId}
       AND "createdAt" >= ${from}
       AND "createdAt" <= ${to}
     GROUP BY 1
     ORDER BY 1
  `;
  return rows.map((r) => ({ day: r.day, views: Number(r.views), people: Number(r.people) }));
}

export type Ranked = { label: string; value: number };

/** The whole screen, for one window. */
export async function analytics(days: number) {
  const shop = await requireShop();
  const settings = await getStoreSettings();
  const timeZone = settings.timeZone || "UTC";
  const { from, to, previousFrom } = windowFor(days);
  const t = await db();

  const [current, previous] = await Promise.all([
    totalsBetween(from, to),
    totalsBetween(previousFrom, from),
  ]);

  const [orderRows, itemRows, stageCounts, cancelled, lowStock, outOfStock] = await Promise.all([
    t.order.findMany({
      where: { ...CANCELLED_EXCLUDED, createdAt: { gte: from, lte: to } },
      select: { createdAt: true, total: true },
    }),
    t.orderItem.findMany({
      where: { order: { ...CANCELLED_EXCLUDED, createdAt: { gte: from, lte: to } } },
      select: { title: true, price: true, quantity: true },
    }),
    t.order.groupBy({
      by: ["orderStatus"],
      _count: true,
      where: { deletedAt: null, createdAt: { gte: from, lte: to } },
    }),
    t.order.count({
      where: { deletedAt: null, orderStatus: "CANCELLED", createdAt: { gte: from, lte: to } },
    }),
    t.productVariant.count({
      where: { stock: { gt: 0, lt: settings.lowStockThreshold }, product: { deletedAt: null } },
    }),
    t.productVariant.count({ where: { stock: 0, product: { deletedAt: null } } }),
  ]);

  const [visits, live, pages, referrers] = await Promise.all([
    visitsByDay(shop.id, from, to, timeZone),
    // "Right now" is the last five minutes. Shorter reads as empty on a quiet
    // shop; longer stops being "now".
    prisma.$queryRaw<{ people: bigint }[]>`
      SELECT count(DISTINCT "visitor") AS people
        FROM "Visit"
       WHERE "shopId" = ${shop.id}
         AND "createdAt" >= ${new Date(Date.now() - 5 * 60_000)}
    `,
    prisma.$queryRaw<{ label: string; value: bigint }[]>`
      SELECT "path" AS label, count(*) AS value
        FROM "Visit"
       WHERE "shopId" = ${shop.id} AND "createdAt" >= ${from} AND "createdAt" <= ${to}
       GROUP BY 1 ORDER BY 2 DESC LIMIT 5
    `,
    prisma.$queryRaw<{ label: string; value: bigint }[]>`
      SELECT coalesce("referrer", 'direct') AS label, count(*) AS value
        FROM "Visit"
       WHERE "shopId" = ${shop.id} AND "createdAt" >= ${from} AND "createdAt" <= ${to}
       GROUP BY 1 ORDER BY 2 DESC LIMIT 5
    `,
  ]);

  const revenueSeries: Point[] = seriesByDay(
    orderRows.map((o) => ({ createdAt: o.createdAt, value: o.total })),
    from, to, timeZone
  );
  const orderSeries: Point[] = seriesByDay(
    orderRows.map((o) => ({ createdAt: o.createdAt, value: 1 })),
    from, to, timeZone
  );
  // Visits are already grouped by the database, so they are aligned to the same
  // day span rather than re-bucketed — otherwise a quiet day would be missing
  // from the line instead of sitting on the floor.
  const visitLookup = new Map(visits.map((v) => [v.day, v]));
  const visitSeries: Point[] = revenueSeries.map((p) => ({
    day: p.day,
    value: visitLookup.get(p.day)?.views ?? 0,
  }));
  const peopleSeries: Point[] = revenueSeries.map((p) => ({
    day: p.day,
    value: visitLookup.get(p.day)?.people ?? 0,
  }));

  return {
    timeZone,
    from, to,
    current, previous,
    revenueSeries, orderSeries, visitSeries, peopleSeries,
    topProducts: topBy(itemRows, (r) => r.title, (r) => r.price * r.quantity, 5),
    stages: Object.fromEntries(stageCounts.map((s) => [s.orderStatus, s._count])) as Record<string, number>,
    cancelled,
    stock: { low: lowStock, out: outOfStock },
    liveVisitors: Number(live[0]?.people ?? 0),
    topPages: pages.map((p) => ({ label: p.label, value: Number(p.value) })) as Ranked[],
    topReferrers: referrers.map((p) => ({ label: p.label, value: Number(p.value) })) as Ranked[],
    totalVisits: visits.reduce((s, v) => s + v.views, 0),
    totalPeople: visits.reduce((s, v) => s + v.people, 0),
  };
}
