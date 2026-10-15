"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/admin/settings/actions";
import { type SaveState } from "@/components/ui/save-button";
import { useEditor } from "@/components/admin/use-editor";
import { Fieldset } from "@/components/ui/primitives";
import { Field } from "@/components/merchant/form-shell";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { MARKETING_WORDS } from "@/lib/checkout-options";

// The payment fields are deliberately not here. They moved to Settings →
// Payments, where they sit under the switch that decides whether the method is
// offered at all — which is the thing that used to be missing. See
// lib/payment-methods.ts.
type Settings = {
  whatsappNumber: string;
  contactEmail: string | null;
  shippingFee: number;
  freeShippingThreshold: number | null;
  checkoutNotes: boolean;
  marketingOptIn: boolean;
  marketingOptInText: string;
  checkoutReminder: boolean;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
};

function toFields(s: Settings) {
  return {
    whatsappNumber: s.whatsappNumber,
    contactEmail: s.contactEmail ?? "",
    shippingFee: String(s.shippingFee),
    freeShippingThreshold: s.freeShippingThreshold != null ? String(s.freeShippingThreshold) : "",
    checkoutNotes: s.checkoutNotes ? "on" : "",
    marketingOptIn: s.marketingOptIn ? "on" : "",
    marketingOptInText: s.marketingOptInText,
    checkoutReminder: s.checkoutReminder ? "on" : "",
    deliveryDaysMin: s.deliveryDaysMin != null ? String(s.deliveryDaysMin) : "",
    deliveryDaysMax: s.deliveryDaysMax != null ? String(s.deliveryDaysMax) : "",
  };
}

export function StoreSettingsForm({
  settings,
  currency,
}: {
  settings: Settings;
  /** The store's own currency, so the money fields are not labelled in somebody else's. */
  currency: string;
}) {
  const router = useRouter();
  const [fields, setFields] = useState(toFields(settings));
  const [saved, setSaved] = useState(fields);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dirty = Object.keys(fields).some((k) => fields[k as keyof typeof fields] !== saved[k as keyof typeof saved]);

  function set(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    if (saveState !== "idle") setSaveState("idle");
  }

  async function handleSave() {
    setSaveState("saving");
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    try {
      await updateSettings(formData);
      setSaved(fields);
      setSaveState("saved");
      router.refresh();
    } catch {
      setSaveState("error");
    }
  }

  // Discard and Save live in the action bar with every other screen's, and
  // registering guards the work against the tab closing, a link, and the back
  // button — see components/admin/use-editor.ts.
  useEditor({
    dirty,
    saving: saveState === "saving",
    onSave: handleSave,
    onDiscard: () => setFields(saved),
  });

  return (
    <div className="space-y-2.5">
      <Fieldset
        title="How customers reach you"
        description="Both appear on your storefront, so use an address and a number you actually watch."
      >
        <Field
          label="WhatsApp number"
          hint="Country code first, no plus sign and no spaces — 923001234567."
        >
          <input
            inputMode="numeric"
            value={fields.whatsappNumber}
            onChange={(e) => set("whatsappNumber", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Contact email" hint="Shown on your Contact page.">
          <input
            type="email"
            value={fields.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            className="input"
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Shipping"
        description="What delivery costs, and when you stop charging for it."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={`Shipping fee (${currency})`}>
            <input
              type="number"
              min={0}
              value={fields.shippingFee}
              onChange={(e) => set("shippingFee", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={`Free above (${currency})`} hint="Leave blank to always charge.">
            <input
              type="number"
              min={0}
              value={fields.freeShippingThreshold}
              onChange={(e) => set("freeShippingThreshold", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Arrives in, at the soonest (days)" hint="Shown at checkout as “Arrives in 2 to 4 days”. Leave both blank to say nothing.">
            <input type="number" min={0} max={60} value={fields.deliveryDaysMin} onChange={(e) => set("deliveryDaysMin", e.target.value)} className="input" />
          </Field>
          <Field label="At the latest (days)">
            <input type="number" min={0} max={60} value={fields.deliveryDaysMax} onChange={(e) => set("deliveryDaysMax", e.target.value)} className="input" />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="What customers fill in" description="The checkout's optional parts.">
        <ToggleSwitch inline
          checked={fields.checkoutNotes === "on"}
          onChange={(v) => set("checkoutNotes", v ? "on" : "")}
          label="Order notes"
          description="Gift messages and special instructions. Shown on the order with a note mark, and on its packing slip."
        />
        <ToggleSwitch inline
          checked={fields.marketingOptIn === "on"}
          onChange={(v) => set("marketingOptIn", v ? "on" : "")}
          label="Ask customers if they want offers"
          description="A tick box at checkout, unticked to start, as the law expects. Who said yes shows on their customer page."
        />
        {fields.marketingOptIn === "on" && (
          <Field label="Words beside the box">
            <input value={fields.marketingOptInText} placeholder={MARKETING_WORDS} maxLength={160} onChange={(e) => set("marketingOptInText", e.target.value)} className="input" />
          </Field>
        )}
      </Fieldset>

      <Fieldset title="After checkout" description="For people who reach checkout and stop.">
        <ToggleSwitch inline
          checked={fields.checkoutReminder === "on"}
          onChange={(v) => set("checkoutReminder", v ? "on" : "")}
          label="Remind people who leave at checkout"
          description="One email, about an hour after they stop, to anyone who gave an email address. You can still remind anyone by hand from Abandoned checkouts."
        />
      </Fieldset>
    </div>
  );
}
