import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { db } from "@/lib/data/shop";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";
import { verifyPayment } from "@/lib/payments/verify";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isGatewayProvider } from "@/lib/payments/providers";
import { PaymentStatus, type PaymentState } from "@/components/storefront/payment-status";


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
// Never cached: this page asks a payment provider what happened and renders the
// answer. A cached copy would show one customer another's payment state.
export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage(props: PageProps<"/order-confirmation/[id]">) {
  // Prices in the store's own currency rather than in rupees, which every
  // screen printed regardless of what Settings said.
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const { id } = await props.params;
  const sp = await props.searchParams;
  const reference = typeof sp.ref === "string" ? sp.ref : null;

  // The customer is back from the gateway. Before anything is rendered, ask the
  // provider what actually happened.
  //
  // Landing on this URL proves nothing — it is a link, and anybody can type it.
  // So arriving here triggers the same verification a callback does, through
  // the same function, with the same rules. It exists as a second path because
  // a notification can be late or lost, and a customer staring at a page should
  // not have to wait for somebody else's retry schedule.
  if (reference) {
    const ip = await clientIp();
    const limited = await rateLimit("paymentCheck", ip);
    if (limited.ok) {
      await verifyPayment(reference, "return", ip).catch((err) =>
        console.error("[payments] return verification failed", err)
      );
    }
  }

  // Read after the verification, so the page shows the state it just settled
  // rather than the one it arrived with.
  const order = await (await db()).order.findFirst({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const online = isGatewayProvider(order.paymentMethod);
  const stillHolding = !!order.reservedUntil && order.reservedUntil.getTime() > Date.now();
  const state: PaymentState = !online
    ? "manual"
    : order.paymentStatus === "CONFIRMED"
      ? "paid"
      : order.orderStatus === "CANCELLED"
        ? "failed"
        : stillHolding
          ? "waiting"
          : "checking";

  const statusMessage =
    state === "paid"
      ? "Your payment has been confirmed with your bank. We're getting your order ready."
      : state === "waiting"
        ? "We haven't had confirmation from your bank yet. If you didn't finish paying, you can try again below — your order is held for a short while."
        : state === "checking"
          ? "Your bank hasn't confirmed this payment. If money has left your account, contact the store with your Order ID and they can check it."
          : "This payment wasn't completed in time and the order was cancelled. Nothing has been charged.";

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green" />
        <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">Thank you, {order.customerName}!</h1>
        <p className="mt-2 text-ink-soft">
          Your order has been placed. Order ID: <span className="font-mono">{order.id}</span>
        </p>
        {/*
          The screenshot line belongs to the transfer methods only. A customer
          who has just paid by card is being asked to do something meaningless,
          and a customer whose card failed is being told the order is fine.
        */}
        {!online && order.paymentMethod !== "COD" && (
          <p className="mt-2 text-sm text-brand-600">
            Please send your payment screenshot via WhatsApp with this Order ID to confirm your order faster.
          </p>
        )}
        <PaymentStatus
          state={state}
          orderId={order.id}
          reference={reference}
          message={statusMessage}
          canRetry={online && order.paymentStatus !== "CONFIRMED" && stillHolding}
        />
      </div>

      <div className="mx-auto mt-10 max-w-xl rounded-lg border border-border bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink">Order Summary</h2>
        <div className="mt-4 divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between py-2 text-sm">
              <span>
                {item.title} ({item.size}/{item.color}) x{item.quantity}
              </span>
              <span>{money(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>Shipping</span>
            <span>{order.shippingFee === 0 ? "Free" : money(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between font-medium text-ink">
            <span>Total</span>
            <span>{money(order.total)}</span>
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
