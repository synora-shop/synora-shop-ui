"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, RefreshCw, X } from "lucide-react";
import { uploadImage } from "@/lib/actions/media";

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
export function SingleImageField({
  value,
  onChange,
  folder,
  label,
  hint,
  aspect = "aspect-[4/3]",
}: {
  value: string;
  onChange: (url: string) => void;
  /** Blob storage folder, so uploads stay sorted by what they belong to. */
  folder: string;
  label?: string;
  hint?: string;
  /** Tailwind aspect class — match the shape the image renders at on the site. */
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  async function upload(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
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
      {label && <label className="text-xs font-semibold uppercase text-ink-soft">{label}</label>}

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
        className={label ? "mt-1" : undefined}
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
        accept="image/*"
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
          className="input h-8 flex-1 text-xs"
        />
        <button
          type="button"
          onClick={applyUrl}
          disabled={!urlInput.trim()}
          className="rounded-full border border-border px-3 py-1.5 text-xs transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-40"
        >
          Use
        </button>
      </div>

      {hint && !error && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose">{error}</p>}
    </div>
  );
}
