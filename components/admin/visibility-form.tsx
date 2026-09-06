"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { saveVisibility } from "@/app/admin/preferences/actions";
import { BlockedCountriesField } from "@/components/admin/blocked-countries-field";
import { useEditor } from "@/components/admin/use-editor";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Card } from "@/components/ui/primitives";
import type { Visibility } from "@/lib/visibility";

/**
 * Four settings that answer one question: who can see this shop?
 *
 * Ordered by how much they do. Maintenance mode hides the shop from everybody;
 * the country list hides it from some people; the crawler setting decides
 * whether it can be *found*; the honeypot decides who can write to it. A
 * merchant reading down the page meets them from largest consequence to
 * smallest.
 */
export function VisibilityForm({ initial }: { initial: Visibility }) {
  const router = useRouter();
  const [fields, setFields] = useState<Visibility>(initial);
  const [saved, setSaved] = useState<Visibility>(initial);
  const [saving, setSaving] = useState(false);

  const dirty =
    fields.maintenanceMode !== saved.maintenanceMode ||
    fields.searchIndexing !== saved.searchIndexing ||
    fields.spamProtection !== saved.spamProtection ||
    fields.blockedCountries.join(",") !== saved.blockedCountries.join(",");

  function set<K extends keyof Visibility>(key: K, value: Visibility[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const result = await saveVisibility(fields);
      if (result.error) throw new Error(result.error);
      setSaved(fields);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  // Discard and Save are in the action bar with every other screen's, and
  // registering here guards the work against the tab closing, a link, and the
  // back button — see components/admin/use-editor.ts.
  useEditor({ dirty, saving, onSave: save, onDiscard: () => setFields(saved) });

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div
          className={
            fields.maintenanceMode
              ? "rounded-lg border border-amber bg-amber-bg p-3"
              : "rounded-lg border border-border p-3"
          }
        >
          <ToggleSwitch
            label="Coming soon / maintenance"
            description="Customers see a holding page instead of your store. You and your staff still get in, so you can keep working on it."
            checked={fields.maintenanceMode}
            onChange={(v) => set("maintenanceMode", v)}
          />
          {fields.maintenanceMode && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber">
              <AlertTriangle className="h-3.5 w-3.5" />
              Your store is hidden from customers until you turn this off and save.
            </p>
          )}
        </div>

        {/* The same decision as maintenance mode, only narrower — who can see
            the shop — so it sits directly under it. */}
        <BlockedCountriesField
          value={fields.blockedCountries}
          onChange={(next) => set("blockedCountries", next)}
        />
      </Card>

      <Card className="space-y-4 p-4">
        <ToggleSwitch
          label="Let search engines list your store"
          description="Google and the others are invited in, and your store can turn up in search results. Turn this off while you are still building, or if your catalogue is only meant to be shared by link."
          checked={fields.searchIndexing}
          onChange={(v) => set("searchIndexing", v)}
        />
        <p className="text-xs text-ink-soft">
          This is a request, not a lock. Search engines respect it; anyone with
          the address can still open your store.
        </p>

        <div className="border-t border-border pt-4">
          <ToggleSwitch
            label="Spam protection on your forms"
            description="A hidden field that people never see and automated form-fillers always fill in. Anything that fills it is quietly thrown away."
            checked={fields.spamProtection}
            onChange={(v) => set("spamProtection", v)}
          />
          <p className="mt-2 text-xs text-ink-soft">
            Leave this on. The only reason to turn it off is to work out why a
            real enquiry never reached you.
          </p>
        </div>
      </Card>

    </div>
  );
}
