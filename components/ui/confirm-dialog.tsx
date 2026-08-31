"use client";

import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the icon/confirm button as destructive (rose) instead of the default brand color. */
  danger?: boolean;
};

type PendingConfirm = ConfirmOptions & { resolve: (result: boolean) => void };

/**
 * Reusable confirmation modal — the first dialog component in the app, replacing bare
 * `window.confirm()` calls with something styled and Promise-based:
 *
 *   const { confirm, dialog } = useConfirm();
 *   ...
 *   if (!(await confirm({ title: "Delete this?", danger: true }))) return;
 *   ...
 *   return <>{dialog}{...rest of component}</>;
 */
export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  function close(result: boolean) {
    pending?.resolve(result);
    setPending(null);
  }

  const dialog = pending ? (
    <div
      role="presentation"
      onClick={() => close(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          {pending.danger && (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-rose-bg text-rose">
              <AlertTriangle className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 id="confirm-dialog-title" className="font-serif text-lg font-semibold text-ink">
              {pending.title}
            </h2>
            {pending.description && (
              <p className="mt-1 text-sm text-ink-soft">{pending.description}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
          >
            {pending.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium text-white transition-colors",
              pending.danger ? "bg-rose hover:bg-rose/90 active:bg-rose/80" : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700"
            )}
          >
            {pending.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
