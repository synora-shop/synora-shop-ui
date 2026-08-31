"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A theme card that acknowledges being picked.
 *
 * Switching design is a whole-storefront change and it takes a moment: the
 * settings are written, the shop's cache is dropped and every page revalidates.
 * As a plain submit button the card looked identical the whole time, so the
 * only honest reading was that the click had missed — and the second click is
 * a second switch.
 *
 * The card dims and names what it is doing. Its own colours stay visible
 * underneath, because the point of the card is the design it is showing.
 */
export function ThemeChoiceButton({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={active || pending}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border text-left transition-all duration-200",
        active
          ? "border-brand-500 ring-1 ring-brand-500"
          : "border-border hover:border-ink-faint hover:shadow-sm",
        pending && "opacity-60"
      )}
    >
      {children}

      {pending && (
        <span className="absolute inset-0 flex items-center justify-center gap-2 bg-white/70 text-sm font-medium text-ink">
          <Loader2 className="h-4 w-4 animate-spin" />
          Applying…
        </span>
      )}
    </button>
  );
}
