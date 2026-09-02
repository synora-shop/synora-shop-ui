import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/** Every state a shop can be in. Kept in step with the Prisma enum: a value
 *  missing here would fall to the closed branch and tell a live shop it is not
 *  visible, which is worse than saying nothing. */
type Status = "ACTIVE" | "TRIAL" | "PAST_DUE" | "PAUSED" | "CLOSED" | "SUSPENDED";

/**
 * Whether customers can see the shop, pinned to the top of the page about how
 * the shop looks.
 *
 * Sticky because it is the one fact that changes what everything below means: a
 * theme a merchant is admiring is not live if the store is closed, and finding
 * that out after choosing one is finding out too late.
 *
 * Green means open and amber means not. Deliberately not the store's accent
 * colour, which is a taste rather than a signal — when the accent is used for
 * status too, nothing on the screen tells a merchant anything.
 */
export function StoreStatusBar({
  status,
  maintenance,
  storeUrl,
}: {
  status: Status;
  maintenance: boolean;
  storeUrl: string;
}) {
  // A trial is a live shop, and so is one whose payment is late — customers
  // can see and buy from both. Only the three shut states are not visible.
  const live = (status === "ACTIVE" || status === "TRIAL" || status === "PAST_DUE") && !maintenance;

  const reason =
    status === "PAUSED"
      ? "Paused — customers see a holding page."
      : status === "CLOSED"
        ? "Closed — the storefront is switched off."
        : status === "SUSPENDED"
          ? "Suspended — contact support."
          : maintenance
            ? "Maintenance mode — only your staff can see the store."
            : "Live — customers can see and buy from your store.";

  return (
    <div
      className={cn(
        "sticky top-14 z-20 -mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 backdrop-blur",
        live ? "border-green/25 bg-green-bg/90" : "border-amber/25 bg-amber-bg/90"
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          className={cn("h-2 w-2 flex-shrink-0 rounded-full", live ? "bg-green" : "bg-amber")}
          aria-hidden
        />
        <span className={cn("text-sm font-semibold", live ? "text-green" : "text-amber")}>
          {live ? "Live" : "Not visible"}
        </span>
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">{reason}</span>
      <a
        href={storeUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-medium text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
      >
        View
        <ExternalLink className="h-3 w-3 opacity-60" />
      </a>
      {!live && (
        <Link
          href="#opening-and-closing"
          className="flex-shrink-0 text-xs font-medium text-amber underline-offset-2 hover:underline"
        >
          Change
        </Link>
      )}
    </div>
  );
}
