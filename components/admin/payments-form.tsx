"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { savePaymentMethods } from "@/app/admin/settings/actions";
import { useEditor } from "@/components/admin/use-editor";
import { useToast } from "@/components/ui/toast";
import { Fieldset } from "@/components/ui/primitives";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  ALL_PAYMENT_METHODS,
  type PaymentMethodValue,
  methodsMissingDetails,
  offeredMethods,
  toEnabledMethods,
} from "@/lib/payment-methods";

export type PaymentsState = {
  enabledPaymentMethods: string[];
  bankAccountDetails: string;
  jazzcashAccountDetails: string;
  easypaisaAccountDetails: string;
};

/**
 * How this shop takes money.
 *
 * The switches are the point. Which methods a customer could pick used to be a
 * constant in the source — `["COD"]`, "temporarily, per request" — while this
 * screen offered every merchant three boxes for their bank, JazzCash and
 * EasyPaisa details under the words "leave one blank and it is not offered".
 * Filling a box in offered nothing, and no merchant could turn a method on at
 * any price.
 *
 * So: a switch per method, its details underneath it, and the screen says
 * plainly when a method is on but cannot be shown yet. "I turned it on and
 * nothing happened" is the complaint this exists because of.
 */
export function PaymentsForm({ initial }: { initial: PaymentsState }) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, setPending] = useState(false);

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const enabled = toEnabledMethods(values.enabledPaymentMethods);

  const incomplete = methodsMissingDetails(enabled, values);
  const offered = offeredMethods(enabled, values);

  function toggle(method: PaymentMethodValue, on: boolean) {
    setValues((v) => {
      const next = on
        ? [...new Set([...v.enabledPaymentMethods, method])]
        : v.enabledPaymentMethods.filter((m) => m !== method);
      return { ...v, enabledPaymentMethods: next };
    });
  }

  function setDetails(field: string, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function save() {
    setPending(true);
    try {
      const result = await savePaymentMethods(values);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setSaved(values);
      toast.success("Saved");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  useEditor({ dirty, saving: pending, onSave: save, onDiscard: () => setValues(saved) });

  return (
    <div className="space-y-2.5">
      <Fieldset
        title="How customers pay"
        description="Turn on the ways you can actually take money. A customer sees exactly these at checkout, in this order, and nothing else."
      >
        <div className="space-y-3">
          {ALL_PAYMENT_METHODS.map((method) => {
            const on = enabled.includes(method.value);
            const missing = on && incomplete.some((m) => m.value === method.value);
            // Cash on delivery cannot be switched off while it is the only
            // thing left: a checkout with no payment method is a shop that
            // cannot take an order.
            const isLastOne = on && enabled.length === 1;

            return (
              <div key={method.value} className="rounded-lg border border-border p-3">
                <ToggleSwitch
                  inline
                  label={method.label}
                  description={method.hint}
                  checked={on}
                  disabled={isLastOne}
                  onChange={(next) => toggle(method.value, next)}
                />

                {on && method.detailsField && (
                  <div className="notice-in mt-2.5">
                    <label
                      htmlFor={`pm-${method.value}`}
                      className="mb-1.5 block text-xs font-medium text-ink"
                    >
                      What the customer is shown
                    </label>
                    <textarea
                      id={`pm-${method.value}`}
                      rows={2}
                      className="input"
                      value={String(values[method.detailsField as keyof PaymentsState] ?? "")}
                      onChange={(e) => setDetails(method.detailsField as string, e.target.value)}
                      placeholder="Account title, number, and anything else they need to send it"
                    />
                    {missing && (
                      <p className="notice-in mt-1.5 flex items-start gap-1.5 text-xs leading-snug font-medium text-amber">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        This is on, but with nothing here a customer who picks it
                        would not know where to send the money — so it is not
                        offered until you fill it in.
                      </p>
                    )}
                  </div>
                )}

                {isLastOne && (
                  <p className="mt-2 text-xs leading-snug text-ink-faint">
                    The only way to pay you have left. Turn another on before
                    switching this off.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Fieldset>

      <Fieldset
        title="What a customer sees"
        description="The checkout, as it stands right now. It updates as you change the switches above, before you save."
      >
        <ul className="space-y-1.5">
          {offered.map((m) => (
            <li key={m.value} className="flex items-center gap-2 text-sm text-ink">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green" aria-hidden />
              {m.label}
            </li>
          ))}
        </ul>
        {incomplete.length > 0 && (
          <p className="text-xs leading-snug text-ink-soft">
            {incomplete.map((m) => m.label).join(" and ")}{" "}
            {incomplete.length === 1 ? "is" : "are"} switched on but not listed,
            because {incomplete.length === 1 ? "it has" : "they have"} no details
            yet.
          </p>
        )}
      </Fieldset>
    </div>
  );
}
