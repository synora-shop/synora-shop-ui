"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, ImageOff, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { ListEmpty } from "@/components/admin/list-empty";
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
export function MediaLibrary({
  assets,
  searching,
  view = "grid",
}: {
  assets: Asset[];
  searching: boolean;
  view?: "list" | "grid";
}) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [copied, setCopied] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (assets.length === 0) {
    return searching ? (
      <ListEmpty filtered basePath="/admin/data" thing="files" />
    ) : (
      <EmptyState
        icon={ImageOff}
        title="Nothing uploaded yet"
        description="Pictures you add to a product, a page or your logo appear here automatically, ready to use again."
      />
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

  if (view === "list") {
    return (
      <>
        <div className="divide-y divide-border rounded-xl border border-border bg-surface">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 lg:gap-4"
            >
              <div className="h-11 w-11 overflow-hidden rounded-lg border border-border bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs
                    are arbitrary hosts; next/image would need each one allowed. */}
                <img src={asset.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{asset.filename}</p>
                <p className="truncate text-xs text-ink-faint">
                  {asset.format.toUpperCase()} · {formatSize(asset.size)}
                  {asset.folder && ` · ${asset.folder}`}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => copy(asset)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs transition-colors",
                    copied === asset.id
                      ? "border-green/40 bg-green-bg text-green"
                      : "border-border text-ink-soft hover:bg-subtle hover:text-ink"
                  )}
                >
                  {copied === asset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === asset.id ? "Copied" : "Copy link"}
                </button>
                {/* The rarer two recede until the row is under the pointer, the
                    same as every other list in the panel. */}
                <div className="flex items-center gap-1 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${asset.filename} in a new tab`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(asset)}
                    disabled={pending}
                    aria-label={`Delete ${asset.filename}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-rose-bg hover:text-rose disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {dialog}
      </>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {assets.map((asset) => (
          <li
            key={asset.id}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-sm"
          >
            {/* The picture is the button. Copying the address is what a merchant
                comes here to do — every image field in the admin accepts a
                pasted URL — so it is the whole tile rather than one of three
                pills competing with the picture for attention. */}
            <button
              type="button"
              onClick={() => copy(asset)}
              aria-label={`Copy the address of ${asset.filename}`}
              className="block w-full text-left"
            >
              {/* Chequerboard behind the picture, so a transparent PNG reads as
                  transparent rather than as a white rectangle. */}
              <span className="relative flex aspect-square items-center justify-center bg-[length:16px_16px] bg-[position:0_0,8px_8px] bg-[image:linear-gradient(45deg,#e4e4e4_25%,transparent_25%,transparent_75%,#e4e4e4_75%),linear-gradient(45deg,#e4e4e4_25%,transparent_25%,transparent_75%,#e4e4e4_75%)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- Blob URLs
                    are arbitrary hosts; next/image would need each one allowed. */}
                <img
                  src={asset.url}
                  alt={asset.filename}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity",
                    copied === asset.id
                      ? "bg-green/15 opacity-100"
                      : "bg-ink/35 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-medium shadow-sm",
                      copied === asset.id ? "bg-green text-white" : "bg-white text-ink"
                    )}
                  >
                    {copied === asset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === asset.id ? "Copied" : "Copy link"}
                  </span>
                </span>
              </span>
              <span className="block space-y-0.5 p-2.5">
                <span className="block truncate text-xs font-medium text-ink" title={asset.filename}>
                  {asset.filename}
                </span>
                <span className="block text-[11px] text-ink-faint">
                  {asset.format.toUpperCase()} · {formatSize(asset.size)}
                  {asset.folder && ` · ${asset.folder}`}
                </span>
              </span>
            </button>

            {/* Opening and deleting are rarer, so they sit on the picture and
                come forward on hover. Always visible below lg: a finger has no
                hover, and an invisible delete is no delete. */}
            <div className="absolute right-1.5 top-1.5 flex items-center gap-1 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
              <a
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${asset.filename} in a new tab`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-ink"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => remove(asset)}
                disabled={pending}
                aria-label={`Delete ${asset.filename}`}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-rose disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
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
