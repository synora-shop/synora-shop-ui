"use client";

import { Plus, Trash2, TriangleAlert } from "lucide-react";
import {
  BULK_PRICING_MODES,
  CUSTOM_FIELD_KINDS,
  CUSTOM_FIELD_PRESETS,
  PRODUCT_KINDS,
  PRODUCT_KIND_META,
  tierProblems,
  type BulkPricing,
  type BulkTier,
  type CustomField,
  type CustomFieldKind,
  type ProductKind,
} from "@/lib/product-kind";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const BULK_PRICING_META: Record<BulkPricing, { label: string; help: string }> = {
  HIDDEN: {
    label: "Don't show a price",
    help: "The page says “Price on request”. Right when every deal is negotiated.",
  },
  RANGE: {
    label: "Show a range",
    help: "“From X to Y per unit”. Sets expectations without committing you to a number.",
  },
  TIERED: {
    label: "Show quantity breaks",
    help: "A table of prices per quantity. Answers the customer's real question, what does it cost at the amount I want?",
  },
};

const input =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-300";
const labelClass = "text-xs font-medium text-ink";

export type KindState = {
  kind: ProductKind;
  bulkPricing: BulkPricing;
  minOrderQuantity: number | "";
  bulkPriceMin: number | "";
  bulkPriceMax: number | "";
  tiers: BulkTier[];
  customFields: CustomField[];
  enquiryUrl: string;
};

/**
 * How this product is sold, and the fields that only apply to that choice.
 *
 * Everything below the selector is conditional, and deliberately so: a standard
 * product shows none of it, so the ordinary case stays as short as it was
 * before bulk and made-to-order existed. Choosing a type is the one decision
 * that changes what a customer can do, so it says so in plain words rather than
 * leaving the merchant to infer it from a label.
 */
