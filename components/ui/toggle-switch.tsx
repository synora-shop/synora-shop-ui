"use client";

import { cn } from "@/lib/utils";

/** A real toggle switch, not a bare checkbox — used throughout Global Edits so a
 * boolean setting reads at a glance instead of blending into a wall of checkboxes. */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  hideLabel = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  /**
   * Drops the visible label, keeping it as the accessible name.
   *
   * For rows where the switch sits beside something that already names it — a
   * discount code, say — and repeating it would just be noise. The label is
   * still required, because a switch with no accessible name is unusable with
   * a screen reader whatever it looks like.
   */
  hideLabel?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 py-1",
        hideLabel ? "justify-end" : "justify-between"
      )}
    >
      {!hideLabel && (
        <span>
          <span className="block text-sm font-medium text-ink">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "no-tap-scale relative mt-0.5 inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-brand-500" : "bg-border"
        )}
      >
        <span
          className={cn(
            "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
