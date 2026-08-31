"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Check, X, ImagePlus } from "lucide-react";
import { renameCategory, deleteCategory } from "@/app/admin/categories/actions";
import { useServerRows } from "@/components/ui/use-server-rows";
import { SwipeRow } from "@/components/ui/swipe-row";
import { CollectionDetailsForm } from "@/components/admin/collection-details-form";
import type { CollectionDetails } from "@/app/admin/categories/actions";
import { useConfirm, type ConfirmOptions } from "@/components/ui/confirm-dialog";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  details: CollectionDetails;
};

function Row({
  category,
  confirm,
  onError,
  onDeleted,
  onRenamed,
  onDetails,
  refresh,
}: {
  category: CategoryRow;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  onError: (msg: string) => void;
  onDeleted: (id: string) => void;
  onRenamed: (id: string, name: string) => void;
  onDetails: (id: string, details: CollectionDetails) => void;
  refresh: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [editing, setEditing] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = name.trim() !== category.name && name.trim().length > 0;

  async function handleSave() {
    setSaving(true);
    const trimmed = name.trim();
    const result = await renameCategory(category.id, trimmed);
    setSaving(false);
    if (result.error) {
      onError(result.error);
      setName(category.name);
    } else {
      onRenamed(category.id, trimmed);
      setEditing(false);
      refresh();
    }
  }

  async function handleDelete() {
    if (category.productCount > 0) {
      onError(
        `Can't delete "${category.name}", ${category.productCount} product(s) are still assigned to it. Remove them from this category first.`
      );
      return;
    }
    const ok = await confirm({
      title: `Permanently delete "${category.name}"?`,
      description: "It's empty, so this can't be undone, there's nothing to restore.",
      confirmLabel: "Delete Forever",
      danger: true,
    });
    if (!ok) return;

    const result = await deleteCategory(category.id);
    if (result.error) onError(result.error);
    else {
      onDeleted(category.id);
      refresh();
    }
  }

  return (
    <SwipeRow actions={[{ key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: handleDelete }]}>
      <div className="px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditingDetails((v) => !v)}
            aria-expanded={editingDetails}
            aria-label={`Edit the ${category.name} collection`}
            title="Picture, description and SEO"
            className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-subtle transition-colors hover:border-brand-500"
          >
            {category.details.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary/pasted URLs, skip the image optimizer
              <img src={category.details.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="mx-auto h-4 w-4 text-ink-soft" />
            )}
          </button>
          <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && dirty) handleSave();
                  if (e.key === "Escape") {
                    setName(category.name);
                    setEditing(false);
                  }
                }}
                className="input h-8 w-48 text-sm"
              />
              {dirty && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  aria-label="Save name"
                  className="rounded p-1 text-brand-600 transition-colors hover:bg-brand-50 active:bg-brand-100 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setName(category.name);
                  setEditing(false);
                }}
                aria-label="Cancel"
                className="rounded p-1 text-ink-soft transition-colors hover:bg-subtle active:bg-subtle"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="truncate rounded text-left text-sm font-medium transition-colors hover:text-brand-600 active:text-brand-700"
              title="Click to rename"
            >
              {category.name}
            </button>
          )}
            <p className="text-xs text-ink-soft">
              /{category.slug} · {category.productCount} product(s)
            </p>
          </div>
        </div>

        {editingDetails && (
          <div className="mt-3 border-t border-border pt-3">
            <CollectionDetailsForm
              categoryId={category.id}
              initial={category.details}
              onSaved={(details) => onDetails(category.id, details)}
            />
          </div>
        )}
      </div>
    </SwipeRow>
  );
}

export function CategoryList({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useServerRows(categories);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  return (
    <div>
      {dialog}
      {error && <p className="mb-2 text-sm text-rose">{error}</p>}
      <div className="divide-y divide-border rounded-lg border border-border bg-white">
        {rows.map((cat) => (
          <Row
            key={cat.id}
            category={cat}
            confirm={confirm}
            onError={setError}
            onDeleted={(id) => setRows((r) => r.filter((c) => c.id !== id))}
            onRenamed={(id, name) => setRows((r) => r.map((c) => (c.id === id ? { ...c, name } : c)))}
            onDetails={(id, details) => setRows((r) => r.map((c) => (c.id === id ? { ...c, details } : c)))}
            refresh={() => router.refresh()}
          />
        ))}
        {rows.length === 0 && <p className="px-5 py-4 text-sm text-ink-soft">No categories yet.</p>}
      </div>
    </div>
  );
}
