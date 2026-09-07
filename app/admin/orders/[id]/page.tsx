import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Phone, User } from "lucide-react";
import { Badge, SectionDivider, buttonClass } from "@/components/ui/primitives";
import { PageCrumb } from "@/components/admin/page-crumb";
import { Thumb } from "@/components/admin/product-elements";
import { db } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";

import {
  orderStatusTone,
  paymentLabel,
  paymentStatusStyle,
  statusLabel,
} from "@/lib/order-status-style";
import { updateOrderStatus, updatePaymentStatus } from "../actions";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "AWAITING_VERIFICATION", "CONFIRMED", "FAILED"];

/** A line in the totals block. The last one is the merchant's alone. */
function Total({
  label,
  value,
  strong,
  hint,
}: {
  label: string;
  value: string;
  strong?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className={strong ? "font-medium text-ink" : "text-ink-soft"}>
        {label}
        {hint && <span className="ml-1.5 text-xs text-ink-faint">{hint}</span>}
      </span>
      <span className={strong ? "font-medium tabular-nums text-ink" : "tabular-nums text-ink-soft"}>
        {value}
      </span>
    </div>
  );
}

/** One fact about the customer, with a way to act on it where there is one. */
function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">{label}</p>
      <div className="mt-0.5 text-sm text-ink">{children}</div>
    </div>
  );
}

export default async function AdminOrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  // Prices in the store's own currency rather than in rupees, which every
  // screen printed regardless of what Settings said.
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const { id } = await props.params;
  const [order, { timeZone }] = await Promise.all([
    (await db()).order.findUnique({
      where: { id },
      // The product is only for the thumbnail and the link back. Every fact the
      // line needs — its title, size, colour, price and cost — was snapshotted
      // when the order was placed, so a deleted product loses the picture and
      // nothing else.
      include: { items: { include: { product: { select: { id: true, images: true } } } } },
    }),
    getStoreSettings(),
  ]);
  if (!order || order.deletedAt) notFound();

  const orderProfit = order.items.reduce((sum, i) => sum + (i.price - i.costPrice) * i.quantity, 0);
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  // Formatted here, not in a client component: a date formatted in the browser
  // disagrees with the server that rendered it, and React calls that an error.
  const placed = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(order.createdAt);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <PageCrumb label={`Order ${order.id}`} />
          <p className="font-mono text-sm text-ink">{order.id}</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Placed {placed} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Badge tone={orderStatusTone(order.orderStatus)}>{statusLabel(order.orderStatus)}</Badge>
          <DeleteOrderButton id={order.id} />
        </div>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-3">
        <div className="space-y-2.5 lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-[13px] font-semibold text-ink">What was ordered</h3>
            <div className="mt-2.5 divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2">
                  <Thumb src={item.product?.images[0]} size="row" />
                  <div className="min-w-0 flex-1">
                    {item.product ? (
                      <Link
                        href={`/admin/products/${item.product.id}`}
                        className="truncate text-sm font-medium text-ink underline-offset-2 hover:underline"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium text-ink">{item.title}</p>
                    )}
                    <p className="truncate text-xs text-ink-faint">
                      {[item.size, item.color].filter(Boolean).join(" · ") || "No options"}
                      {" · "}
                      {money(item.price)} each
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs tabular-nums text-ink-soft">
                    &times;{item.quantity}
                  </span>
                  <span className="w-24 flex-shrink-0 text-right text-sm font-medium tabular-nums text-ink">
                    {money(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-2.5 space-y-1 border-t border-border pt-2.5">
              <Total label="Subtotal" value={money(order.subtotal)} />
              <Total
                label="Shipping"
                value={order.shippingFee === 0 ? "Free" : money(order.shippingFee)}
              />
              <Total label="Total" value={money(order.total)} strong />
            </div>
          </div>

          <SectionDivider
            title="Only you can see this"
            description="Cost and profit are taken from what each product cost when the order was placed, so they stay right even if you change a price later."
          />
          <div className="rounded-xl border border-border bg-surface p-4">
            <Total label="Profit on this order" value={money(orderProfit)} strong />
            <Total
              label="Margin"
              value={order.total > 0 ? `${((orderProfit / order.total) * 100).toFixed(0)}%` : "—"}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-[13px] font-semibold text-ink">Where it is going</h3>
            <div className="mt-2.5 space-y-2.5">
              <Detail label="Customer">
                {order.customerId ? (
                  <Link
                    href={`/admin/customers/${order.customerId}`}
                    className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
                  >
                    <User className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                    {order.customerName}
                  </Link>
                ) : (
                  order.customerName
                )}
              </Detail>
              <Detail label="Email">
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="inline-flex items-center gap-1.5 break-all underline-offset-2 hover:underline"
                >
                  <Mail className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                  {order.customerEmail}
                </a>
              </Detail>
              <Detail label="Phone">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                  {order.customerPhone}
                </a>
              </Detail>
              <Detail label="Address">
                <span className="block leading-snug">
                  {order.shippingLine1}
                  {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
                  <br />
                  {order.shippingCity}, {order.shippingProvince} {order.shippingPostalCode}
                </span>
              </Detail>
              {order.notes && (
                <Detail label="Note from the customer">
                  <span className="block leading-snug text-ink-soft">{order.notes}</span>
                </Detail>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-[13px] font-semibold text-ink">Progress</h3>
            <form action={updateOrderStatus} className="mt-2.5 space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Order status</span>
                <select name="orderStatus" defaultValue={order.orderStatus} className="input">
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Save status
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-ink">Payment</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${paymentStatusStyle(order.paymentStatus)}`}
              >
                {statusLabel(order.paymentStatus)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Paid by {paymentLabel(order.paymentMethod)}</p>
            <form action={updatePaymentStatus} className="mt-2.5 space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Payment status</span>
                <select name="paymentStatus" defaultValue={order.paymentStatus} className="input">
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={buttonClass("secondary", "sm")}>
                Save payment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
