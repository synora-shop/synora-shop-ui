"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, X } from "lucide-react";
import { searchSettings, type SettingEntry } from "@/lib/settings-index";
import { cn } from "@/lib/utils";

/**
 * Find-anything search across the admin.
 *
 * Answers "where is that setting?" without requiring you to know which section
 * owns it — the breadcrumb on each result teaches the layout as you use it, so
 * the need for the search fades rather than becoming permanent.
 *
 * Keyboard-first: "/" focuses it from anywhere, arrows move, Enter opens,
 * Escape closes. Mouse and touch work the same way.
 */
export function SettingsSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  const results = useMemo(() => searchSettings(query), [query]);

  // "/" is the near-universal focus-search shortcut, but only when the user
  // isn't already typing somewhere.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function go(entry: SettingEntry | undefined) {
    if (!entry) return;
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(entry.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[active]);
    }
  }

  const showResults = open && query.trim().length >= 2;

  return (
    <div className={cn("relative", className)}>
      {/* Fixed height rather than padding. The base layer gives every input a
          2.5rem minimum height so descenders are never clipped, and inside a
          padded pill that minimum pushed the control taller than the bar it
          sits in. The input's own height is reset just below. */}
      <div className="flex h-9 items-center gap-2 rounded-pill border border-border bg-surface px-3.5 shadow-sm transition-all duration-200 ease-out focus-within:border-brand-500 focus-within:shadow-brand hover:border-brand-300">
        <Search className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search every setting…"
          aria-label="Search settings"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Delayed so a click on a result lands before the list unmounts.
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          className="h-full min-h-0 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="no-tap-scale flex-shrink-0 rounded-full p-0.5 text-ink-faint transition-colors hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden flex-shrink-0 rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
            /
          </kbd>
        )}
      </div>

      {showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-ink-soft">
              Nothing matches “{query.trim()}”. Try a word from what it does, “colour”, “font”,
              “whatsapp”, “redirect”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((entry, i) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(entry)}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors",
                      i === active ? "bg-subtle" : "hover:bg-subtle/60"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-soft">
                        {entry.info}
                      </p>
                    </div>
                    <span className="mt-0.5 flex flex-shrink-0 items-center gap-0.5 text-[10px] text-ink-faint">
                      {entry.path.map((part, n) => (
                        <span key={n} className="flex items-center gap-0.5">
                          {n > 0 && <ChevronRight className="h-2.5 w-2.5" />}
                          {part}
                        </span>
                      ))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
