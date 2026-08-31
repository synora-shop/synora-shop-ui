"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { cn, formatPKR } from "@/lib/utils";
import { previewDiscount } from "@/app/(storefront)/checkout/actions";
import { CITIES } from "@/lib/cities";
import { isValidEmail, isValidPakistaniPhone } from "@/lib/validation";
import { ENABLED_PAYMENT_METHODS as PAYMENT_METHODS } from "@/lib/payment-methods";

type Settings = {
  shippingFee: number;
  freeShippingThreshold: number | null;
  bankAccountDetails: string | null;
  jazzcashAccountDetails: string | null;
  easypaisaAccountDetails: string | null;
};

// Pre-fills the form for a signed-in customer, from their account and most
// recent saved address (see app/(storefront)/checkout/page.tsx).
type InitialValues = {
  name?: string;
  email?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
};

type Labels = {
  contactShippingLegend?: string;
  paymentMethodLegend?: string;
  paymentInstructionsNote?: string;
  orderSummary?: string;
  subtotal?: string;
  shipping?: string;
  total?: string;
  discount?: string;
  discountPlaceholder?: string;
  apply?: string;
  applying?: string;
  freeShipping?: string;
  emailError?: string;
  phoneError?: string;
  genericError?: string;
};

export function CheckoutForm({
  settings,
  initialValues,
  placeOrderLabel = "Place Order",
  placingOrderLabel = "Placing order…",
  labels = {},
}: {
  settings: Settings;
  initialValues?: InitialValues;
  placeOrderLabel?: string;
  placingOrderLabel?: string;
  labels?: Labels;
}) {
  const {
    contactShippingLegend = "Contact & Shipping",
    paymentMethodLegend = "Payment Method",
    paymentInstructionsNote = "Please send your payment screenshot via WhatsApp with your order ID once placed.",
    orderSummary = "Order Summary",
    subtotal: subtotalLabel = "Subtotal",
    shipping: shippingLabel = "Shipping",
    total: totalLabel = "Total",
    discount: discountLabel = "Discount code",
    discountPlaceholder = "Enter a code",
    apply: applyLabel = "Apply",
    applying: applyingLabel = "Checking…",
    freeShipping = "Free",
    emailError = "Please enter a valid email address.",
    phoneError = "Please enter a valid Pakistani phone number, e.g. 03XXXXXXXXX.",
    genericError = "Something went wrong",
  } = labels;
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clear = useCartStore((s) => s.clear);

  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PAYMENT_METHODS)[number]["value"]>("COD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The applied discount, as the server priced it. Held rather than recomputed
  // here on purpose: the browser has no business deciding what a code is worth,
  // and the order re-quotes it again on submit anyway.
  const [discount, setDiscount] = useState<{
    code: string;
    saving: number;
    description: string;
  } | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);

  const shippingFee =
    settings.freeShippingThreshold != null && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingFee;
  const saving = discount?.saving ?? 0;
  // Never below zero on screen, matching what the server will charge.
  const total = Math.max(0, subtotal + shippingFee - saving);

  async function applyCode() {
    const code = codeInput.trim();
    if (!code) return;
    setCheckingCode(true);
    setCodeError(null);
    const result = await previewDiscount(
      code,
      items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
    );
    setCheckingCode(false);
    if (!result.ok) {
      setDiscount(null);
      setCodeError(result.error);
      return;
    }
    setDiscount({ code: result.code, saving: result.saving, description: result.description });
    setCodeInput("");
  }

  const instructions: Record<string, string | null> = {
    BANK_TRANSFER: settings.bankAccountDetails,
    JAZZCASH: settings.jazzcashAccountDetails,
    EASYPAISA: settings.easypaisaAccountDetails,
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const customerEmail = String(form.get("email"));
    const customerPhone = String(form.get("phone"));

    if (!isValidEmail(customerEmail)) {
      setError(emailError);
      setSubmitting(false);
      return;
    }
    if (!isValidPakistaniPhone(customerPhone)) {
      setError(phoneError);
      setSubmitting(false);
      return;
    }

    const payload = {
      customerName: String(form.get("name")),
      customerEmail,
      customerPhone,
      shippingLine1: String(form.get("line1")),
      shippingLine2: String(form.get("line2") || ""),
      shippingCity: String(form.get("city")),
      shippingPostalCode: String(form.get("postalCode") || ""),
      paymentMethod,
      notes: String(form.get("notes") || ""),
      discountCode: discount?.code,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to place order");

      clear();
      router.push(`/order-confirmation/${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : genericError);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-10 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <fieldset className="space-y-4">
          <legend className="mb-2 font-serif text-lg font-semibold text-ink">
            {contactShippingLegend}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="name"
              autoComplete="name"
              defaultValue={initialValues?.name}
              required
              placeholder="Full name"
              className="input"
            />
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              defaultValue={initialValues?.phone}
              required
              placeholder="Phone (03xxxxxxxxx)"
              className="input"
            />
          </div>
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={initialValues?.email}
            required
            placeholder="Email"
            className="input"
          />
          <input
            name="line1"
            autoComplete="address-line1"
            defaultValue={initialValues?.line1}
            required
            placeholder="Address line 1"
            className="input"
          />
          <input
            name="line2"
            autoComplete="address-line2"
            defaultValue={initialValues?.line2}
            placeholder="Address line 2 (optional)"
            className="input"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              name="city"
              autoComplete="address-level2"
              required
              defaultValue={initialValues?.city ?? ""}
              className="input"
            >
              <option value="" disabled>
                City
              </option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              name="postalCode"
              autoComplete="postal-code"
              defaultValue={initialValues?.postalCode}
              placeholder="Postal code (optional)"
              className="input"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 font-serif text-lg font-semibold text-ink">
            {paymentMethodLegend}
          </legend>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-lg border p-4",
                paymentMethod === m.value ? "border-brand-500 bg-brand-50" : "border-border"
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === m.value}
                  onChange={() => setPaymentMethod(m.value)}
                />
                <span className="text-sm font-medium">{m.label}</span>
              </span>
              {paymentMethod === m.value && instructions[m.value] && (
                <p className="ml-6 whitespace-pre-line text-xs text-ink-soft">
                  {instructions[m.value]}
                  <br />
                  {paymentInstructionsNote}
                </p>
              )}
            </label>
          ))}
        </fieldset>

        <textarea
          name="notes"
          placeholder="Order notes (optional)"
          rows={3}
          className="input"
        />
      </div>

      <div className="h-fit rounded-lg border border-border bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-ink">{orderSummary}</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>{subtotalLabel}</span>
            <span>{formatPKR(subtotal)}</span>
          </div>
          {discount && (
            <div className="flex justify-between text-green">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-xs uppercase">{discount.code}</span>
                <span className="text-xs text-ink-faint">{discount.description}</span>
                <button
                  type="button"
                  onClick={() => setDiscount(null)}
                  aria-label={`Remove discount ${discount.code}`}
                  className="text-xs text-ink-faint underline-scribble hover:text-ink"
                >
                  remove
                </button>
              </span>
              <span>&minus;{formatPKR(discount.saving)}</span>
            </div>
          )}
          <div className="flex justify-between text-ink-soft">
            <span>{shippingLabel}</span>
            <span>{shippingFee === 0 ? freeShipping : formatPKR(shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium text-ink">
            <span>{totalLabel}</span>
            <span>{formatPKR(total)}</span>
          </div>
        </div>

        {/* Below the totals, because a discount field above them invites
            everyone to go hunting for a code they do not have. */}
        {!discount && (
          <div className="mt-4 border-t border-border pt-4">
            <label htmlFor="discount-code" className="block text-xs font-medium text-ink-soft">
              {discountLabel}
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="discount-code"
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setCodeError(null);
                }}
                // Enter inside the checkout form would submit the order, which
                // is emphatically not what pressing it in this box means.
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCode();
                  }
                }}
                placeholder={discountPlaceholder}
                aria-invalid={codeError ? true : undefined}
                className="input h-9 flex-1 font-mono text-sm uppercase"
              />
              <button
                type="button"
                onClick={applyCode}
                disabled={checkingCode || !codeInput.trim()}
                className="rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingCode ? applyingLabel : applyLabel}
              </button>
            </div>
            {codeError && <p className="mt-1.5 text-xs text-rose">{codeError}</p>}
          </div>
        )}

        {error && <p className="mt-4 text-sm text-rose">{error}</p>}

        <button
          type="submit"
          disabled={submitting || items.length === 0}
          className="mt-6 w-full rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? placingOrderLabel : placeOrderLabel}
        </button>
      </div>
    </form>
  );
}
