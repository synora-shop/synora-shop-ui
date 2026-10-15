"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createCategory } from "@/app/admin/categories/actions";
import { FieldError } from "@/components/ui/primitives";
import { FieldLabel } from "@/components/merchant/form-shell";
import { SingleImageField } from "@/components/admin/single-image-field";

/**
 * Create collection (new admin, 15 October): the design's button, opening a
 * small form for a name and, if you like, a picture. Creating one also makes
 * its page, ready to add to a menu.
 */
export function AddCategoryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    const result = await createCategory(name.trim(), image.trim() || null);
    setSubmitting(false);
    if (result.error) return setError(result.error);
    setName("");
    setImage("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white">
        <Plus className="h-4 w-4" /> Create collection
      </button>
      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 px-3 backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
          <form role="dialog" aria-label="Create collection" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">Create collection</h2>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f5f5f5]"><X className="h-4 w-4" /></button>
            </div>
            <div>
              <FieldLabel htmlFor="new-collection">Name</FieldLabel>
              <input id="new-collection" autoFocus required value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer Lawn" className="h-10 w-full rounded-[10px] bg-[#f5f5f5] px-3 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:bg-white focus:ring-2 focus:ring-[#0a0a0a]" />
            </div>
            <SingleImageField value={image} onChange={setImage} folder="categories" label="Picture (optional)" hint="Without one, the card shows two of its products." />
            <p className="text-[13px] text-[#0a0a0a]/55">It gets its own page too, which you can add to your menus.</p>
            {error && <FieldError>{error}</FieldError>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-[10px] px-3.5 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">Cancel</button>
              <button type="submit" disabled={submitting || !name.trim()} className="h-9 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white disabled:opacity-50">{submitting ? "Creating…" : "Create"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
