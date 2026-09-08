import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyPayment } from "@/lib/payments/verify";
import { isGatewayProvider } from "@/lib/payments/providers";

/**
 * Where a payment provider posts its notification.
 *
 * This endpoint believes nothing it is sent. It reads one value out of the
 * request — which basket the notification is about — and hands it to
 * `verifyPayment`, which asks the provider directly. Everything else in the
 * body is ignored: the amount, the status, the transaction id, and the field
 * PayFast calls SIGNATURE, which is not one.
 *
 * That is not caution for its own sake. This URL is public and unauthenticated
 * because it has to be, and the widely-copied integrations treat its body as
 * proof of payment — the most-used PayFast library marks an order paid on any
 * POST containing a transaction id. Anyone who learns such a URL gets free
 * goods. Here, knowing the URL and even knowing a valid reference buys nothing,
 * because the answer comes from the provider over a separate connection
 * authenticated with the merchant's own credentials.
 *
 * Always answers 200. A provider that gets an error retries, sometimes for
 * days, and there is nothing it could usefully do differently; and a stranger
 * probing for valid references learns nothing from a uniform reply.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Field names providers use for "the merchant's own reference". */
const REFERENCE_FIELDS = [
  "basket_id",
  "BASKET_ID",
  "order_no",
  "ORDER_NO",
  "reference",
  "REFERENCE",
  "merchant_reference",
];

async function readReference(request: Request): Promise<string | null> {
  const url = new URL(request.url);
  for (const name of REFERENCE_FIELDS) {
    const value = url.searchParams.get(name);
    if (value) return value;
  }

  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      for (const name of REFERENCE_FIELDS) {
        const value = body?.[name];
        if (typeof value === "string" && value) return value;
      }
      return null;
    }
    // Everything else is treated as a form, which is what these providers send.
    const form = await request.formData();
    for (const name of REFERENCE_FIELDS) {
      const value = form.get(name);
      if (typeof value === "string" && value) return value;
    }
  } catch {
    // A body we cannot parse is a body we do not need. The sweep and the
    // customer's own return to the site will both catch this payment.
    return null;
  }
  return null;
}

async function handle(request: Request, provider: string): Promise<NextResponse> {
  const ok = NextResponse.json({ received: true });

  if (!isGatewayProvider(provider.toUpperCase())) return ok;

  const ip = await clientIp();
  const limited = await rateLimit("paymentCallback", ip);
  if (!limited.ok) return ok;

  const reference = await readReference(request);
  if (!reference || reference.length > 200) return ok;

  try {
    await verifyPayment(reference, "callback", ip);
  } catch (err) {
    // Swallowed on purpose. The provider can do nothing with our stack trace,
    // and the payment is still recoverable: the customer's return to the site
    // verifies it again, and so does the sweep.
    console.error("[payments] callback verification failed", err);
  }

  return ok;
}

export async function POST(request: Request, ctx: RouteContext<"/api/payments/[provider]/callback">) {
  return handle(request, (await ctx.params).provider);
}

/** Some providers send their notification as a GET. */
export async function GET(request: Request, ctx: RouteContext<"/api/payments/[provider]/callback">) {
  return handle(request, (await ctx.params).provider);
}
