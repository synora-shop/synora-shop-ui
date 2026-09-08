"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react";
import { retryPayment } from "@/app/(storefront)/order-confirmation/actions";

/**
 * What happened to the money, said plainly.
 *
 * A customer coming back from a payment page has one question, and the page
 * must not guess at the answer. The state shown here is the order's own, after
 * the server has asked the provider — never inferred from the fact that the
 * customer arrived on a success URL, which is a thing anybody can type.
 */
export type PaymentState = "paid" | "waiting" | "failed" | "checking" | "manual";

const LOOK: Record<
  Exclude<PaymentState, "manual">,
  { icon: typeof CheckCircle2; tone: string; title: string }
> = {
  paid: { icon: CheckCircle2, tone: "text-green", title: "Payment received" },
  waiting: { icon: Clock, tone: "text-amber-600", title: "Waiting for your payment" },
  checking: { icon: Clock, tone: "text-amber-600", title: "Still checking with your bank" },
  failed: { icon: XCircle, tone: "text-red-600", title: "Payment not completed" },
};

export function PaymentStatus({
  state,
  orderId,
  reference,
  message,
  canRetry,
}: {
  state: PaymentState;
  orderId: string;
  /**
   * The payment reference from the return URL.
   *
   * What stands in for a session on a guest order: without it there is no Try
   * paying again, because an order id alone is five guessable characters.
   */
  reference: string | null;
  message: string;
  /** Only while the order is unpaid and still holding its stock. */
  canRetry: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state === "manual") return null;
  const { icon: Icon, tone, title } = LOOK[state];

  async function tryAgain() {
    setBusy(true);
    setError(null);
    const result = await retryPayment(orderId, reference ?? "");
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      return;
    }
    // The same top-level POST the checkout uses. Built here rather than
    // followed as a link because these gateways take their parameters by post.
    const form = document.createElement("form");
    form.method = "POST";
    form.action = result.url;
    form.style.display = "none";
    for (const [name, value] of Object.entries(result.fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div className="mx-auto mt-6 max-w-xl rounded-lg border border-border bg-white p-5 text-left notice-in">
      <p className={`flex items-center gap-2 text-sm font-medium ${tone}`}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        {title}
      </p>
      <p className="mt-2 text-sm text-ink-soft">{message}</p>

      {canRetry && reference && (
        <>
          <button
            type="button"
            onClick={tryAgain}
            disabled={busy}
            className="lift mt-4 rounded-full bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {busy ? "Taking you to payment…" : "Try paying again"}
          </button>
          {error && <p className="mt-2 text-sm text-red-600 shake">{error}</p>}
        </>
      )}
    </div>
  );
}
