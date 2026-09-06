"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePageMeta } from "@/app/admin/pages/actions";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Field } from "@/components/merchant/form-shell";
import { Fieldset } from "@/components/ui/primitives";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

type PageMeta = {
  id: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
};

export function PageSettingsForm({ page }: { page: PageMeta }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [saved, setSaved] = useState({ title, seoTitle, seoDescription, isPublished });
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dirty =
    title !== saved.title ||
    seoTitle !== saved.seoTitle ||
    seoDescription !== saved.seoDescription ||
    isPublished !== saved.isPublished;

  function markDirty() {
    if (saveState !== "idle") setSaveState("idle");
  }

  async function handleSave() {
    setSaveState("saving");
    const formData = new FormData();
    formData.set("pageId", page.id);
    formData.set("title", title);
    formData.set("seoTitle", seoTitle);
    formData.set("seoDescription", seoDescription);
    if (isPublished) formData.set("isPublished", "on");
    try {
      await updatePageMeta(formData);
      setSaved({ title, seoTitle, seoDescription, isPublished });
      setSaveState("saved");
      router.refresh();
    } catch {
      setSaveState("error");
    }
  }

  return (
    <Fieldset
      title="Page settings"
      description="The name you see in this list, and what a search engine shows when it lists the page."
    >
      <Field label="Title">
        <input
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          className="input"
        />
      </Field>
      <Field label="SEO title" hint="Optional — the page title falls back to the one above.">
        <input
          value={seoTitle}
          onChange={(e) => {
            setSeoTitle(e.target.value);
            markDirty();
          }}
          className="input"
        />
      </Field>
      <Field label="SEO description" hint="Optional — the sentence under the link in search results.">
        <textarea
          value={seoDescription}
          onChange={(e) => {
            setSeoDescription(e.target.value);
            markDirty();
          }}
          rows={2}
          className="input"
        />
      </Field>
      <ToggleSwitch
        inline
        label="Published"
        checked={isPublished}
        onChange={(v) => {
          setIsPublished(v);
          markDirty();
        }}
      />
      <SaveButton state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState} onClick={handleSave} />
    </Fieldset>
  );
}
