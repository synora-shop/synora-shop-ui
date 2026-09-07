"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveStoreDefaults } from "@/app/admin/settings/actions";
import { Fieldset } from "@/components/ui/primitives";
import { FieldHint, FieldLabel } from "@/components/merchant/form-shell";
import { useEditor } from "@/components/admin/use-editor";
import { useToast } from "@/components/ui/toast";
import type { SaveState } from "@/components/ui/save-button";
import {
  COUNTRIES,
  CURRENCIES,
  TIME_ZONES,
  UNIT_SYSTEMS,
  WEIGHT_UNITS,
  type StoreDefaults,
} from "@/lib/store-defaults";

/**
 * The things a store is measured in.
 *
 * Grouped into one card because they are set together, on day one, and then
 * rarely touched — and because two of them have consequences worth stating
 * rather than leaving to be discovered: the time zone decides which day a sale
 * is counted on, and the unit system decides what a weight means.
 */
export function StoreDefaultsForm({ initial }: { initial: StoreDefaults }) {
  const [values, setValues] = useState<StoreDefaults>(initial);
  const [saved, setSaved] = useState<StoreDefaults>(initial);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const toast = useToast();
  const router = useRouter();

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);

  // Switching system re-picks the weight unit, so the two can never disagree on
  // screen — an imperial store offering grams is a contradiction.
  function setSystem(unitSystem: "METRIC" | "IMPERIAL") {
    setValues((v) => ({
      ...v,
      unitSystem,
      weightUnit: unitSystem === "METRIC" ? "kg" : "lb",
    }));
    setSaveState("idle");
  }

  const set = <K extends keyof StoreDefaults>(key: K, value: StoreDefaults[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setSaveState("idle");
  };

  async function handleSave() {
    setSaveState("saving");
    try {
      const result = await saveStoreDefaults(values);
      if (result.error) {
        setSaveState("error");
        toast.error(result.error);
        return;
      }
      setSaved(values);
      setSaveState("saved");
      toast.success("Store defaults saved.");
      router.refresh();
    } catch {
      setSaveState("error");
      toast.error("Couldn't save your store defaults.");
    }
  }

  // Discard and Save live in the action bar with every other screen's, and
  // registering installs the leave-guard this form used to carry alone — see
  // components/admin/use-editor.ts.
  useEditor({
    dirty,
    saving: saveState === "saving",
    onSave: handleSave,
    onDiscard: () => {
      setValues(saved);
      setSaveState("idle");
    },
  });

  const weightOptions = WEIGHT_UNITS.filter((w) => w.system === values.unitSystem);

  return (
    <Fieldset
        title="Store defaults"
        description="What your store charges in, where it trades from, and what &ldquo;today&rdquo; means when an order is stamped. Set once, and rarely thought about again."
      >
        {/* The store's name is deliberately not here. It is the first field on
            Home, which owns the shop's identity — and it is the same column, so
            having it in both places meant two screens editing one value with no
            way to tell which had won. The same fault the logos had. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="currency" info="How prices are shown to customers. Changing this does not convert your existing prices, a product priced at 2500 stays 2500, in the new currency.">Currency</FieldLabel>
            <select
              id="currency"
              className="input"
              value={values.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="country" info="Where your business operates from. Used for shipping defaults and tax.">Country</FieldLabel>
            <select
              id="country"
              className="input"
              value={values.countryCode}
              onChange={(e) => set("countryCode", e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="unitSystem">Unit system</FieldLabel>
            <select
              id="unitSystem"
              className="input"
              value={values.unitSystem}
              onChange={(e) => setSystem(e.target.value as "METRIC" | "IMPERIAL")}
            >
              {UNIT_SYSTEMS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            <FieldHint>{UNIT_SYSTEMS.find((u) => u.value === values.unitSystem)?.hint}
            </FieldHint>
          </div>

          <div>
            <FieldLabel htmlFor="weightUnit">Default weight unit</FieldLabel>
            <select
              id="weightUnit"
              className="input"
              value={values.weightUnit}
              onChange={(e) => set("weightUnit", e.target.value)}
            >
              {weightOptions.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <FieldLabel htmlFor="timeZone" info="Sets when orders and analytics are recorded. Changing it moves which day a sale is counted on, so past reports may shift by a day.">Time zone</FieldLabel>
            <select
              id="timeZone"
              className="input"
              value={values.timeZone}
              onChange={(e) => set("timeZone", e.target.value)}
            >
              {TIME_ZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
        </div>
    </Fieldset>
  );
}
