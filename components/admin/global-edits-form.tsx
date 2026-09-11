"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateGlobalEdits } from "@/app/admin/settings/actions";
import { type SaveState } from "@/components/ui/save-button";
import { useEditor } from "@/components/admin/use-editor";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Fieldset } from "@/components/ui/primitives";
import { Field } from "@/components/merchant/form-shell";
import { SHOP_SORT_LABELS, type GlobalEdits } from "@/lib/global-edits";
import { useCurrencySymbol } from "@/components/ui/currency";

/** A colour, twice: the swatch you pick from and the hex you can paste into. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} swatch`}
          className="h-9 w-12 flex-shrink-0 cursor-pointer rounded-lg border border-border bg-control p-1"
        />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="input font-mono" />
      </div>
    </Field>
  );
}

/** Two controls that belong on one line where there is room for two. */
function Pair({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

export function GlobalEditsForm({ settings }: { settings: GlobalEdits }) {
  const router = useRouter();
  const symbol = useCurrencySymbol();
  const [fields, setFields] = useState<GlobalEdits>(settings);
  const [saved, setSaved] = useState<GlobalEdits>(settings);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dirty = (Object.keys(fields) as (keyof GlobalEdits)[]).some((k) => fields[k] !== saved[k]);

  function set<K extends keyof GlobalEdits>(key: K, value: GlobalEdits[K]) {
    setFields((f) => ({ ...f, [key]: value }));
    if (saveState !== "idle") setSaveState("idle");
  }

  async function handleSave() {
    setSaveState("saving");
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === "boolean") {
        if (value) formData.set(key, "on");
      } else {
        formData.set(key, String(value));
      }
    }
    try {
      await updateGlobalEdits(formData);
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
        title="Inventory & stock"
        description="What a shopper is told about how many you have left, and what happens to a product when you run out."
      >
        <ToggleSwitch
          inline
          label="Show inventory count"
          description={'When off, product pages say "In stock" instead of the exact number left.'}
          checked={fields.showInventoryCount}
          onChange={(v) => set("showInventoryCount", v)}
        />
        <Pair>
          <Field label="Low stock threshold">
            <input
              type="number"
              min={0}
              value={fields.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Low stock badge" hint="Use {n} for the count.">
            <input
              value={fields.lowStockBadgeText}
              onChange={(e) => set("lowStockBadgeText", e.target.value)}
              className="input"
            />
          </Field>
        </Pair>
        <Field label="Out-of-stock products">
          <select
            value={fields.outOfStockDisplay}
            onChange={(e) => set("outOfStockDisplay", e.target.value as GlobalEdits["outOfStockDisplay"])}
            className="input"
          >
            <option value="SOLD_OUT">Show, marked &ldquo;Sold Out&rdquo;</option>
            <option value="NORMAL">Show normally</option>
            <option value="HIDE">Hide from listings</option>
          </select>
        </Field>
      </Fieldset>

      <Fieldset
        title="Badges"
        description="The small labels on a product card. They only appear where they are true, so leaving them on costs nothing."
      >
        <ToggleSwitch
          inline
          label='"New" badge on recent products'
          checked={fields.newArrivalBadge}
          onChange={(v) => set("newArrivalBadge", v)}
        />
        <Pair>
          <Field label="Counts as new for (days)">
            <input
              type="number"
              min={0}
              value={fields.newArrivalWindowDays}
              onChange={(e) => set("newArrivalWindowDays", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="New-arrival badge text">
            <input
              value={fields.newArrivalBadgeText}
              onChange={(e) => set("newArrivalBadgeText", e.target.value)}
              className="input"
            />
          </Field>
        </Pair>
        <ToggleSwitch
          inline
          label="Sale badge on discounted products"
          checked={fields.saleBadge}
          onChange={(v) => set("saleBadge", v)}
        />
      </Fieldset>

      <Fieldset
        title="The Shop page"
        description="How your catalogue is laid out and ordered the first time somebody opens it."
      >
        <Pair>
          <Field label="Default sort order">
            <select
              value={fields.defaultShopSort}
              onChange={(e) => set("defaultShopSort", e.target.value as GlobalEdits["defaultShopSort"])}
              className="input"
            >
              {Object.entries(SHOP_SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Columns on a computer">
            <select
              value={fields.shopGridColumns}
              onChange={(e) => set("shopGridColumns", Number(e.target.value))}
              className="input"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </Field>
        </Pair>
        <ToggleSwitch
          inline
          label="Filter bar on the Shop page"
          checked={fields.shopFilterBar}
          onChange={(v) => set("shopFilterBar", v)}
        />
      </Fieldset>

      {/* The accent colour picker was here, and it is deliberately gone.
          
          The shop's colour was settable twice — here, and in the customizer as
          the theme's accent — and which one a merchant got depended on whether
          they had ever touched a theme token. Two controls for one colour, one
          of which stopped working without saying so. The theme's accent is the
          only one now; see withLegacyAccent in lib/data/theme.ts for what keeps
          an existing shop's colour on its storefront.
          
          It is not replaced by a link to the customizer: Themes is one pill
          down the sidebar, and a field whose only job is to say "not here"
          is worse than the space. */}
      <Fieldset
        title="Branding"
        description="How headings and the footer read on your storefront. Colours and fonts live in the theme — open Themes, then Customize."
      >
        <Pair>
          <Field label="Heading style">
            <select
              value={fields.headingStyle}
              onChange={(e) => set("headingStyle", e.target.value as GlobalEdits["headingStyle"])}
              className="input"
            >
              <option value="normal">Normal</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="titlecase">Title Case</option>
            </select>
          </Field>
        </Pair>
        <Field label="Footer copyright" hint="Use {year} for the current year.">
          <input
            value={fields.footerCopyrightText}
            onChange={(e) => set("footerCopyrightText", e.target.value)}
            className="input"
          />
        </Field>
      </Fieldset>

      <Fieldset
        title="Announcement bar"
        description="A single line across the top of every page. Leave the text blank to hide it entirely."
      >
        <Field label="Announcement text">
          <input
            value={fields.announcementText}
            onChange={(e) => set("announcementText", e.target.value)}
            placeholder={`e.g. Free shipping on orders over ${symbol} 5,000`}
            className="input"
          />
        </Field>
        <ColorField
          label="Background colour"
          value={fields.announcementBgColor}
          onChange={(v) => set("announcementBgColor", v)}
        />
      </Fieldset>

      <Fieldset
        title="Ordering"
        description="Ways to buy that sit alongside the normal checkout."
      >
        <ToggleSwitch
          inline
          label='"Order via WhatsApp" button on product pages'
          checked={fields.whatsappOrderButton}
          onChange={(v) => set("whatsappOrderButton", v)}
        />
      </Fieldset>
    </div>
  );
}
