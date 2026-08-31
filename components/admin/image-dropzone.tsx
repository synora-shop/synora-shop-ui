"use client";

import { useRef, useState } from "react";
import { GripVertical, UploadCloud, X } from "lucide-react";
import { uploadImage } from "@/lib/actions/media";
import { useConfirm } from "@/components/ui/confirm-dialog";

// Reusable multi-image field: drag files in from the desktop, click to
// browse (multi-select supported), reorder by dragging thumbnails, or paste
// an image URL directly (kept as a fallback for when Blob upload isn't
// configured, or for pulling in an image already hosted elsewhere).
export function ImageDropzone({
  images,
  onChange,
  folder,
  label = "Images",
}: {
  images: string[];
  onChange: (images: string[]) => void;
  folder: string;
  label?: string;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(0); // count of in-flight uploads
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // State rather than the ref above, because this drives how the tile looks and
  // a ref change does not re-render.
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const { confirm, dialog } = useConfirm();

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setError(null);
    setUploading(list.length);
    const results = await Promise.all(
      list.map(async (file) => {
        const formData = new FormData();
        formData.set("file", file);
        return uploadImage(formData, folder);
      })
    );
    setUploading(0);

    const urls = results.filter((r): r is { url: string } => "url" in r).map((r) => r.url);
    const firstError = results.find((r): r is { error: string } => "error" in r);
    if (urls.length > 0) onChange([...images, ...urls]);
    if (firstError) setError(firstError.error);
  }

  function addImageUrl() {
    const url = urlInput.trim();
    if (!url) return;
    onChange([...images, url]);
    setUrlInput("");
  }

  async function removeImage(index: number) {
    const ok = await confirm({
      title: "Remove this image?",
      description: index === 0 && images.length > 1 ? "It's the primary image, the next one takes its place." : undefined,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    onChange(images.filter((_, i) => i !== index));
  }

  function moveImage(from: number, to: number) {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function handleDrop(index: number) {
    const from = dragIndex.current;
    setDragOverIndex(null);
    dragIndex.current = null;
    if (from === null || from === index) return;
    moveImage(from, index);
  }

  return (
    <div>
      {dialog}
      <label className="text-xs font-semibold uppercase text-ink-soft">
        {label} {images.length > 1 && "(first is primary, drag to reorder)"}
      </label>

      {images.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              draggable
              onDragStart={() => {
                dragIndex.current = i;
                setDraggingIndex(i);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDragLeave={() => setDragOverIndex((cur) => (cur === i ? null : cur))}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => {
                dragIndex.current = null;
                setDraggingIndex(null);
                setDragOverIndex(null);
              }}
              className={`group relative aspect-[4/5] cursor-grab overflow-hidden rounded-lg border bg-subtle transition-shadow active:cursor-grabbing ${
                dragOverIndex === i ? "border-brand-500 ring-2 ring-brand-300" : "border-border"
              } ${draggingIndex === i ? "opacity-60 shadow-lg" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary/pasted URLs, skip the image optimizer */}
              <img src={url} alt="" className="h-full w-full object-cover" />

              {i === 0 && images.length > 1 && (
                <span className="absolute left-1 top-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Primary
                </span>
              )}

              <div className="absolute inset-x-0 top-1 flex items-center justify-between px-1">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="Remove image"
                  className="rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-rose active:bg-rose"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {images.length > 1 && (
                <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveImage(i, i - 1)}
                    disabled={i === 0}
                    aria-label="Move image earlier"
                    className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white transition-colors hover:bg-black/80 active:bg-black disabled:opacity-30"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(i, i + 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move image later"
                    className="rounded bg-black/60 px-1.5 py-0.5 text-xs text-white transition-colors hover:bg-black/80 active:bg-black disabled:opacity-30"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className={`mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-xs text-ink-soft transition-colors ${
          isDraggingOver ? "border-brand-500 bg-brand-50" : "border-border hover:bg-subtle active:bg-subtle"
        }`}
      >
        <UploadCloud className="h-5 w-5 text-brand-500" />
        {uploading > 0 ? (
          <span>Uploading {uploading} image{uploading > 1 ? "s" : ""}…</span>
        ) : (
          <span>
            Drag images here, or <span className="text-brand-600 underline-scribble">browse</span>
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>

      <div className="mt-2 flex items-center gap-1">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addImageUrl();
            }
          }}
          placeholder="Or paste an image URL…"
          className="input h-8 w-56 text-xs"
        />
        <button
          type="button"
          onClick={addImageUrl}
          className="rounded border border-border px-2 py-1 text-xs text-ink-soft transition-colors hover:bg-subtle active:bg-subtle"
        >
          Add
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-rose">{error}</p>}
    </div>
  );
}
