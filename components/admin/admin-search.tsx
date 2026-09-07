"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { searchSettings, type SettingEntry } from "@/lib/settings-index";
import { cn } from "@/lib/utils";
import { startNavProgress } from "@/components/ui/nav-progress";

/**
 * Find anything in the admin.
 *
 * It used to be the same field rendered inside the notifications dropdown — a
 * 288px box with `overflow: hidden`, which clipped the result list entirely.
 * You could type, twelve results were found and rendered, and not one of them
 * was visible. The search was working; the container was eating it.
 *
 * So it is its own overlay now, the shape this has everywhere else: a panel
 * near the top of the window, wide enough to read a breadcrumb, opened by the
 * button, by "/" or by ⌘K, closed by Escape or by clicking away. Nothing about
 * it is nested inside anything that can clip it.
 */
export function AdminSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const router = useRouter();

  const results = useMemo(() => searchSettings(query), [query]);

  // Opening should land the cursor in the field. A search you have to click
  // twice to use is a search people stop using.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  // Keep the highlighted row in view when the arrows walk past the fold.
  useEffect(() => {
    listRef.current?.querySelectorAll("li")[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function go(entry: SettingEntry | undefined) {
    if (!entry) return;
    onClose();
    startNavProgress();
    router.push(entry.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
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

  const typed = query.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-[2px]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search the admin"
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-control-line bg-control shadow-lg"
      >
        <div className="flex items-center gap-2.5 border-b border-control-line px-3.5">
          <Search className="h-4 w-4 flex-shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search every screen and setting…"
            aria-label="Search the admin"
            className="h-12 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="hidden flex-shrink-0 rounded-md border border-border bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
            esc
          </kbd>
        </div>

        {!typed ? (
          <p className="px-3.5 py-4 text-xs leading-snug text-ink-soft">
            Type two letters. Search the name of a screen — orders, discounts, domains — or what
            you are trying to change: &ldquo;colour&rdquo;, &ldquo;whatsapp&rdquo;,
            &ldquo;free shipping&rdquo;.
          </p>
        ) : results.length === 0 ? (
          <p className="px-3.5 py-4 text-xs leading-snug text-ink-soft">
            Nothing matches &ldquo;{query.trim()}&rdquo;. Try a word from what it does rather than
            what it is called.
          </p>
        ) : (
          <ul ref={listRef} className="max-h-[52vh] overflow-y-auto py-1">
            {results.map((entry, i) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(entry)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3.5 py-2 text-left transition-colors",
                    i === active ? "bg-panel" : "hover:bg-panel/60"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {entry.label}
                    </span>
                    <span className="block truncate text-xs text-ink-faint">
                      {entry.path.join(" › ")}
                      {entry.info ? ` · ${entry.info}` : ""}
                    </span>
                  </span>
                  {i === active && (
                    <CornerDownLeft className="h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
