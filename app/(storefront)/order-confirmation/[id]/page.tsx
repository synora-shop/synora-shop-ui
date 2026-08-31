import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/data/shop";
import { formatPKR } from "@/lib/utils";

/**
 * The page a customer lands on straight after checking out.
 *
 * It shows their name, full delivery address, phone number, email and what
 * they bought, and it is reachable by anyone who knows the order id — there is
 * no session here, because checkout is a guest flow.
 *
 * Scoped to the shop being browsed. It used to read the order by id alone, so
 * an id typed into one store's URL rendered an order belonging to any other
 * store on the platform.
 *
 * Worth being plain about what this does not fix: order ids are five
 * characters (lib/order-id.ts), which is around sixty million combinations —
 * small enough to walk through if somebody wants to badly enough. Scoping
 * confines that to one shop's orders rather than every shop's, but the real
 * answer is a per-order token in the URL, which is a change to checkout rather
 * than to this page.
 */
export default async function OrderConfirmationPage(props: PageProps<"/order-confirmation/[id]">) {
  const { id } = await props.params;
  const order = await (await db()).order.findFirst({ where: { id }, include: { items: true } });
  if (!order) notFound();

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green" />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">Thank you, {order.customerName}!</h1>
        <p className="mt-2 text-ink-soft">
          Your order has been placed. Order ID: <span className="font-mono">{order.id}</span>
        </p>
        {order.paymentMethod !== "COD" && (
          <p className="mt-2 text-sm text-brand-600">
            Please send your payment screenshot via WhatsApp with this Order ID to confirm your order faster.
          </p>
        )}
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink">Order Summary</h2>
        <div className="mt-4 divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.title} ({item.size}/{item.color}) x{item.quantity}
              </span>
              <span>{formatPKR(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{formatPKR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? "Free" : formatPKR(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between font-medium text-ink">
            <span>Total</span>
            <span>{formatPKR(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop" className="text-sm font-medium text-brand-600 underline-scribble">
          Continue Shopping
        </Link>
      </div>
    </Container>
  );
}
