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
  inline = false,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  /**
   * Refuses clicks, for a switch whose change is a server round trip.
   *
   * Without it a second click during the first one's flight sends a second
   * write, and the two race: the switch settles on whichever reply lands last,
   * which is not necessarily the one the merchant asked for last. On a switch
   * that takes a storefront off the internet, that is not a cosmetic race.
   */
  disabled?: boolean;
  /**
   * Drops the visible label, keeping it as the accessible name.
   *
   * For rows where the switch sits beside something that already names it — a
   * discount code, say — and repeating it would just be noise. The label is
   * still required, because a switch with no accessible name is unusable with
   * a screen reader whatever it looks like.
   */
  hideLabel?: boolean;
  /**
   * Switch first, label beside it, hugging its own width.
   *
   * The default pushes the switch to the right edge of whatever contains it,
   * which is right in a list of rows that share an edge. Inside a Fieldset it
   * is wrong: the control column is as wide as a text field, so a lone switch
   * ends up marooned an inch of empty white away from the words it belongs to.
   */
  inline?: boolean;
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "no-tap-scale relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
        !inline && "mt-0.5",
        checked ? "bg-brand-500" : "bg-border",
        // Dimmed and uninteractive, but never hidden: a merchant watching a
        // switch they just pressed needs to see it is busy, not to lose it.
        disabled && "cursor-not-allowed opacity-55"
      )}
    >
      <span
        className={cn(
          "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );

  const text = (
    <span>
      <span className="block text-sm font-medium text-ink">{label}</span>
      {description && <span className="mt-0.5 block text-xs leading-snug text-ink-soft">{description}</span>}
    </span>
  );

  if (inline && !hideLabel) {
    return (
      <div className={cn("flex gap-3", description ? "items-start" : "items-center")}>
        {control}
        {text}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-4 py-1",
        hideLabel ? "justify-end" : "justify-between"
      )}
    >
      {!hideLabel && text}
      {control}
    </div>
  );
}
