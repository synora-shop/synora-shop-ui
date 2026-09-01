import Link from "next/link";
import { requireShop } from "@/lib/data/shop";
import { registryBusinessType } from "@/lib/themes/business-type";
import { vocabularyFor } from "@/lib/themes/vocabulary";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Package,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/data/shop";
import { formatPKR } from "@/lib/utils";
import { getStoreSettings } from "@/lib/data/settings";
import { findBrokenMenuLinks } from "@/lib/data/broken-links";
import { Badge, ButtonLink, Card, EmptyState, PageHeader, Stat } from "@/components/ui/primitives";
import { orderStatusTone, statusLabel } from "@/lib/order-status-style";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // The same words the sidebar uses. A restaurant seeing "Dishes" on the left
  // and "Add product" on the right is the admin disagreeing with itself.
  const words = vocabularyFor(registryBusinessType((await requireShop()).businessType));

  const { lowStockThreshold } = await getStoreSettings();

  // Batched in small groups on purpose. Firing every query at once exhausted
  // the connection pool on this page once already, and a dashboard is exactly
  // the page where that is most likely — it reads a little of everything.
  const [orderCount, pendingCount, productCount, lowStock] = await Promise.all([
    (await db()).order.count({ where: { deletedAt: null } }),
    (await db()).order.count({ where: { deletedAt: null, orderStatus: "PENDING" } }),
    (await db()).product.count({ where: { deletedAt: null } }),
    (await db()).productVariant.count({
      where: { stock: { lt: lowStockThreshold }, product: { deletedAt: null } },
    }),
  ]);

  const [revenueAgg, soldItems, recentOrders] = await Promise.all([
    (await db()).order.aggregate({
      _sum: { total: true },
      where: { orderStatus: { not: "CANCELLED" }, deletedAt: null },
    }),
    // Cost and profit aren't a plain SQL sum — price and costPrice are per line
    // item — so the lines are reduced in JS. Binning or restoring an order
    // changes this on the next read, with no separate bookkeeping to drift.
    (await db()).orderItem.findMany({
      where: { order: { orderStatus: { not: "CANCELLED" }, deletedAt: null } },
      select: { price: true, costPrice: true, quantity: true },
    }),
    (await db()).order.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, customerName: true, total: true, orderStatus: true, createdAt: true },
    }),
  ]);

  const brokenLinks = await findBrokenMenuLinks();

  const totalRevenue = revenueAgg._sum.total ?? 0;
  const totalCost = soldItems.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
  const totalProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  /**
   * Things that want a decision, newest problem first.
   *
   * A dashboard that shows seven equal numbers makes you do the triage. This
   * band exists only when something actually needs attention, so an empty one
   * is a genuine "nothing to do" rather than a row of zeroes to scan past.
   */
  const attention = [
    pendingCount > 0 && {
      href: "/admin/orders?status=PENDING",
      icon: Clock,
      tone: "warn" as const,
      title: pendingCount === 1 ? "1 order awaiting action" : `${pendingCount} orders awaiting action`,
      detail: "Confirm or cancel these so customers aren't left waiting.",
    },
    lowStock > 0 && {
      href: "/admin/products",
      icon: AlertTriangle,
      tone: "warn" as const,
      title: lowStock === 1 ? "1 variant is low on stock" : `${lowStock} variants are low on stock`,
      detail: `Fewer than ${lowStockThreshold} left. Restock or hide them before they sell out.`,
    },
    brokenLinks.length > 0 && {
      href: "/admin/redirects",
      icon: AlertTriangle,
      tone: "bad" as const,
      title:
        brokenLinks.length === 1
          ? "1 menu link leads nowhere"
          : `${brokenLinks.length} menu links lead nowhere`,
      detail: "Customers clicking these get a Not Found page.",
    },
  ].filter(Boolean) as {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "warn" | "bad";
    title: string;
    detail: string;
  }[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard (test deploy)"
        description="Everything that needs a decision, and how the store is doing."
        actions={
          <>
            <ButtonLink href="/admin/customize" variant="secondary" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Customize store
            </ButtonLink>
            <ButtonLink href="/admin/products/new" variant="primary" size="sm">
              {words.addProduct}
            </ButtonLink>
          </>
        }
      />

      {attention.length > 0 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Needs attention
          </h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {attention.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <span
                  className={
                    item.tone === "bad"
                      ? "mt-0.5 flex-shrink-0 rounded-lg bg-rose-bg p-1.5 text-rose"
                      : "mt-0.5 flex-shrink-0 rounded-lg bg-amber-bg p-1.5 text-amber"
                  }
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink-soft">
                    {item.detail}
                  </span>
                </span>
                <ArrowRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Money
        </h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Stat label="Revenue" value={formatPKR(totalRevenue)} hint="Excludes cancelled orders" />
          <Stat label="Cost of goods" value={formatPKR(totalCost)} hint="Never shown to customers" />
          <Stat
            label="Profit"
            value={formatPKR(totalProfit)}
            hint={totalRevenue > 0 ? `${margin}% margin` : "No sales yet"}
            tone={totalProfit > 0 ? "good" : totalProfit < 0 ? "bad" : "neutral"}
          />
        </div>
      </section>

      <section>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          Catalog
        </h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Stat label="Orders" value={orderCount} href="/admin/orders" />
          <Stat label={words.products} value={productCount} href="/admin/products" />
          <Stat
            label={`${words.lowStock} (< ${lowStockThreshold})`}
            value={lowStock}
            href="/admin/products"
          />
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
            Recent orders
          </h2>
          {recentOrders.length > 0 && (
            <Link href="/admin/orders" className="text-xs text-brand-600 hover:underline">
              All orders
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="Once someone checks out, their order shows up here."
              action={
                <ButtonLink href="/admin/customize" variant="secondary" size="sm">
                  <Package className="h-3.5 w-3.5" />
                  Set up your storefront
                </ButtonLink>
              }
            />
          </div>
        ) : (
          <Card className="mt-2 divide-y divide-border overflow-hidden">
            {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle"
                >
                  <span className="font-mono text-xs tabular-nums text-ink-faint">#{order.id}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{order.customerName}</span>
                  <Badge tone={orderStatusTone(order.orderStatus)}>
                    {statusLabel(order.orderStatus)}
                  </Badge>
                  <span className="font-mono text-sm tabular-nums">{formatPKR(order.total)}</span>
                </Link>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
