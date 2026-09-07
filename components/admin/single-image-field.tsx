"use client";

import { useRef, useState } from "react";
import { FieldError, buttonClass } from "@/components/ui/primitives";
import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { uploadImage } from "@/lib/actions/media";
import { FieldLabel } from "@/components/merchant/form-shell";

/**
 * One image, uploaded or pasted.
 *
 * ImageDropzone is the multi-image field — it sorts, marks a primary and takes
 * several files at once, all of which is noise when exactly one image is
 * wanted. Three places had grown their own wrapper that handed it a
 * single-element array and kept the last item, which worked but showed the
 * merchant a reorder handle and a "Primary" badge for a list of one.
 *
 * Replacing is the common action, not adding: a category or a section already
 * has a picture and the merchant wants a different one. So the current image is
 * the control — click it to swap, with remove kept separate and explicit.
 */
/**
 * An `accept` list said out loud, for the message shown when a file is refused.
 *
 * Derived rather than passed in beside it, so the rule and the sentence about
 * the rule cannot drift — the failure mode there is a field that refuses PNGs
 * while telling you PNGs are fine.
 */
function acceptLabel(accept: string): string {
  const names = accept
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
    .map((rule) => {
      if (rule.startsWith(".")) return rule.slice(1).toUpperCase();
      const subtype = rule.split("/")[1] ?? "";
      if (subtype === "svg+xml") return "SVG";
      if (subtype.includes("icon")) return "ICO";
      if (!subtype || subtype === "*") return "";
      return subtype.toUpperCase();
    })
    .filter(Boolean);

  const unique = [...new Set(names)];
  if (unique.length === 0) return "an image";
  if (unique.length === 1) return `a ${unique[0]} file`;
  return `${unique.slice(0, -1).join(", ")} or ${unique[unique.length - 1]}`;
}

export function SingleImageField({
  value,
  onChange,
  folder,
  label,
  hint,
  aspect = "aspect-[4/3]",
  accept = "image/*",
}: {
  value: string;
  onChange: (url: string) => void;
  /** Blob storage folder, so uploads stay sorted by what they belong to. */
  folder: string;
  label?: string;
  hint?: string;
  /** Tailwind aspect class — match the shape the image renders at on the site. */
  aspect?: string;
  /**
   * Narrows what may be chosen, for a field whose destination accepts less
   * than a page does. The favicon is the case: a browser tab draws far fewer
   * formats than an <img>, and WebP is the trap — it previews perfectly here
   * and renders as a blank square on the tab.
   *
   * Enforced on drop as well as in the picker. `accept` on a file input is a
   * filter, not a rule; dragging a file in bypasses it entirely.
   */
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  /** Whether a file matches `accept`, which is a list of types and extensions. */
  function allowed(file: File): boolean {
    if (accept === "image/*") return file.type.startsWith("image/");
    const name = file.name.toLowerCase();
    return accept.split(",").some((rule) => {
      const want = rule.trim().toLowerCase();
      if (!want) return false;
      if (want.startsWith(".")) return name.endsWith(want);
      if (want.endsWith("/*")) return file.type.startsWith(want.slice(0, -1));
      return file.type === want;
    });
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    // Said rather than ignored. A drop that silently does nothing reads as the
    // upload being broken, and the merchant tries the same file again.
    if (!allowed(file)) {
      setError(`That format can't be used here. Choose ${acceptLabel(accept)}.`);
      return;
    }
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadImage(formData, folder);
    setUploading(false);
    if ("error" in result) setError(result.error);
    else onChange(result.url);
  }

  function applyUrl() {
    const url = urlInput.trim();
    if (!url) return;
    onChange(url);
    setUrlInput("");
    setError(null);
  }

  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDraggingOver(true);
        }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDraggingOver(false);
          upload(e.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          <div
            className={`group relative w-full overflow-hidden rounded-lg border border-border bg-subtle ${aspect}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary/pasted URLs, skip the image optimizer */}
            <img src={value} alt="" className="h-full w-full object-cover" />

            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100 focus-within:bg-black/40 focus-within:opacity-100">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink shadow transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {uploading ? "Uploading…" : "Change"}
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Remove image"
                className="rounded-full bg-white p-1.5 text-rose shadow transition-colors hover:bg-rose hover:text-white active:bg-rose"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className={`flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-xs text-ink-soft transition-colors ${aspect} ${
              draggingOver ? "border-brand-500 bg-brand-50" : "border-border hover:bg-subtle active:bg-subtle"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-5 w-5 text-brand-500" />
                <span>
                  Drag an image here, or <span className="text-brand-600 underline-scribble">browse</span>
                </span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept={accept}
        // Hidden behind a button that opens it, but still a control: a screen
        // reader that reaches it should hear what it is for.
        aria-label={label ? `Choose a file for ${label.toLowerCase()}` : "Choose an image file"}
        onChange={(e) => {
          upload(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="hidden"
      />

      {/* Kept for images already hosted elsewhere, and for when Blob upload
          isn't configured — same fallback ImageDropzone offers. */}
      <div className="mt-2 flex items-center gap-1">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyUrl();
            }
          }}
          placeholder="or paste an image URL"
          aria-label="Image address"
          className="input input-sm flex-1"
        />
        <button
          type="button"
          onClick={applyUrl}
          disabled={!urlInput.trim()}
          className={buttonClass("secondary", "sm")}
        >
          Use
        </button>
      </div>

      {hint && !error && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <FieldError size="xs" className="mt-1">{error}</FieldError>}
    </div>
  );
}
