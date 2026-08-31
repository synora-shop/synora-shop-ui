"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePageMeta } from "@/app/admin/pages/actions";
import { SaveButton, type SaveState } from "@/components/ui/save-button";

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
    <div className="mt-6 space-y-3 rounded-lg border border-border bg-white p-5">
      <h2 className="font-serif text-lg font-semibold">Page settings</h2>
      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">Title</label>
        <input
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          className="input mt-1"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">SEO title (optional)</label>
        <input
          value={seoTitle}
          onChange={(e) => {
            setSeoTitle(e.target.value);
            markDirty();
          }}
          className="input mt-1"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">SEO description (optional)</label>
        <textarea
          value={seoDescription}
          onChange={(e) => {
            setSeoDescription(e.target.value);
            markDirty();
          }}
          rows={2}
          className="input mt-1"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => {
            setIsPublished(e.target.checked);
            markDirty();
          }}
        />
        Published
      </label>
      <SaveButton state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState} onClick={handleSave} />
    </div>
  );
}
