"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCollectionDetails, type CollectionDetails } from "@/app/admin/categories/actions";
import { SingleImageField } from "@/components/admin/single-image-field";

/**
 * Everything about a collection except its name.
 *
 * updateCollectionDetails could already save all of this and nothing called it,
 * so a category's picture, description and SEO text were unreachable from the
 * admin — the picture could only be set by pasting a URL at the moment the
 * category was created, and the other three not at all.
 *
 * Name is deliberately not here: renaming moves the slug and every link to it,
 * which is why the action keeps them apart, and the list edits it in place.
 */
export function CollectionDetailsForm({
  categoryId,
  initial,
  onSaved,
}: {
  categoryId: string;
  initial: CollectionDetails;
  onSaved?: (details: CollectionDetails) => void;
}) {
  const router = useRouter();
  const [details, setDetails] = useState<CollectionDetails>(initial);
  const [saved, setSaved] = useState<CollectionDetails>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(details) !== JSON.stringify(saved);
  const set = <K extends keyof CollectionDetails>(key: K, value: CollectionDetails[K]) =>
    setDetails((d) => ({ ...d, [key]: value }));

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateCollectionDetails(categoryId, details);
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(details);
    onSaved?.(details);
    router.refresh();
  }

  // The same limits the action enforces, shown before it refuses rather than
  // after — search engines truncate past roughly these lengths anyway.
  const counter = (value: string, max: number) => (
    <span className={value.length > max ? "text-rose" : "text-ink-faint"}>
      {value.length}/{max}
    </span>
  );

  return (
    <div className="space-y-3">
      <SingleImageField
        value={details.image}
        onChange={(url) => set("image", url)}
        folder="categories"
        label="Picture"
        hint="Shown wherever this collection is listed."
        aspect="aspect-[16/9]"
      />

      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">Description</label>
        <textarea
          value={details.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="Shown at the top of the collection page."
          className="input mt-1 w-full text-sm"
        />
        <p className="mt-0.5 text-right text-[11px]">{counter(details.description, 2000)}</p>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">SEO title</label>
        <input
          value={details.seoTitle}
          onChange={(e) => set("seoTitle", e.target.value)}
          placeholder="Defaults to the collection name."
          className="input mt-1 w-full text-sm"
        />
        <p className="mt-0.5 text-right text-[11px]">{counter(details.seoTitle, 120)}</p>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase text-ink-soft">SEO description</label>
        <textarea
          value={details.seoDescription}
          onChange={(e) => set("seoDescription", e.target.value)}
          rows={2}
          placeholder="The sentence under the link in search results."
          className="input mt-1 w-full text-sm"
        />
        <p className="mt-0.5 text-right text-[11px]">{counter(details.seoDescription, 320)}</p>
      </div>

      {error && <p className="text-sm text-rose">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40"
        >
          {saving ? "Saving…" : dirty ? "Save" : "Saved"}
        </button>
        {dirty && !saving && (
          <button
            type="button"
            onClick={() => {
              setDetails(saved);
              setError(null);
            }}
            className="text-xs text-ink-soft underline-scribble transition-colors hover:text-ink"
          >
            Discard
          </button>
        )}
      </div>
    </div>
  );
}
