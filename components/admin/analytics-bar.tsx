import Link from "next/link";
import { Upload } from "lucide-react";
import { buttonClass } from "@/components/ui/primitives";
import { RANGES, type SearchParams } from "@/lib/analytics";
import { LiveToggle } from "@/components/admin/live-toggle";
import { cn } from "@/lib/utils";

/**
 * The analytics controls (new admin, 15 October): the window, comparing with
 * the one before, live, and export. Every choice is in the address, so a view
 * can be bookmarked or sent to a partner.
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

/** The windows the bar offers. 90 days stays reachable by address. */
const SHOWN: { value: string; label: string }[] = [
  { value: "1d", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "365d", label: "12 months" },
];

export function AnalyticsBar({ searchParams, range, comparing }: { searchParams: SearchParams; range: string; comparing: boolean }) {
  const base = "/admin/analytics";
  const days = RANGES.find((r) => r.value === range)?.days ?? 30;
  const before = days === 1 ? "the 24 hours before" : days === 365 ? "the 12 months before" : `the ${days} days before`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-[10px] bg-white p-0.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">
        {SHOWN.map((r) => (
          <Link
            key={r.value}
            href={href(base, searchParams, { range: r.value === "30d" ? null : r.value })}
            aria-current={r.value === range ? "true" : undefined}
            className={cn("rounded-lg px-3 py-1.5 transition-colors", r.value === range ? "bg-[#ecebff] text-[#4b4bea] ring-1 ring-inset ring-[#6666ff]/25" : "text-[#0a0a0a]/55 hover:text-[#0a0a0a]")}
          >
            {r.label}
          </Link>
        ))}
      </div>
      <Link
        href={href(base, searchParams, { compare: comparing ? null : "1" })}
        aria-pressed={comparing}
        className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10 hover:ring-[#0a0a0a]/25"
      >
        <span className={cn("h-4 w-7 rounded-full p-0.5 transition-colors", comparing ? "bg-[#0a0a0a]" : "bg-[#0a0a0a]/15")}>
          <span className={cn("block h-3 w-3 rounded-full bg-white transition-transform", comparing && "translate-x-3")} />
        </span>
        Compare with {before}
      </Link>
      <LiveToggle />
      {/* A plain link, not a form: the answer is a file and the browser
          already knows how to receive one. */}
      <a
        href={href("/admin/analytics/export", searchParams, {})}
        className={buttonClass("secondary", "md", "ml-auto")}
      >
        <Upload className="h-4 w-4" />
        Export CSV
      </a>
    </div>
  );
}
