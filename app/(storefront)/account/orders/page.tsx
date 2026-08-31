import { redirect } from "next/navigation";
import { currentCustomer } from "@/lib/data/customer";
import Link from "next/link";
import { db } from "@/lib/data/shop";
import { Container } from "@/components/ui/container";
import { formatPKR } from "@/lib/utils";
import { getSiteText, text, type SiteTextKey } from "@/lib/site-text";
import type { OrderStatus } from "@/lib/generated/prisma/client";

const STATUS_KEY: Record<OrderStatus, SiteTextKey> = {
  PENDING: "orderStatus.pending",
  CONFIRMED: "orderStatus.confirmed",
  PACKED: "orderStatus.packed",
  SHIPPED: "orderStatus.shipped",
  DELIVERED: "orderStatus.delivered",
  CANCELLED: "orderStatus.cancelled",
};

export default async function OrderHistoryPage() {
  const me = await currentCustomer();
  if (!me) redirect("/account/login?callbackUrl=/account/orders");

  const [orders, siteText] = await Promise.all([
    (await db()).order.findMany({
      where: { customerId: me.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    }),
    getSiteText(),
  ]);

  return (
    <Container className="py-16">
      <h1 className="font-serif text-3xl font-semibold text-ink">
        {text(siteText, "account.orderHistoryHeading")}
      </h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-ink-soft">
          {text(siteText, "account.noOrdersYet")}{" "}
          <Link href="/shop" className="text-brand-600 underline-scribble">
            {text(siteText, "account.startShopping")}
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/order-confirmation/${order.id}`}
              className="block rounded-lg border border-border bg-white p-5 hover:border-brand-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-ink-soft">{order.id}</p>
                  <p className="text-sm text-ink-soft">
                    {order.items.length} item{order.items.length !== 1 && "s"} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-PK", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-ink">{formatPKR(order.total)}</p>
                  <p className="text-xs text-brand-600">
                    {text(siteText, STATUS_KEY[order.orderStatus])}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
