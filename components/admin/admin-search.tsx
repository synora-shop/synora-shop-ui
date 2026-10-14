"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, Sparkles } from "lucide-react";
import { searchSettings } from "@/lib/settings-index";
import { sections } from "@/lib/admin-nav";
import { startNavProgress } from "@/components/ui/nav-progress";
import { cn } from "@/lib/utils";

/**
 * The command bar (new admin, 15 October): ⌘K, / or the rail's search field.
 *
 * One box for going somewhere and for doing something. Empty, it offers the
 * common jobs and every section with its shortcut. Typed into, it searches the
 * screens by name and every setting through the settings index, the same
 * index the old search used, so nothing that was findable stops being so.
 *
 * Its own overlay, never inside a dropdown: a menu clipped the old results
 * away entirely once (scripts/check-naming.ts keeps that from returning).
 */
type Entry = { group: string; label: string; hint?: string; href: string; keys?: string };

const KEYS: Record<string, string> = {
  home: "G H", orders: "G O", products: "G P", customers: "G C", discounts: "G D",
  content: "G F", analytics: "G A", store: "G T", settings: "G S",
};

/** The jobs people come to the panel to do, each landing where it is done. */
const ACTIONS: Entry[] = [
  { group: "Do", label: "Add a product", href: "/admin/products/new", keys: "C P" },
  { group: "Do", label: "Create a discount code", href: "/admin/discounts" },
  { group: "Do", label: "Add a page", href: "/admin/pages" },
  { group: "Do", label: "Import products from a Shopify file", hint: "On Products, from Import", href: "/admin/products" },
  { group: "Do", label: "Customise the live theme", href: "/admin/customize" },
  { group: "Do", label: "Invite someone to the team", href: "/admin/account" },
  { group: "Do", label: "Connect a domain", href: "/admin/domains" },
  { group: "Do", label: "Pause or close the store", hint: "Shows your holding page", href: "/admin/maintenance" },
];

function screens(): Entry[] {
  return sections().flatMap((s) => [
    { group: "Go to", label: s.label, href: s.href, keys: KEYS[s.key] },
    ...s.tabs.filter((t) => t.href !== s.href).map((t) => ({ group: "Go to", label: t.label, hint: s.label, href: t.href })),
  ]);
}

export function AdminSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const router = useRouter();

  const results = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const all = screens();
    if (q.length < 2) return [...ACTIONS.slice(0, 5), ...all.filter((e) => e.keys)];
    const words = q.split(/\s+/);
    const hit = (e: Entry) => words.every((w) => `${e.label} ${e.hint ?? ""}`.toLowerCase().includes(w));
    const settings = searchSettings(query).map((s) => ({ group: "Settings", label: s.label, hint: s.path.join(" › "), href: s.href }));
    const seen = new Set<string>();
    return [...ACTIONS.filter(hit), ...all.filter(hit), ...settings]
      .filter((e) => (seen.has(e.group + e.href + e.label) ? false : (seen.add(e.group + e.href + e.label), true)))
      .slice(0, 16);
  }, [query]);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    listRef.current?.querySelectorAll("button")[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(entry: Entry | undefined) {
    if (!entry) return;
    onClose();
    startNavProgress();
    router.push(entry.href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
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

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-3 pt-[12vh]">
      <button type="button" aria-label="Close search" onClick={onClose} className="absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]" />
      <div role="dialog" aria-modal="true" aria-label="Search and commands" className="relative w-full max-w-xl rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)] ring-1 ring-black/10">
        <div className="flex items-center gap-3 border-b border-[#0a0a0a]/[0.07] px-4">
          <Search className="h-5 w-5 shrink-0 text-[#0a0a0a]/45" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Find a screen or a setting, or type what to do"
            aria-label="Search and commands"
            className="h-14 min-w-0 flex-1 bg-transparent text-[16px] text-[#0a0a0a] outline-none placeholder:text-[#0a0a0a]/35"
          />
          <kbd className="rounded-md bg-[#f0f0f0] px-1.5 py-0.5 text-[11px] font-semibold text-[#0a0a0a]/50">Esc</kbd>
        </div>
        <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-4 py-10 text-center text-[14px] text-[#0a0a0a]/50">Nothing matches &ldquo;{query}&rdquo;.</li>}
          {results.map((c, i) => {
            const head = i === 0 || results[i - 1].group !== c.group ? c.group : null;
            return (
              <li key={`${c.group}${c.label}${c.href}`}>
                {head && <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]/40">{head}</p>}
                <button
                  type="button"
                  onMouseMove={() => setActive(i)}
                  onClick={() => go(c)}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left", i === active && "bg-[#f2f2f2]")}
                >
                  {c.group === "Do" ? <Sparkles className="h-4 w-4 shrink-0 text-[#6666ff]" /> : <CornerDownLeft className="h-4 w-4 shrink-0 text-[#0a0a0a]/30" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-[#0a0a0a]">{c.label}</span>
                    {c.hint && <span className="block truncate text-[12px] text-[#0a0a0a]/50">{c.hint}</span>}
                  </span>
                  {c.keys && <kbd className="rounded-md bg-[#f0f0f0] px-1.5 py-0.5 text-[11px] font-semibold text-[#0a0a0a]/55">{c.keys}</kbd>}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="flex items-center justify-between border-t border-[#0a0a0a]/[0.07] px-4 py-2.5 text-[11.5px] text-[#0a0a0a]/45">
          <span>↑ ↓ move · Enter open · Esc close</span>
          <span>Every screen and setting</span>
        </p>
      </div>
    </div>
  );
}
