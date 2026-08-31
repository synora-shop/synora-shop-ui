"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/admin/settings/actions";
import { SaveButton, type SaveState } from "@/components/ui/save-button";

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

export function StoreSettingsForm({ settings }: { settings: Settings }) {
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

  return (
    <div className="mt-6 max-w-xl space-y-5">
      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">
          WhatsApp Number (E.164, no leading +, e.g. 923001234567)
        </label>
        <input value={fields.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} className="input mt-1" />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">
          Contact Email (shown on the Contact page)
        </label>
        <input
          type="email"
          value={fields.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          className="input mt-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase text-ink-soft">Shipping Fee (PKR)</label>
          <input
            type="number"
            value={fields.shippingFee}
            onChange={(e) => set("shippingFee", e.target.value)}
            className="input mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-ink-soft">
            Free Shipping Threshold (PKR, optional)
          </label>
          <input
            type="number"
            value={fields.freeShippingThreshold}
            onChange={(e) => set("freeShippingThreshold", e.target.value)}
            className="input mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">
          Bank Transfer Details (shown at checkout)
        </label>
        <textarea
          value={fields.bankAccountDetails}
          onChange={(e) => set("bankAccountDetails", e.target.value)}
          rows={3}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">JazzCash Details</label>
        <textarea
          value={fields.jazzcashAccountDetails}
          onChange={(e) => set("jazzcashAccountDetails", e.target.value)}
          rows={2}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">EasyPaisa Details</label>
        <textarea
          value={fields.easypaisaAccountDetails}
          onChange={(e) => set("easypaisaAccountDetails", e.target.value)}
          rows={2}
          className="input mt-1"
        />
      </div>

      <SaveButton
        state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState}
        onClick={handleSave}
        size="lg"
        idleLabel="Save Settings"
      />
    </div>
  );
}
