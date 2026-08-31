"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, RotateCcw } from "lucide-react";
import { uploadFavicon } from "@/app/admin/theme/actions";
import { useToast } from "@/components/ui/toast";

/**
 * Picks a favicon and hands back its stored URL.
 *
 * Shown at the size it will actually be used rather than as a large preview.
 * A favicon is the one piece of artwork whose whole job is to be legible at
 * 16 pixels, and a mark that reads perfectly at 200px and turns to mush on a
 * tab is the mistake this field exists to make visible — so the preview is a
 * mock browser tab, not a picture of the file.
 */
export function FaviconUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadFavicon(data);
      if (result.error) toast.error(result.error);
      else if (result.url) {
        onChange(result.url);
        toast.success("Favicon uploaded.");
      }
    } catch {
      toast.error("Couldn't upload that favicon. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {/* A tab, roughly to scale, so the 16px question answers itself. */}
      <div className="rounded-lg border border-border bg-subtle p-2">
        <div className="flex w-fit max-w-full items-center gap-1.5 rounded-t-md bg-white px-2 py-1.5 shadow-sm">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded asset
            <img src={value} alt="" className="h-4 w-4 flex-shrink-0 rounded-sm object-contain" />
          ) : (
            <span className="h-4 w-4 flex-shrink-0 rounded-sm bg-border" />
          )}
          <span className="truncate text-[11px] text-ink-soft">Your store</span>
        </div>
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />}
          {busy ? "Uploading…" : value ? "Replace" : "Upload favicon"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Go back to no favicon"
            aria-label="Remove favicon"
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <p className="text-[11px] leading-snug text-ink-faint">
        A square PNG or SVG. It is drawn at about 16 pixels, so a whole wordmark
        will not survive, use the part of your mark that still reads that small.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".svg,.png,image/svg+xml,image/png"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