export function ProductKindFields({
  value,
  onChange,
}: {
  value: KindState;
  onChange: (next: KindState) => void;
}) {
  const set = <K extends keyof KindState>(key: K, v: KindState[K]) =>
    onChange({ ...value, [key]: v });

  const problems =
    value.kind === "BULK" && value.bulkPricing === "TIERED"
      ? tierProblems(value.tiers, value.minOrderQuantity === "" ? null : value.minOrderQuantity)
      : [];

  return (
    <div className="space-y-5 rounded-xl border border-border bg-surface p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          How this is sold
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {PRODUCT_KINDS.map((k) => {
            const meta = PRODUCT_KIND_META[k];
            const active = value.kind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => set("kind", k)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-brand-500 bg-brand-50"
                    : "border-border hover:border-brand-300 hover:bg-subtle"
                )}
              >
                <span className={cn("block text-sm font-medium", active && "text-brand-600")}>
                  {meta.label}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-ink-soft">
                  {meta.blurb}
                </span>
              </button>
            );
          })}
        </div>
        {value.kind !== "NORMAL" && (
          <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-bg px-3 py-2 text-xs leading-snug text-amber">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Customers can&apos;t add this to a cart. The product page shows an enquiry form
              instead, and anything they send arrives in <strong>Enquiries</strong>.
            </span>
          </p>
        )}
      </div>

      {value.kind === "BULK" && (
        <>
          <div>
            <label className={labelClass} htmlFor="moq">Minimum order</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="moq" type="number" min={1} className={cn(input, "max-w-32")}
                value={value.minOrderQuantity}
                onChange={(e) => set("minOrderQuantity", e.target.value === "" ? "" : Number(e.target.value))}
              />
              <span className="text-sm text-ink-soft">units</span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              The smallest order you&apos;ll take. Shown on the page, and enquiries below it are
              rejected with an explanation.
            </p>
          </div>

          <div>
            <p className={labelClass}>Price display</p>
            <div className="mt-1.5 space-y-1.5">
              {BULK_PRICING_MODES.map((mode) => (
                <label
                  key={mode}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors",
                    value.bulkPricing === mode ? "border-brand-500 bg-brand-50" : "border-border hover:bg-subtle"
                  )}
                >
                  <input
                    type="radio" name="bulkPricing" checked={value.bulkPricing === mode}
                    onChange={() => set("bulkPricing", mode)} className="mt-0.5"
                  />
                  <span>
                    <span className="block text-sm font-medium">{BULK_PRICING_META[mode].label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-ink-soft">
                      {BULK_PRICING_META[mode].help}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {value.bulkPricing === "RANGE" && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className={labelClass} htmlFor="pmin">From (PKR/unit)</label>
                <input id="pmin" type="number" min={0} className={cn(input, "mt-1 max-w-36")}
                  value={value.bulkPriceMin}
                  onChange={(e) => set("bulkPriceMin", e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass} htmlFor="pmax">To (PKR/unit)</label>
                <input id="pmax" type="number" min={0} className={cn(input, "mt-1 max-w-36")}
                  value={value.bulkPriceMax}
                  onChange={(e) => set("bulkPriceMax", e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
          )}

          {value.bulkPricing === "TIERED" && (
            <div>
              <p className={labelClass}>Quantity breaks</p>
              <div className="mt-1.5 space-y-1.5">
                {value.tiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-ink-soft">From</span>
                    <input
                      type="number" min={1} aria-label="Minimum quantity"
                      className={cn(input, "max-w-24 font-mono tabular-nums")}
                      value={tier.minQty}
                      onChange={(e) => {
                        const tiers = [...value.tiers];
                        tiers[i] = { ...tier, minQty: Number(e.target.value) };
                        set("tiers", tiers);
                      }}
                    />
                    <span className="text-xs text-ink-soft">units &rarr; PKR</span>
                    <input
                      type="number" min={0} aria-label="Unit price"
                      className={cn(input, "max-w-28 font-mono tabular-nums")}
                      value={tier.unitPrice}
                      onChange={(e) => {
                        const tiers = [...value.tiers];
                        tiers[i] = { ...tier, unitPrice: Number(e.target.value) };
                        set("tiers", tiers);
                      }}
                    />
                    <span className="text-xs text-ink-soft">each</span>
                    <button
                      type="button" aria-label={`Remove tier from ${tier.minQty} units`}
                      onClick={() => set("tiers", value.tiers.filter((_, n) => n !== i))}
                      className="ml-auto rounded p-1.5 text-ink-faint transition-colors hover:bg-rose-bg hover:text-rose"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button" size="sm" className="mt-2"
                onClick={() => {
                  const last = value.tiers[value.tiers.length - 1];
                  set("tiers", [
                    ...value.tiers,
                    {
                      minQty: last ? last.minQty * 2 : (value.minOrderQuantity || 10),
                      unitPrice: last ? Math.round(last.unitPrice * 0.9) : 0,
                    },
                  ]);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add a break
              </Button>

              {problems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {problems.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-xs leading-snug text-amber">
                      <TriangleAlert className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {value.kind === "CUSTOM" && (
        <div>
          <p className={labelClass}>What you need from the customer</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            These become the fields on the enquiry form. Ask for what you actually need to quote,
            every extra box loses a few enquiries.
          </p>

          {value.customFields.length === 0 && (
            <Button
              type="button" size="sm" className="mt-2"
              onClick={() => set("customFields", CUSTOM_FIELD_PRESETS)}
            >
              Start with standard measurements
            </Button>
          )}

          <div className="mt-2 space-y-2">
            {value.customFields.map((field, i) => (
              <div key={field.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    aria-label="Field label" placeholder="Label" className={cn(input, "max-w-44")}
                    value={field.label}
                    onChange={(e) => {
                      const fields = [...value.customFields];
                      fields[i] = { ...field, label: e.target.value };
                      set("customFields", fields);
                    }}
                  />
                  <select
                    aria-label="Field type" className={cn(input, "max-w-32")} value={field.kind}
                    onChange={(e) => {
                      const fields = [...value.customFields];
                      fields[i] = { ...field, kind: e.target.value as CustomFieldKind };
                      set("customFields", fields);
                    }}
                  >
                    {CUSTOM_FIELD_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <input
                      type="checkbox" checked={field.required}
                      onChange={(e) => {
                        const fields = [...value.customFields];
                        fields[i] = { ...field, required: e.target.checked };
                        set("customFields", fields);
                      }}
                    />
                    Required
                  </label>
                  <button
                    type="button" aria-label={`Remove ${field.label || "field"}`}
                    onClick={() => set("customFields", value.customFields.filter((_, n) => n !== i))}
                    className="ml-auto rounded p-1.5 text-ink-faint transition-colors hover:bg-rose-bg hover:text-rose"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  aria-label="Help text" placeholder="Help text shown under the field"
                  className={cn(input, "mt-2")}
                  value={field.help}
                  onChange={(e) => {
                    const fields = [...value.customFields];
                    fields[i] = { ...field, help: e.target.value };
                    set("customFields", fields);
                  }}
                />
              </div>
            ))}
          </div>

          <Button
            type="button" size="sm" className="mt-2"
            onClick={() =>
              set("customFields", [
                ...value.customFields,
                {
                  id: `field-${Date.now().toString(36)}`,
                  label: "",
                  help: "",
                  required: false,
                  kind: "text",
                },
              ])
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add a field
          </Button>
        </div>
      )}

      {value.kind !== "NORMAL" && (
        <div>
          <label className={labelClass} htmlFor="enqUrl">
            Send enquiries somewhere else <span className="text-ink-faint">(optional)</span>
          </label>
          <input
            id="enqUrl" type="url" placeholder="https://…" className={cn(input, "mt-1")}
            value={value.enquiryUrl}
            onChange={(e) => set("enquiryUrl", e.target.value)}
          />
          <p className="mt-1 text-xs leading-snug text-ink-soft">
            Leave empty to use the built-in form, which files enquiries in your admin. A link here
            replaces it, useful for a Google Form or a WhatsApp deep link. It must be https, and
            it&apos;s checked again before it&apos;s shown to a customer.
          </p>
        </div>
      )}
    </div>
  );
}
