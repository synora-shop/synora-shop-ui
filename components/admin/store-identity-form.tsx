"use client";

import { useState, useTransition } from "react";
import { SingleImageField } from "@/components/admin/single-image-field";
import { Button, Card } from "@/components/ui/primitives";
import { saveStoreIdentity, type StoreIdentity } from "@/app/admin/identity-actions";
import { useToast } from "@/components/ui/toast";

/**
 * What the shop is called, what it looks like, and where to find it.
 *
 * These four were spread across three screens — the name under store defaults,
 * the logo inside the live editor, the address on a Locations page a shop with
 * one address had no reason to visit. They are the first things a merchant
 * fills in and the ones they come back to, so they are the landing page now.
 */
export function StoreIdentityForm({ initial }: { initial: StoreIdentity }) {
  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const set = <K extends keyof StoreIdentity>(key: K, value: StoreIdentity[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const field =
    "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none transition-colors focus:border-brand-500";
  const label = "text-xs font-semibold uppercase tracking-wide text-ink-soft";

  function save() {
    startTransition(async () => {
      await saveStoreIdentity(values);
      toast.success("Saved");
    });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div>
          <label className={label} htmlFor="storeName">
            Store name
          </label>
          <input
            id="storeName"
            className={`${field} mt-1`}
            value={values.storeName}
            onChange={(e) => set("storeName", e.target.value)}
            placeholder="What customers call your shop"
            maxLength={60}
          />
          <p className="mt-1 text-xs text-ink-faint">
            Shown in the browser tab, on your storefront, and on every email you send.
          </p>
        </div>

        <div>
          <span className={label}>Logo</span>
          {/* A logo is a small wide mark, not a photograph. The field defaults
              to a 4:3 box at the full width of the form, which for this is
              roughly ten times the area the image will ever occupy on the
              site — so it is constrained to something near the shape and size
              it actually renders at. */}
          <div className="mt-1 max-w-56">
            <SingleImageField
              folder="brand"
              aspect="aspect-[3/1]"
              value={values.logoUrl}
              onChange={(url) => set("logoUrl", url)}
            />
          </div>
          <p className="mt-1 text-xs text-ink-faint">
            Leave this empty and your store name is used as the header instead.
          </p>
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div>
          <label className={label} htmlFor="address">
            Address
          </label>
          <input
            id="address"
            className={`${field} mt-1`}
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Street and building"
            maxLength={200}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="city">
              City
            </label>
            <input
              id="city"
              className={`${field} mt-1`}
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label className={label} htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              className={`${field} mt-1`}
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={40}
            />
          </div>
        </div>

        <div>
          <label className={label} htmlFor="contactEmail">
            Contact email
          </label>
          <input
            id="contactEmail"
            type="email"
            className={`${field} mt-1`}
            value={values.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="Where customers can reach you"
            maxLength={120}
          />
        </div>
      </Card>

      {/* Discard and Save on every editable screen, per the documentation.
          Discard is only offered once there is something to discard. */}
      <div className="sticky bottom-4 flex items-center justify-end gap-2">
        {dirty && (
          <Button variant="secondary" onClick={() => setValues(initial)} disabled={pending}>
            Discard
          </Button>
        )}
        <Button variant="primary" onClick={save} disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
