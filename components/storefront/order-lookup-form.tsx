"use client";

import { useState } from "react";
import { lookUpOrder } from "@/app/(storefront)/order-confirmation/lookup";
import { FieldError } from "@/components/ui/primitives";

/**
 * An order's page opened without its key: the order number and the email or
 * phone it was placed with, and a match goes to the order's link. See
 * lib/order-access.ts.
 */
export function OrderLookupForm({ id }: { id: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError(null);
        const r = await lookUpOrder(String(form.get("number") ?? ""), String(form.get("contact") ?? ""));
        if (r.ok) {
          window.location.assign(r.href);
          return;
        }
        setError(r.error);
        setBusy(false);
      }}
    >
      <input name="number" defaultValue={id} aria-label="Order number" placeholder="Order number" className="input" required />
      <input name="contact" aria-label="Email or phone" placeholder="Email or phone" autoComplete="email" className="input" required />
      {error && <FieldError>{error}</FieldError>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
      >
        Show my order
      </button>
    </form>
  );
}
