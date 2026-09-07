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
  /**
   * A second way of saying yes — "do it, and then take me somewhere".
   *
   * For the case where confirming leads somewhere obvious and asking again
   * afterwards would be a second dialog about the same decision. Pausing a
   * store is the example: it puts a holding page in front of customers, and
   * the moment a merchant wants to edit that page is exactly now.
   *
   * Deliberately not a link. A link inside a confirmation navigates away and
   * abandons the thing being confirmed, so the merchant arrives at the page
   * with their store still open and nothing having happened.
   */
  also?: { label: string };
  /**
   * Whether the scrim and Escape close this.
   *
   * True everywhere except the few questions that must be answered rather than
   * waved away — changing a store's public address is the one that made this
   * option exist. A dialog that can be dismissed has a third, silent answer,
   * and "whatever happens when I click outside" is not a decision anybody made
   * about their own storefront.
   *
   * When false there is no Cancel either: every button on it is an answer.
   */
  dismissable?: boolean;
};

/** What the person chose. `also` only ever comes back when it was offered. */
export type ConfirmChoice = "cancel" | "confirm" | "also";

type PendingConfirm = ConfirmOptions & { resolve: (result: ConfirmChoice) => void };

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

  // Overloaded so the thirty existing callers keep the boolean they were
  // written against, and only a caller that offers a third button has to think
  // about a third answer. A single union return would have made every one of
  // them start comparing strings for no reason.
  function confirm(options: ConfirmOptions & { also: { label: string } }): Promise<ConfirmChoice>;
  function confirm(options: ConfirmOptions): Promise<boolean>;
  function confirm(options: ConfirmOptions): Promise<ConfirmChoice | boolean> {
    return new Promise((resolve) => {
      setPending({
        ...options,
        resolve: (choice) => resolve(options.also ? choice : choice === "confirm"),
      });
    });
  }
  const confirmRef = useCallback(confirm, []);

  function close(result: ConfirmChoice) {
    pending?.resolve(result);
    setPending(null);
  }

  const dialog = pending ? (
    <div
      role="presentation"
      onClick={() => pending.dismissable === false || close("cancel")}
      className="scrim-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    >
      {/* dialog-in: arrives rather than appears. A question that materialises
          over the page has to be found; one that grows out of it has already
          said where to look. See "Arriving and leaving" in globals.css. */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="dialog-in w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
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
        {/* Wraps rather than scrolls when a third button makes the row too
            wide for a phone, and the buttons stay right-aligned in both. */}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          {pending.dismissable !== false && (
            <button
              type="button"
              onClick={() => close("cancel")}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle active:bg-brand-100"
            >
              {pending.cancelLabel ?? "Cancel"}
            </button>
          )}
          <button
            type="button"
            onClick={() => close("confirm")}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              // Secondary when there is a third button, because that one is the
              // recommended answer and two filled buttons side by side ask the
              // merchant to read both before they can tell which is which.
              pending.also
                ? "border border-border bg-surface text-ink hover:bg-subtle active:bg-brand-100"
                : cn(
                    "text-white",
                    pending.danger
                      ? "bg-rose hover:bg-rose/90 active:bg-rose/80"
                      : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700"
                  )
            )}
          >
            {pending.confirmLabel ?? "Confirm"}
          </button>
          {pending.also && (
            <button
              type="button"
              onClick={() => close("also")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-white transition-colors",
                pending.danger
                  ? "bg-rose hover:bg-rose/90 active:bg-rose/80"
                  : "bg-brand-500 hover:bg-brand-600 active:bg-brand-700"
              )}
            >
              {pending.also.label}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return { confirm: confirmRef, dialog };
}
