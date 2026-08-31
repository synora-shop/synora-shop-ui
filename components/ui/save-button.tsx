"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * A Save button that actually confirms the save happened: it turns into a
 * disabled "Saved" state with a checkmark instead of just vanishing or
 * silently going back to normal, and it stays that way until the field it's
 * attached to changes again. Callers own the state machine (see the save
 * hook pattern used alongside this) — this component is purely
 * presentational so it drops into differently-shaped forms.
 */
export function SaveButton({
  state,
  onClick,
  idleLabel = "Save",
  savingLabel = "Saving…",
  savedLabel = "Saved",
  errorLabel = "Retry",
  size = "md",
  className,
}: {
  state: SaveState;
  onClick: () => void;
  idleLabel?: string;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const disabled = state === "saving" || state === "saved";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full border font-medium transition-colors disabled:cursor-default",
        size === "sm" && "px-2.5 py-1 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-8 py-3 text-sm",
        state === "saved"
          ? "border-green bg-green-bg text-green"
          : state === "error"
            ? "border-rose text-rose hover:bg-rose-bg active:bg-rose-bg"
            : "border-brand-500 text-brand-600 hover:bg-brand-50 active:bg-brand-100 disabled:opacity-60",
        className
      )}
    >
      {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {state === "saved" && <Check className="h-3.5 w-3.5" />}
      {state === "saving" ? savingLabel : state === "saved" ? savedLabel : state === "error" ? errorLabel : idleLabel}
    </button>
  );
}
