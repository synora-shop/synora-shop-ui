"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCategory } from "@/app/admin/categories/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { SingleImageField } from "@/components/admin/single-image-field";

export function AddCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { confirm, dialog } = useConfirm();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const ok = await confirm({
      title: `Create category "${name.trim()}"?`,
      description:
        "This also creates a matching page for it, which you can then add to the header or footer from the Menus page.",
      confirmLabel: "Create Category",
    });
    if (!ok) return;

    setSubmitting(true);
    setError(null);
    const result = await createCategory(name.trim(), image.trim() || null);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setImage("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="h-fit space-y-3 rounded-lg border border-border bg-white p-5">
      {dialog}
      <h2 className="font-serif text-lg font-semibold">Add Category</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Name (e.g. Lawn)"
        className="input"
      />
      <SingleImageField
        value={image}
        onChange={setImage}
        folder="categories"
        label="Picture (optional)"
        hint="You can add or change it later, along with the description and SEO text."
      />
      {error && <p className="text-sm text-rose">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Add Category"}
      </button>
    </form>
  );
}
