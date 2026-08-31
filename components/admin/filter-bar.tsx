import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  activeCount,
  clearAllHref,
  removeHref,
  toggleHref,
  type ActiveFilters,
} from "@/lib/filters";

export type FilterOption = {
  value: string;
  label: string;
  /** A small mark before the label — a status colour, say. */
  mark?: React.ReactNode;
};

export type FilterGroup = {
  /** Query parameter this group writes to. */
  key: string;
  /** Shown beside the options, e.g. "Status". */
  label: string;
  options: FilterOption[];
};

/**
 * The filter controls for a list, and a summary of what is applied.
 *
 * Server-rendered links on purpose. The filters used to be client state that
 * never re-read what the server sent, which is how they came to look broken;
 * a set of hrefs cannot drift from the page it is rendered on.
 *
 * Options toggle rather than replace, so several can be applied at once, and
 * the summary row below gives each applied value its own remove button — the
 * thing that was missing when the only way to undo a filter was to hunt for
 * the "All" button belonging to that particular group.
 */
export function FilterBar({
  basePath,
  groups,
  filters,
}: {
  basePath: string;
  groups: FilterGroup[];
  filters: ActiveFilters;
}) {
  const total = activeCount(filters);
  const labelFor = (key: string, value: string) =>
    groups.find((g) => g.key === key)?.options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="mt-4 space-y-2">
      {groups.map((group) => {
        const applied = filters[group.key] ?? [];
        return (
          <div key={group.key} className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              {group.label}
            </span>
            {group.options.map((option) => {
              const on = applied.includes(option.value);
              return (
                <Link
                  key={option.value}
                  href={toggleHref(basePath, filters, group.key, option.value)}
                  aria-pressed={on}
                  scroll={false}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                    on
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-border text-ink-soft hover:bg-subtle active:bg-subtle"
                  )}
                >
                  {option.mark}
                  {option.label}
                </Link>
              );
            })}
          </div>
        );
      })}

      {total > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Applied
          </span>
          {groups.flatMap((group) =>
            (filters[group.key] ?? []).map((value) => (
              <Link
                key={`${group.key}:${value}`}
                href={removeHref(basePath, filters, group.key, value)}
                scroll={false}
                aria-label={`Remove filter ${group.label}: ${labelFor(group.key, value)}`}
                className="flex items-center gap-1 rounded-full border border-brand-600 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 transition-colors hover:bg-brand-100 active:bg-brand-100"
              >
                <span className="text-ink-faint">{group.label}:</span>
                {labelFor(group.key, value)}
                <X className="h-3 w-3" />
              </Link>
            ))
          )}
          {total > 1 && (
            <Link
              href={clearAllHref(basePath)}
              scroll={false}
              className="rounded-full px-2 py-1 text-xs text-ink-soft underline-scribble transition-colors hover:text-ink"
            >
              Clear all
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
