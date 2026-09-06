"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/admin/settings/actions";
import { type SaveState } from "@/components/ui/save-button";
import { useEditor } from "@/components/admin/use-editor";
import { Fieldset } from "@/components/ui/primitives";
import { Field } from "@/components/merchant/form-shell";

type Settings = {
  whatsappNumber: string;
  contactEmail: string | null;
  shippingFee: number;
  freeShippingThreshold: number | null;
  bankAccountDetails: string | null;
  jazzcashAccountDetails: string | null;
  easypaisaAccountDetails: string | null;
};

function toFields(s: Settings) {
  return {
    whatsappNumber: s.whatsappNumber,
    contactEmail: s.contactEmail ?? "",
    shippingFee: String(s.shippingFee),
    freeShippingThreshold: s.freeShippingThreshold != null ? String(s.freeShippingThreshold) : "",
    bankAccountDetails: s.bankAccountDetails ?? "",
    jazzcashAccountDetails: s.jazzcashAccountDetails ?? "",
    easypaisaAccountDetails: s.easypaisaAccountDetails ?? "",
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
      </Fieldset>

      <Fieldset
        title="Payment details"
        description="Shown at checkout to a customer who picks that method. Leave one blank and it is not offered."
      >
        <Field label="Bank transfer">
          <textarea
            value={fields.bankAccountDetails}
            onChange={(e) => set("bankAccountDetails", e.target.value)}
            rows={3}
            className="input"
          />
        </Field>
        <Field label="JazzCash">
          <textarea
            value={fields.jazzcashAccountDetails}
            onChange={(e) => set("jazzcashAccountDetails", e.target.value)}
            rows={2}
            className="input"
          />
        </Field>
        <Field label="EasyPaisa">
          <textarea
            value={fields.easypaisaAccountDetails}
            onChange={(e) => set("easypaisaAccountDetails", e.target.value)}
            rows={2}
            className="input"
          />
        </Field>
      </Fieldset>
    </div>
  );
}
