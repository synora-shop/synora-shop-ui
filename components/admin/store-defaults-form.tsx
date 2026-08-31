"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveStoreDefaults } from "@/app/admin/settings/actions";
import { Card } from "@/components/ui/primitives";
import { InfoPopover } from "@/components/ui/info-popover";
import { StickySaveBar } from "@/components/ui/sticky-save-bar";
import { useUnsavedChanges } from "@/components/ui/use-unsaved-changes";
import { useConfirm } from "@/components/ui/confirm-dialog";
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
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const router = useRouter();

  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(saved), [values, saved]);

  useUnsavedChanges(dirty, () =>
    confirm({
      title: "Leave without saving?",
      description: "Your store defaults haven't been saved.",
      confirmLabel: "Leave and lose changes",
      cancelLabel: "Stay here",
      danger: true,
    })
  );

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

  const weightOptions = WEIGHT_UNITS.filter((w) => w.system === values.unitSystem);
  const label = "flex items-center gap-1.5 text-xs font-medium text-ink";

  return (
    <>
      {dialog}
      <Card className="p-5">
        <h2 className="text-sm font-semibold">Store defaults</h2>
        <p className="mt-0.5 text-xs text-ink-soft">
          What your store is called, what it charges in, and where it trades from.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="storeName">
              Store name
              <InfoPopover text="Shown in the admin, in order emails, and anywhere your store refers to itself by name." />
            </label>
            <input
              id="storeName"
              className="input mt-1"
              value={values.storeName}
              onChange={(e) => set("storeName", e.target.value)}
            />
          </div>

          <div>
            <label className={label} htmlFor="currency">
              Currency
              <InfoPopover text="How prices are shown to customers. Changing this does not convert your existing prices, a product priced at 2500 stays 2500, in the new currency." />
            </label>
            <select
              id="currency"
              className="input mt-1"
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
            <label className={label} htmlFor="country">
              Region
              <InfoPopover text="Where your business operates from. Used for shipping defaults and for customers outside any market you've set up." />
            </label>
            <select
              id="country"
              className="input mt-1"
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
            <label className={label} htmlFor="unitSystem">Unit system</label>
            <select
              id="unitSystem"
              className="input mt-1"
              value={values.unitSystem}
              onChange={(e) => setSystem(e.target.value as "METRIC" | "IMPERIAL")}
            >
              {UNIT_SYSTEMS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-soft">
              {UNIT_SYSTEMS.find((u) => u.value === values.unitSystem)?.hint}
            </p>
          </div>

          <div>
            <label className={label} htmlFor="weightUnit">Default weight unit</label>
            <select
              id="weightUnit"
              className="input mt-1"
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
            <label className={label} htmlFor="timeZone">
              Time zone
              <InfoPopover text="Sets when orders and analytics are recorded. Changing it moves which day a sale is counted on, so past reports may shift by a day." />
            </label>
            <select
              id="timeZone"
              className="input mt-1"
              value={values.timeZone}
              onChange={(e) => set("timeZone", e.target.value)}
            >
              {TIME_ZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-soft">
              Sets the time for when orders and analytics are recorded.
            </p>
          </div>
        </div>
      </Card>

      <StickySaveBar
        dirty={dirty}
        saveState={saveState}
        onSave={handleSave}
        onDiscard={() => {
          setValues(saved);
          setSaveState("idle");
          toast.info("Changes discarded.");
        }}
        saveLabel="Save defaults"
      />
    </>
  );
}
