"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, Pencil } from "lucide-react";
import { updatePageMeta } from "@/app/admin/pages/actions";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Field } from "@/components/merchant/form-shell";
import { Button, Fieldset } from "@/components/ui/primitives";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { addressProblem, toSlug } from "@/lib/page-address";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type PageMeta = {
  id: string;
  title: string;
  slug: string;
  systemKey: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
};

/**
 * A page's name and its address.
 *
 * The address follows the name until the merchant says otherwise. Typing
 * "Shipping and returns" writes /p/shipping-and-returns underneath as you go,
 * because the two agreeing is what a merchant wants nine times in ten and
 * having to think about the tenth is the part that annoys them. The moment
 * they edit the address by hand it stops following, and it never moves again
 * on its own — a link somebody has already shared must not be re-pointed by a
 * typo in the title.
 *
 * The home page has no address to edit: it is the site's front door, so there
 * is nothing after the slash. It says so rather than showing a locked field.
 */
export function PageSettingsForm({ page }: { page: PageMeta }) {
  const router = useRouter();
  const toast = useToast();
  const isHome = page.systemKey === "home";

  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [seoTitle, setSeoTitle] = useState(page.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(page.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(page.isPublished);
  const [saved, setSaved] = useState({
    title: page.title,
    slug: page.slug,
    seoTitle: page.seoTitle ?? "",
    seoDescription: page.seoDescription ?? "",
    isPublished: page.isPublished,
  });
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dirty =
    title !== saved.title ||
    slug !== saved.slug ||
    seoTitle !== saved.seoTitle ||
    seoDescription !== saved.seoDescription ||
    isPublished !== saved.isPublished;

  const problem = isHome ? null : addressProblem(slug);
  const moving = !isHome && slug !== saved.slug;

  function markDirty() {
    if (saveState !== "idle") setSaveState("idle");
  }

  function rename(next: string) {
    setTitle(next);
    // Only while the address is still the one we suggested. Once a merchant
    // has written their own, the title stops moving it.
    if (!slugTouched && !isHome) setSlug(toSlug(next));
    markDirty();
  }

  async function handleSave() {
    if (problem) return;
    setSaveState("saving");
    const formData = new FormData();
    formData.set("pageId", page.id);
    formData.set("title", title);
    formData.set("slug", slug);
    formData.set("seoTitle", seoTitle);
    formData.set("seoDescription", seoDescription);
    if (isPublished) formData.set("isPublished", "on");
    try {
      const result = await updatePageMeta(formData);
      if ("error" in result) {
        setSaveState("error");
        toast.error(result.error, { blocking: true });
        return;
      }
      setSlug(result.slug);
      setSaved({ title, slug: result.slug, seoTitle, seoDescription, isPublished });
      setSlugTouched(false);
      setEditingSlug(false);
      setSaveState("saved");
      router.refresh();
    } catch {
      setSaveState("error");
    }
  }

  return (
    <Fieldset
      title="Page settings"
      description="The name you see in this list, where the page lives, and what a search engine shows when it lists it."
    >
      <Field label="Name">
        <input
          required
          value={title}
          onChange={(e) => rename(e.target.value)}
          className="input"
        />
      </Field>

      {isHome ? (
        <Field label="Address" hint="The homepage is your store's front door, so there is nothing after the slash to change.">
          <p className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-subtle px-3 font-mono text-sm text-ink-soft">
            <Link2 className="h-3.5 w-3.5 flex-shrink-0" />/
          </p>
        </Field>
      ) : (
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Address</span>
          {editingSlug ? (
            <>
              <div className="flex items-center gap-2">
                <span className="flex-shrink-0 font-mono text-sm text-ink-faint">/p/</span>
                <input
                  autoFocus
                  value={slug}
                  onChange={(e) => {
                    setSlug(toSlug(e.target.value));
                    setSlugTouched(true);
                    markDirty();
                  }}
                  aria-invalid={problem ? true : undefined}
                  className={cn("input font-mono", problem && "border-rose")}
                />
              </div>
              <p className="mt-1.5 text-xs leading-snug text-ink-soft">
                {problem ? (
                  <span className="text-rose">{problem}</span>
                ) : moving ? (
                  <>
                    Saving moves the page. Anyone who has the old address is sent to the new one
                    automatically, and every menu that links to this page follows it.
                  </>
                ) : (
                  "Letters, numbers and hyphens. Spaces become hyphens as you type."
                )}
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <p className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-border bg-subtle px-3 font-mono text-sm text-ink-soft">
                <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">/p/{slug}</span>
              </p>
              <Button variant="secondary" size="sm" onClick={() => setEditingSlug(true)}>
                <Pencil className="h-3.5 w-3.5" />
                Change
              </Button>
            </div>
          )}
        </div>
      )}

      <Field label="SEO title" hint="Optional — the page name is used when this is blank.">
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
      <div className="flex items-center gap-2">
        <SaveButton
          state={dirty ? (saveState === "saving" ? "saving" : "idle") : saveState}
          onClick={handleSave}
        />
        {saveState === "saved" && !dirty && (
          <span className="flex items-center gap-1 text-xs text-green">
            <Check className="h-3.5 w-3.5" />
            Saved
          </span>
        )}
      </div>
    </Fieldset>
  );
}
