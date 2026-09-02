"use client";

import { useMemo, useState } from "react";
import { Globe, Search, X } from "lucide-react";
import { COUNTRIES } from "@/lib/store-defaults";
import { cn } from "@/lib/utils";

/**
 * Countries this shop will not serve.
 *
 * A search box and a list of what is chosen, rather than two hundred
 * checkboxes: a merchant blocking three countries should not have to scroll
 * past a hundred and ninety-seven they do not care about.
 *
 * The wording is careful about what this does. It hides the shop from ordinary
 * visitors in those countries; it is not a lock. The country comes from the
 * visitor's address, and a VPN changes that in one click. A merchant who
 * believes this is security will rely on it for something it cannot do, so the
 * screen says so plainly rather than in a footnote.
 */
export function BlockedCountriesField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");

  const chosen = useMemo(
    () => COUNTRIES.filter((c) => value.includes(c.code)),
    [value]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return COUNTRIES.filter(
      (c) => !value.includes(c.code) &&
        (c.label.toLowerCase().includes(q) || c.code.toLowerCase() === q)
    ).slice(0, 6);
  }, [query, value]);

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-start gap-2">
        <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Hide from certain countries</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Visitors from these countries see a closed-store page instead of your
            shop. Your own staff still see it normally.
          </p>

          <div className="relative mt-2.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a country to add…"
              aria-label="Search for a country to block"
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm outline-none transition-colors focus:border-brand-500"
            />
            {matches.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
                {matches.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange([...value, c.code].sort());
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-subtle"
                    >
                      {c.label}
                      <span className="text-xs text-ink-faint">{c.code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {chosen.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {chosen.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((v) => v !== c.code))}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full bg-rose-bg py-1 pl-2.5 pr-1.5 text-xs font-medium text-rose",
                      "transition-colors hover:bg-rose hover:text-white"
                    )}
                    aria-label={`Stop blocking ${c.label}`}
                  >
                    {c.label}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2.5 text-xs text-ink-faint">
              Not hidden anywhere. Your shop is visible worldwide.
            </p>
          )}

          {chosen.length > 0 && (
            <p className="mt-2 text-[11px] text-ink-faint">
              This hides your shop from ordinary visitors in {chosen.length}{" "}
              {chosen.length === 1 ? "country" : "countries"}. It is not a lock:
              country is worked out from the visitor&rsquo;s internet address, and
              anyone using a VPN will still get through.
            </p>
          )}

          {/* What the form actually submits. One field, so the server reads a
              single value rather than reassembling a list from many. */}
          <input type="hidden" name="blockedCountries" value={value.join(",")} />
        </div>
      </div>
    </div>
  );
}
