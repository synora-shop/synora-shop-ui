"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImageIcon, Pencil, Trash2, X } from "lucide-react";
import { renameCategory, deleteCategory } from "@/app/admin/categories/actions";
import { useServerRows } from "@/components/ui/use-server-rows";
import { CollectionDetailsForm } from "@/components/admin/collection-details-form";
import type { CollectionDetails } from "@/app/admin/categories/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

/**
 * Collections as the design draws them (new admin, 15 October): a card each,
 * with the collection's own picture or two of its products, its name and how
 * many products it holds. Everything the old list did is still here: rename
 * in place, picture, description and SEO, and delete once it is empty.
 */
type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  previews: string[];
  details: CollectionDetails;
};

export function CategoryList({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useServerRows(categories);
  const { confirm, dialog } = useConfirm();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<CategoryRow | null>(null);

  async function rename(c: CategoryRow) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === c.name) return setRenaming(null);
    const result = await renameCategory(c.id, trimmed);
    if (result.error) return toast.error(result.error, { blocking: true });
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, name: trimmed } : x)));
    setRenaming(null);
    toast.success("Renamed. Every menu link follows.");
    router.refresh();
  }

  async function remove(c: CategoryRow) {
    if (c.productCount > 0) {
      toast.error(`"${c.name}" still has ${c.productCount} product${c.productCount === 1 ? "" : "s"}. Take them out of it first.`, { blocking: true });
      return;
    }
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      description: "It is empty, so nothing is lost, but this cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const result = await deleteCategory(c.id);
    if (result.error) return toast.error(result.error, { blocking: true });
    setRows((r) => r.filter((x) => x.id !== c.id));
    router.refresh();
  }

  return (
    <>
      {dialog}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((c) => {
          const pictures = c.details.image ? [c.details.image] : c.previews.slice(0, 2);
          return (
            <article key={c.id} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
              <Link href={`/admin/products?category=${c.slug}`} aria-label={`Products in ${c.name}`} className="flex aspect-[4/3] gap-0.5 overflow-hidden bg-[#f0f0f0]">
                {pictures.length === 0 ? (
                  <span className="grid flex-1 place-items-center text-[#0a0a0a]/30"><ImageIcon className="h-8 w-8" /></span>
                ) : (
                  pictures.map((src) => (
                    <span key={src} className="relative min-w-0 flex-1">
                      {/* eslint-disable-next-line @next/next/no-img-element -- merchants' own pictures, from any host they used */}
                      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    </span>
                  ))
                )}
              </Link>
              <div className="flex items-start gap-2 p-4">
                <div className="min-w-0 flex-1">
                  {renaming === c.id ? (
                    <span className="flex items-center gap-1">
                      <input
                        autoFocus
                        aria-label="Collection name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") rename(c);
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        className="h-8 w-full min-w-0 rounded-lg bg-[#f5f5f5] px-2 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]"
                      />
                      <button type="button" aria-label="Save name" onClick={() => rename(c)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f5f5f5]"><Check className="h-4 w-4" /></button>
                      <button type="button" aria-label="Cancel" onClick={() => setRenaming(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f5f5f5]"><X className="h-4 w-4" /></button>
                    </span>
                  ) : (
                    <button type="button" title="Rename" onClick={() => { setName(c.name); setRenaming(c.id); }} className="block max-w-full truncate text-left text-[15px] font-semibold hover:underline">
                      {c.name}
                    </button>
                  )}
                  <p className="text-[13px] text-[#0a0a0a]/55">{c.productCount} product{c.productCount === 1 ? "" : "s"} · /{c.slug}</p>
                </div>
                <button type="button" aria-label={`Picture, description and SEO for ${c.name}`} title="Picture, description and SEO" onClick={() => setEditing(c)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#0a0a0a]/55 hover:bg-[#f5f5f5] hover:text-[#0a0a0a]">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" aria-label={`Delete ${c.name}`} title={c.productCount > 0 ? "Empty it first" : "Delete"} onClick={() => remove(c)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#a3330c]/70 hover:bg-[#ffe9e2] hover:text-[#a3330c]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 px-3 backdrop-blur-[2px]" onMouseDown={() => setEditing(null)}>
          <div role="dialog" aria-label={`Edit ${editing.name}`} onMouseDown={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold">{editing.name}</h2>
              <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#f5f5f5]"><X className="h-4 w-4" /></button>
            </div>
            <CollectionDetailsForm
              categoryId={editing.id}
              initial={editing.details}
              onSaved={(details) => {
                setRows((r) => r.map((x) => (x.id === editing.id ? { ...x, details } : x)));
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
