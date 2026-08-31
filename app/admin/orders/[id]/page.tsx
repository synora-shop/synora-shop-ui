import { notFound } from "next/navigation";
import { db } from "@/lib/data/shop";
import { formatPKR, cn } from "@/lib/utils";
import { orderStatusStyle, paymentStatusStyle } from "@/lib/order-status-style";
import { updateOrderStatus, updatePaymentStatus } from "../actions";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "AWAITING_VERIFICATION", "CONFIRMED", "FAILED"];

export default async function AdminOrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  const { id } = await props.params;
  const order = await (await db()).order.findUnique({ where: { id }, include: { items: true } });
  if (!order || order.deletedAt) notFound();

  const orderProfit = order.items.reduce((sum, i) => sum + (i.price - i.costPrice) * i.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Order Detail</h1>
          <p className="mt-1 font-mono text-sm text-ink-soft">{order.id}</p>
        </div>
        <DeleteOrderButton id={order.id} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Items</h2>
            <div className="mt-3 divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    {item.title} ({item.size}/{item.color}) x{item.quantity}
                  </span>
                  <span className="flex-shrink-0">{formatPKR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{formatPKR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Shipping</span>
                <span>{formatPKR(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatPKR(order.total)}</span>
              </div>
              <div className="flex justify-between text-brand-600">
                <span>Profit (hidden from customer)</span>
                <span>{formatPKR(orderProfit)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <h2 className="font-serif text-lg font-semibold">Customer & Shipping</h2>
            <div className="mt-3 space-y-1 text-sm text-ink-soft">
              <p>{order.customerName}</p>
              <p>{order.customerEmail}</p>
              <p>{order.customerPhone}</p>
              <p>
                {order.shippingLine1}
                {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingCity},{" "}
                {order.shippingProvince} {order.shippingPostalCode}
              </p>
              {order.notes && <p className="mt-2 italic">Notes: {order.notes}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Order Status</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                  orderStatusStyle(order.orderStatus)
                )}
              >
                {order.orderStatus}
              </span>
            </div>
            <form action={updateOrderStatus} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select name="orderStatus" defaultValue={order.orderStatus} className="input min-w-0 flex-1">
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
              >
                Update
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">Payment</h2>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                  paymentStatusStyle(order.paymentStatus)
                )}
              >
                {order.paymentStatus}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Method: {order.paymentMethod}</p>
            <form action={updatePaymentStatus} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <select name="paymentStatus" defaultValue={order.paymentStatus} className="input min-w-0 flex-1">
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="shrink-0 rounded-full bg-brand-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
