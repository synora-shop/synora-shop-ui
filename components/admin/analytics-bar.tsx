import Link from "next/link";
import { RANGES, type SearchParams } from "@/lib/analytics";
import { ExternalLinkIcon } from "@/components/ui/synora-marks";
import { LiveToggle } from "@/components/admin/live-toggle";
import { cn } from "@/lib/utils";

/**
 * Analytics' own action bar.
 *
 * Every section's bar carries what that section can actually be done to, and
 * for a screen of figures that is: which period, whether to compare it with the
 * one before, taking the numbers away, and keeping them current.
 *
 * All of it lives in the address, so a range can be bookmarked and sent to
 * somebody — which is what a merchant does with a good month.
 */

function href(base: string, sp: SearchParams, patch: Record<string, string | null>): string {
  const qs = new URLSearchParams();
  for (const key of Object.keys(sp).sort()) {
    if (key in patch) continue;
    const raw = sp[key];
    if (raw === undefined) continue;
    for (const v of Array.isArray(raw) ? [...raw].sort() : [raw]) qs.append(key, v);
  }
  for (const [k, v] of Object.entries(patch)) if (v !== null) qs.set(k, v);
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export function AnalyticsBar({
  searchParams,
  range,
  comparing,
}: {
  searchParams: SearchParams;
  range: string;
  comparing: boolean;
}) {
  const base = "/admin/analytics";
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel p-2 shadow-panel">
      <div className="flex items-center gap-0.5 rounded-pill border border-control-line bg-control p-1">
        {RANGES.map((r) => (
          <Link
            key={r.value}
            href={href(base, searchParams, { range: r.value === "30d" ? null : r.value })}
            aria-current={r.value === range ? "true" : undefined}
            className={cn(
              "rounded-pill px-2.5 py-1 text-xs transition-colors",
              r.value === range ? "bg-brand-500 font-medium text-white" : "text-control-ink hover:bg-panel"
            )}
          >
            {r.label.replace("Last ", "").replace(" days", "d").replace(" months", "m")}
          </Link>
        ))}
      </div>

      <Link
        href={href(base, searchParams, { compare: comparing ? null : "1" })}
        aria-pressed={comparing}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-pill border px-3 text-xs transition-colors",
          comparing
            ? "border-transparent bg-brand-500 text-white"
            : "border-control-line bg-control text-control-ink hover:text-ink"
        )}
      >
        <span aria-hidden>{comparing ? "☑" : "☐"}</span>
        Compare to previous
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <LiveToggle />
        {/* A plain link, not a form: the answer is a file and the browser
            already knows how to receive one. */}
        <a
          href={href("/admin/analytics/export", searchParams, {})}
          className="flex h-10 items-center gap-1.5 rounded-pill border border-control-line bg-control px-3 text-xs text-control-ink transition-colors hover:text-ink"
        >
          <ExternalLinkIcon className="h-3 w-3" />
          Export CSV
        </a>
      </div>
    </div>
  );
}
