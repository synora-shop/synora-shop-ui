"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { saveVisibility } from "@/app/admin/preferences/actions";
import { BlockedCountriesField } from "@/components/admin/blocked-countries-field";
import { useEditor } from "@/components/admin/use-editor";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Fieldset } from "@/components/ui/primitives";
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
    <div className="space-y-2.5">
      <Fieldset
        title="Coming soon / maintenance"
        description="Customers see a holding page instead of your store. You and your staff still get in, so you can keep working on it."
        className={fields.maintenanceMode ? "border-amber/40 bg-amber-bg" : undefined}
      >
        <ToggleSwitch
          inline
          label="Hide my store from customers"
          checked={fields.maintenanceMode}
          onChange={(v) => set("maintenanceMode", v)}
        />
        {fields.maintenanceMode && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-amber">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            Your store is hidden from customers until you turn this off and save.
          </p>
        )}
      </Fieldset>

      {/* The same decision as maintenance mode, only narrower — who can see the
          shop — so it sits directly under it. */}
      <Fieldset
        title="Hide from certain countries"
        description="Visitors from these countries see a closed-store page instead of your shop. The country comes from their address, so a VPN gets around it — this is hiding, not security."
      >
        <BlockedCountriesField
          value={fields.blockedCountries}
          onChange={(next) => set("blockedCountries", next)}
        />
      </Fieldset>

      <Fieldset
        title="Search engines"
        description="Google and the others are invited in, and your store can turn up in results. Turn it off while you are still building, or if your catalogue is only meant to be shared by link. A request, not a lock — anyone with the address can still open your store."
      >
        <ToggleSwitch
          inline
          label="Let search engines list my store"
          checked={fields.searchIndexing}
          onChange={(v) => set("searchIndexing", v)}
        />
      </Fieldset>

      <Fieldset
        title="Spam protection"
        description="A hidden field that people never see and automated form-fillers always fill in. Anything that fills it is quietly thrown away. Leave it on — the only reason to turn it off is to work out why a real enquiry never reached you."
      >
        <ToggleSwitch
          inline
          label="Protect my public forms"
          checked={fields.spamProtection}
          onChange={(v) => set("spamProtection", v)}
        />
      </Fieldset>

    </div>
  );
}
