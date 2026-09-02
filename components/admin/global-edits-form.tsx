"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { updateGlobalEdits } from "@/app/admin/settings/actions";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { BlockedCountriesField } from "@/components/admin/blocked-countries-field";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { SHOP_SORT_LABELS, type GlobalEdits } from "@/lib/global-edits";

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-white p-5">
      <h3 className="font-serif text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 text-xs text-ink-soft">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase text-ink-soft">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function GlobalEditsForm({ settings }: { settings: GlobalEdits }) {
  const router = useRouter();
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

  return (
    <div className="mt-6 max-w-3xl space-y-6">
      <p className="text-sm text-ink-soft">
        Site-wide behavior, every edit here applies live across the whole storefront,
        including products and pages you add later. Turning an edit back off always
        restores the site&apos;s normal behavior.
      </p>

      <Card title="Inventory & Stock">
        <ToggleSwitch
          label="Show inventory count"
          description={'When off, product pages say "In stock" instead of the exact number left.'}
          checked={fields.showInventoryCount}
          onChange={(v) => set("showInventoryCount", v)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Low stock threshold">
            <input
              type="number"
              min={0}
              value={fields.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Low stock badge text (use {n} for the count)">
            <input
              value={fields.lowStockBadgeText}
              onChange={(e) => set("lowStockBadgeText", e.target.value)}
              className="input"
            />
          </Field>
        </div>
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
      </Card>

      <Card title="Merchandising">
        <ToggleSwitch
          label='"New" badge on recent products'
          checked={fields.newArrivalBadge}
          onChange={(v) => set("newArrivalBadge", v)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="New-arrival window (days)">
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
        </div>
        <ToggleSwitch
          label="Sale badge on discounted products"
          checked={fields.saleBadge}
          onChange={(v) => set("saleBadge", v)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Default shop sort order">
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
          <Field label="Shop grid columns (desktop)">
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
        </div>
        <ToggleSwitch
          label="Filter bar on the Shop page"
          checked={fields.shopFilterBar}
          onChange={(v) => set("shopFilterBar", v)}
        />
      </Card>

      <Card title="Branding">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Accent color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fields.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="h-9 w-12 rounded border border-border"
              />
              <input
                value={fields.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="input"
              />
            </div>
          </Field>
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
        </div>
        <Field label="Footer copyright text (use {year} for the current year)">
          <input
            value={fields.footerCopyrightText}
            onChange={(e) => set("footerCopyrightText", e.target.value)}
            className="input"
          />
        </Field>
      </Card>

      <Card title="Site Announcement" description="Leave the text blank to hide the banner entirely.">
        <Field label="Announcement text">
          <input
            value={fields.announcementText}
            onChange={(e) => set("announcementText", e.target.value)}
            placeholder="e.g. Free shipping on orders over Rs 5,000"
            className="input"
          />
        </Field>
        <Field label="Background color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={fields.announcementBgColor}
              onChange={(e) => set("announcementBgColor", e.target.value)}
              className="h-9 w-12 rounded border border-border"
            />
            <input
              value={fields.announcementBgColor}
              onChange={(e) => set("announcementBgColor", e.target.value)}
              className="input"
            />
          </div>
        </Field>
      </Card>

      <Card title="Operations">
        <ToggleSwitch
          label='"Order via WhatsApp" button on product pages'
          checked={fields.whatsappOrderButton}
          onChange={(v) => set("whatsappOrderButton", v)}
        />
        <div className="rounded-lg border border-amber bg-amber-bg p-3">
          <ToggleSwitch
            label="Maintenance mode"
            description="Storefront shows a holding page to everyone but admins. Admin panel always stays reachable."
            checked={fields.maintenanceMode}
            onChange={(v) => set("maintenanceMode", v)}
          />
          {fields.maintenanceMode && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber">
              <AlertTriangle className="h-3.5 w-3.5" /> The storefront will be down for customers until you save with this off again.
            </p>
          )}
        </div>

        {/* Beside maintenance mode because it is the same kind of decision —
            who can see the shop — just narrower. */}
        <BlockedCountriesField
          value={fields.blockedCountries}
          onChange={(next) => set("blockedCountries", next)}
        />
      </Card>

      <SaveButton
        state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState}
        onClick={handleSave}
        size="lg"
        idleLabel="Save Global Edits"
      />
    </div>
  );
}
