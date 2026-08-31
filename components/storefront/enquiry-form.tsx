"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitEnquiry } from "@/app/enquiry/actions";
import { useToast } from "@/components/ui/toast";
import type { CustomField } from "@/lib/product-kind";
import { cn } from "@/lib/utils";

/**
 * The form a customer uses to ask about a bulk or made-to-order product.
 *
 * On success it swaps itself for a confirmation rather than clearing and
 * sitting there looking untouched — a form that empties itself is ambiguous
 * about whether it sent, and this one has no order number to fall back on.
 */
export function EnquiryForm({
  productId,
  productTitle,
  minOrderQuantity,
  askQuantity,
  customFields,
}: {
  productId: string;
  productTitle: string;
  minOrderQuantity?: number | null;
  /** Bulk products ask how many; made-to-order ones usually don't. */
  askQuantity: boolean;
  customFields: CustomField[];
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const toast = useToast();

  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    try {
      const details: Record<string, string> = {};
      for (const field of customFields) details[field.id] = values[`custom:${field.id}`] ?? "";

      const result = await submitEnquiry({
        productId,
        name: values.name ?? "",
        email: values.email ?? "",
        phone: values.phone ?? "",
        company: values.company,
        quantity: askQuantity && values.quantity ? Number(values.quantity) : null,
        message: values.message ?? "",
        details,
      });

      if (result.ok) setSent(true);
      else toast.error(result.error);
    } catch {
      toast.error("Couldn't send that just now. Please try again, or message us on WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-green/30 bg-green-bg p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-green" />
        <p className="mt-3 font-medium">Enquiry sent</p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-snug text-ink-soft">
          We&apos;ve got your details for <strong>{productTitle}</strong> and will get back to you
          with a quote. Check your email, including the spam folder, just in case.
        </p>
      </div>
    );
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-300";
  const label = "text-xs font-medium text-ink";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="enq-name">Your name</label>
          <input id="enq-name" required autoComplete="name" className={input}
            value={values.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="enq-company">Company <span className="text-ink-faint">(optional)</span></label>
          <input id="enq-company" autoComplete="organization" className={input}
            value={values.company ?? ""} onChange={(e) => set("company", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="enq-email">Email</label>
          <input id="enq-email" type="email" required autoComplete="email" className={input}
            value={values.email ?? ""} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="enq-phone">Phone</label>
          <input id="enq-phone" type="tel" required autoComplete="tel" placeholder="03xx xxxxxxx" className={input}
            value={values.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
        </div>
      </div>

      {askQuantity && (
        <div>
          <label className={label} htmlFor="enq-qty">How many units?</label>
          <input
            id="enq-qty" type="number" min={minOrderQuantity ?? 1} className={cn(input, "sm:max-w-40")}
            value={values.quantity ?? ""} onChange={(e) => set("quantity", e.target.value)}
          />
          {minOrderQuantity ? (
            <p className="mt-1 text-xs text-ink-soft">
              Minimum order is {minOrderQuantity} units.
            </p>
          ) : null}
        </div>
      )}

      {customFields.length > 0 && (
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Your measurements
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {customFields.map((field) => {
              const id = `custom:${field.id}`;
              return (
                <div key={field.id} className={field.kind === "textarea" ? "sm:col-span-2" : ""}>
                  <label className={label} htmlFor={id}>
                    {field.label}
                    {!field.required && <span className="text-ink-faint"> (optional)</span>}
                  </label>
                  {field.kind === "textarea" ? (
                    <textarea id={id} rows={3} required={field.required} className={input}
                      value={values[id] ?? ""} onChange={(e) => set(id, e.target.value)} />
                  ) : field.kind === "select" ? (
                    <select id={id} required={field.required} className={input}
                      value={values[id] ?? ""} onChange={(e) => set(id, e.target.value)}>
                      <option value="">Choose…</option>
                      {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input id={id} type={field.kind === "number" ? "number" : "text"}
                      required={field.required} className={input}
                      value={values[id] ?? ""} onChange={(e) => set(id, e.target.value)} />
                  )}
                  {field.help && <p className="mt-1 text-xs leading-snug text-ink-soft">{field.help}</p>}
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label className={label} htmlFor="enq-message">What do you need?</label>
        <textarea
          id="enq-message" rows={4} required className={input}
          placeholder="Tell us about timelines, fabric, delivery city, anything that helps us quote accurately."
          value={values.message ?? ""} onChange={(e) => set("message", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-900 disabled:opacity-60 sm:w-auto"
      >
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {sending ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-xs leading-snug text-ink-soft">
        We use your details only to answer this enquiry.
      </p>
    </form>
  );
}
