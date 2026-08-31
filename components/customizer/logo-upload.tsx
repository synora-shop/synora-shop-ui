"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, RotateCcw } from "lucide-react";
import { uploadLogo } from "@/app/admin/theme/actions";
import { BUILTIN_LOGO } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast";

/**
 * Picks a logo file and hands back its stored URL.
 *
 * Kept separate from the general image field because a logo may be an SVG, and
 * SVG is a document format rather than just an image — it goes through the
 * sanitising upload action instead of the ordinary one. The preview sits on
 * both a light and a dark swatch, since the one thing you cannot tell from a
 * file picker is whether a mark disappears against the header it will land on.
 */
export function LogoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  const current = value || BUILTIN_LOGO;
  const isCustom = Boolean(value);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const data = new FormData();
      data.set("file", file);
      const result = await uploadLogo(data);
      if (result.error) toast.error(result.error);
      else if (result.url) {
        onChange(result.url);
        toast.success("Logo uploaded.");
      }
    } catch {
      toast.error("Couldn't upload that logo. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { bg: "#ffffff", label: "On light" },
          { bg: "#1a1a1a", label: "On dark" },
        ].map((swatch) => (
          <div key={swatch.label} className="overflow-hidden rounded border border-border">
            <div className="flex h-14 items-center justify-center px-2" style={{ backgroundColor: swatch.bg }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- preview of an uploaded asset */}
              <img src={current} alt="" className="max-h-8 max-w-full object-contain" />
            </div>
            <p className="bg-white py-0.5 text-center text-[9px] text-ink-faint">{swatch.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-subtle active:bg-brand-100 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />}
          {busy ? "Uploading…" : isCustom ? "Replace" : "Upload logo"}
        </button>
        {isCustom && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Go back to the logo the store shipped with"
            className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

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
