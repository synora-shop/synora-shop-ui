"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, Info, Loader2, X } from "lucide-react";
import { switchBusinessType } from "@/app/admin/business-type-actions";
import { TYPE_GUIDE } from "@/lib/themes/type-guide";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * What kind of business this shop is: what the choice means, and changing it.
 *
 * Two doors into one panel, because they are two different questions asked by
 * the same person a moment apart. The ⓘ answers "which one am I?" and changes
 * nothing. "Change APP type" answers "make it that one".
 *
 * Both read lib/themes/type-guide.ts, so the explanation and the thing being
 * explained cannot drift apart.
 *
 * Switching is reversible and says so. Pages, themes and menus are stored per
 * business type, so a shop that goes to Restaurant and back finds its old
 * storefront exactly as it left it — a merchant will not try this at all unless
 * told that in advance.
 */
export function BusinessTypeDialog({
  current,
  mode,
  onClose,
}: {
  /** Registry spelling, e.g. "ecommerce". */
  current: string;
  /** "info" explains and cannot change anything. "switch" can. */
  mode: "info" | "switch";
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  // Escape closes it, which is what anyone will try first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  function choose(key: string) {
    if (key === current || pending) return;
    setError(null);
    setChanging(key);
    startTransition(async () => {
      const result = await switchBusinessType(key);
      if (result.ok) {
        onClose();
      } else {
        setError(result.error ?? "That did not work. Try again.");
        setChanging(null);
      }
    });
  }

  // Rendered into the body rather than where it is written. Its trigger lives in
  // the top bar, which sets text-white for the coloured background — inherited
  // into a white dialog that made every heading invisible. A modal has no
  // business inheriting from the bar that opened it, and portalling also keeps
  // it clear of the header's stacking context.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 text-ink sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={() => !pending && onClose()}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="business-type-title"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id="business-type-title" className="text-base font-semibold">
              {mode === "info" ? "Which type fits your business?" : "Change app type"}
            </h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              {mode === "info"
                ? "Each type gives you a different set of tools. Here is what falls under which."
                : "Your current store is kept. Switch back any time and it returns as it was."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !pending && onClose()}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-subtle hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <p className="mb-3 rounded-lg bg-rose-bg px-3 py-2 text-sm text-rose" role="alert">
              {error}
            </p>
          )}

          <ul className="flex flex-col gap-2.5">
            {TYPE_GUIDE.map((t) => {
              const isCurrent = t.key === current;
              const busy = changing === t.key;
              const Row = mode === "switch" && !isCurrent ? "button" : "div";
              return (
                <li key={t.key}>
                  <Row
                    {...(Row === "button"
                      ? { type: "button" as const, onClick: () => choose(t.key), disabled: pending }
                      : {})}
                    className={cn(
                      "w-full rounded-xl border p-3.5 text-left transition-colors",
                      isCurrent
                        ? "border-green bg-green-bg"
                        : mode === "switch"
                          ? "border-border hover:border-brand-300 hover:bg-subtle disabled:opacity-60"
                          : "border-border"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{t.label}</span>
                      {isCurrent && (
                        <Badge tone="good">
                          <Check className="h-3 w-3" />
                          Current
                        </Badge>
                      )}
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-faint" />}
                    </span>
                    <span className="mt-1 block text-xs text-ink-soft">{t.summary}</span>

                    <span className="mt-2 block text-[11px] text-ink-faint">
                      <span className="font-medium text-ink-soft">For:</span> {t.examples.join(" · ")}
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-faint">
                      <span className="font-medium text-ink-soft">You get:</span> {t.gives.join(" · ")}
                    </span>
                  </Row>
                </li>
              );
            })}
          </ul>

          {mode === "info" && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-subtle px-3 py-2.5 text-xs text-ink-soft">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              Still unsure? Pick the closest one. Changing it later keeps everything
              you have made — each type remembers its own storefront.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
