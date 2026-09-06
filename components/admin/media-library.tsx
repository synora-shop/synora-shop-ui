"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, ImageOff, Trash2 } from "lucide-react";
import { deleteAsset } from "@/app/admin/data/actions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export type Asset = {
  id: string;
  url: string;
  filename: string;
  format: string;
  size: number;
  folder: string;
  uploadedAt: string;
};

/**
 * The uploaded files, as a grid of what they look like.
 *
 * A list of filenames would be useless here: nobody names an image usefully,
 * and the only reliable way to find "the one with the blue background" is to
 * see it. So the thumbnail is the row, and the name is the caption.
 *
 * Copying the address is the main action, because that is what a merchant
 * actually needs — every image field in the admin accepts a pasted URL, so the
 * library is useful before it is wired into the pickers.
 */
export function MediaLibrary({ assets, searching }: { assets: Asset[]; searching: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-6 py-14 text-center">
        <ImageOff className="h-6 w-6 text-ink-faint" aria-hidden />
        <p className="text-sm font-medium">
          {searching ? "No files match that." : "Nothing uploaded yet."}
        </p>
        <p className="max-w-sm text-xs text-ink-soft">
          {searching
            ? "Try a shorter word, or clear the search."
            : "Pictures you add to a product, a page or your logo appear here automatically, ready to use again."}
        </p>
      </div>
    );
  }

  async function copy(asset: Asset) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(asset.id);
      setTimeout(() => setCopied((c) => (c === asset.id ? null : c)), 1600);
    } catch {
      // Clipboard access is refused in some browsers without a user gesture it
      // recognises. Saying so beats a button that appears to do nothing.
      toast.error("Your browser wouldn't let us copy that. Select the address and copy it by hand.");
    }
  }

  async function remove(asset: Asset) {
    const ok = await confirm({
      title: `Delete ${asset.filename}?`,
      // The honest warning. There is no reference count here, so this cannot
      // promise the file is unused — and quietly breaking a product photo is
      // worse than asking.
      description: "This removes the file for good. Anywhere it is being used — a product, a page, your logo — will be left with a broken picture.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteAsset(asset.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success("File deleted.");
        router.refresh();
      }
    });
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {assets.map((asset) => (
          <li
            key={asset.id}
            className="group overflow-hidden rounded-xl border border-border bg-surface"
          >
            {/* Chequerboard behind the picture, so a transparent PNG reads as
                transparent rather than as a white rectangle. */}
            <div
              className="flex aspect-square items-center justify-center bg-[length:16px_16px] bg-[position:0_0,8px_8px] bg-[image:linear-gradient(45deg,#e4e4e4_25%,transparent_25%,transparent_75%,#e4e4e4_75%),linear-gradient(45deg,#e4e4e4_25%,transparent_25%,transparent_75%,#e4e4e4_75%)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs
                  are arbitrary hosts; next/image would need each one allowed. */}
              <img
                src={asset.url}
                alt={asset.filename}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="space-y-1.5 p-2.5">
              <p className="truncate text-xs font-medium" title={asset.filename}>
                {asset.filename}
              </p>
              <p className="text-[11px] text-ink-soft">
                {asset.format.toUpperCase()} · {formatSize(asset.size)}
                {asset.folder && ` · ${asset.folder}`}
              </p>
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => copy(asset)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1 rounded-pill border border-border px-2 py-1 text-[11px] transition-colors hover:bg-subtle",
                    copied === asset.id && "border-green/40 bg-green-bg text-green"
                  )}
                >
                  {copied === asset.id ? (
                    <>
                      <Check className="h-3 w-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy link
                    </>
                  )}
                </button>
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${asset.filename} in a new tab`}
                  className="rounded-pill border border-border p-1.5 text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
                <button
                  type="button"
                  onClick={() => remove(asset)}
                  disabled={pending}
                  aria-label={`Delete ${asset.filename}`}
                  className="rounded-pill border border-border p-1.5 text-ink-soft transition-colors hover:border-rose/40 hover:bg-rose-bg hover:text-rose disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {dialog}
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
