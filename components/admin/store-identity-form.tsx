"use client";

import { useState } from "react";
import { SingleImageField } from "@/components/admin/single-image-field";
import { useEditor } from "@/components/admin/use-editor";
import { FieldError, Fieldset, SectionDivider } from "@/components/ui/primitives";
import { saveStoreIdentity, type StoreIdentity } from "@/app/admin/identity-actions";
import { useToast } from "@/components/ui/toast";
import { FieldHint, FieldLabel } from "@/components/merchant/form-shell";
import {
  FAVICON_ACCEPT,
  FAVICON_FORMATS_LABEL,
  type BrandMarks,
  faviconProblem,
  pickLogo,
} from "@/lib/brand-marks";

/**
 * What the shop is called, what it looks like, and where to find it.
 *
 * These were spread across three screens — the name under store defaults, the
 * logo inside the live editor, the address on a Locations page a shop with one
 * address had no reason to visit. They are the first things a merchant fills
 * in and the ones they come back to, so they are the landing page.
 *
 * Built on Fieldset, like every other settings screen. It was the last one on
 * the pattern Fieldset replaced — two cards in a two-column grid, each
 * stretched to the full width of a 1500px panel around a form a third that
 * wide, and the two ending at different heights because nothing made them
 * agree. The explanation now sits beside the control it explains, and a column
 * of these scans as a list of decisions.
 */
export function StoreIdentityForm({ initial }: { initial: StoreIdentity }) {
  const [values, setValues] = useState(initial);
  // What the server last accepted, not what it sent on first render — without
  // this the form stays "dirty" after a successful save until a refresh lands.
  const [saved, setSaved] = useState(initial);
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  const set = <K extends keyof StoreIdentity>(key: K, value: StoreIdentity[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const setMark = <K extends keyof BrandMarks>(key: K, value: string) =>
    setValues((v) => ({ ...v, marks: { ...v.marks, [key]: value } }));

  const faviconIssue = faviconProblem(values.marks.faviconUrl);

  async function save() {
    if (faviconIssue) {
      toast.error(faviconIssue);
      return;
    }
    setPending(true);
    try {
      const result = await saveStoreIdentity(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setSaved(values);
      toast.success("Saved");
    } finally {
      setPending(false);
    }
  }

  // Discard and Save live in the action bar at the top of the screen, with
  // every other screen's — see components/admin/use-editor.ts. Registering here
  // also guards the work against the tab closing, a link, and the back button.
  useEditor({ dirty, saving: pending, onSave: save, onDiscard: () => setValues(saved) });

  /**
   * One slot in the logo matrix.
   *
   * The label and the hint are handed to SingleImageField rather than drawn
   * here: it renders both itself, and the first version of this drew its own
   * as well, so every slot carried its name twice.
   */
  const slot = (key: keyof BrandMarks, label: string, hint: string) => (
    <div className="min-w-0">
      <SingleImageField
        folder="brand"
        aspect="aspect-[3/1]"
        value={values.marks[key]}
        onChange={(url) => setMark(key, url)}
        label={label}
        hint={hint}
      />
    </div>
  );

  const main = values.marks.logoUrl.trim();

  return (
    <div className="space-y-2.5">
      <Fieldset
        title="Store name"
        description="Shown in the browser tab, on your storefront, and on every email you send. It is also what customers see in place of a logo if you have not added one."
      >
        <div>
          <FieldLabel htmlFor="storeName">Name</FieldLabel>
          <input
            id="storeName"
            className="input"
            value={values.storeName}
            onChange={(e) => set("storeName", e.target.value)}
            placeholder="What customers call your shop"
            maxLength={60}
          />
        </div>
      </Fieldset>

      <SectionDivider
        title="Your marks"
        description="Set here and nowhere else. Themes read these and pick whichever suits the place they are drawing — a dark header, a narrow phone — so a theme never has to be told which logo to use."
      />

      <Fieldset
        title="Logo"
        description="Only the first is needed. The other three are for places the main one would not suit, and anything you leave empty falls back to the nearest one you have filled in."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {slot("logoUrl", "Main logo", "Used everywhere unless something below fits better.")}
          {slot("logoDarkUrl", "On dark", "For a dark header or footer, where the main mark would disappear.")}
          {slot("logoCompactUrl", "Compact", "A monogram or icon, for phones where a wordmark cannot be read.")}
          {slot("logoCompactDarkUrl", "Compact, on dark", "The monogram, for a dark header on a phone.")}
        </div>

        {!main && (
          <p className="text-xs leading-snug text-ink-soft">
            With no main logo your store name is used instead, in your storefront&rsquo;s heading
            face.
          </p>
        )}
        {!main && pickLogo(values.marks, { compact: true }) && (
          <FieldError size="xs">
            You have a compact mark but no main logo, so wide screens fall back to your store name
            while phones show the mark. Add a main logo, or clear the compact one.
          </FieldError>
        )}
      </Fieldset>

      <Fieldset
        title="Favicon"
        description={`The small icon on a browser tab and in a bookmark. ${FAVICON_FORMATS_LABEL} only — other formats upload fine and then never appear, which is a fault nobody can diagnose from in here. Leave it empty and your main logo is used.`}
      >
        <div className="max-w-56">
          <SingleImageField
            folder="brand"
            aspect="aspect-square"
            accept={FAVICON_ACCEPT}
            value={values.marks.faviconUrl}
            onChange={(url) => setMark("faviconUrl", url)}
            label="Icon file"
            hint="It is drawn at about 16 pixels, so use the part of your mark that still reads that small rather than a full wordmark."
          />
        </div>
        {faviconIssue && <FieldError size="xs">{faviconIssue}</FieldError>}
      </Fieldset>

      <SectionDivider
        title="Where to find you"
        description="Shown on your contact page, and used as the return address on anything you send."
      />

      <Fieldset title="Address" description="The one that answers “where is this business”.">
        <div>
          <FieldLabel htmlFor="address">Street and building</FieldLabel>
          <input
            id="address"
            className="input"
            value={values.address}
            onChange={(e) => set("address", e.target.value)}
            maxLength={200}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <input
              id="city"
              className="input"
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <FieldLabel htmlFor="phone">Phone</FieldLabel>
            <input
              id="phone"
              type="tel"
              className="input"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={40}
            />
          </div>
        </div>
      </Fieldset>

      <Fieldset
        title="Contact email"
        description="Where customers reach you. Not the address you sign in with."
      >
        <div>
          <FieldLabel htmlFor="contactEmail">Email</FieldLabel>
          <input
            id="contactEmail"
            type="email"
            className="input"
            value={values.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="hello@yourshop.com"
            maxLength={120}
          />
          <FieldHint>Shown publicly, so use one you are happy to publish.</FieldHint>
        </div>
      </Fieldset>
    </div>
  );
}
