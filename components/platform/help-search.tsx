"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, CornerDownLeft, LifeBuoy, Search, Sparkles, X } from "lucide-react";

/**
 * Search across the docs, the answers, the known issues and the release
 * notes (14 October). Opens with ⌘K or Ctrl+K, with "/", or from the search
 * button; arrows move, Enter goes, Esc closes. Everything it searches is
 * handed to it by the page, so it needs no server and answers as you type.
 *
 * A word matches when every word typed appears somewhere in an entry; a hit in
 * the title ranks above a hit in the text.
 */
export type SearchItem = { group: "Docs" | "Answers" | "Known issues" | "Release notes" | "Help"; title: string; text: string; href: string };

const OPEN_EVENT = "synora:search";
const GROUP_ICON = { Docs: BookOpen, Answers: BookOpen, "Known issues": LifeBuoy, Help: LifeBuoy, "Release notes": Sparkles };

export function SearchButton({ tab = false }: { tab?: boolean }) {
  const open = () => window.dispatchEvent(new Event(OPEN_EVENT));
  if (tab) {
    return (
      <button type="button" onClick={open} className="flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold text-[#0d0d50]/60">
        <Search className="h-5 w-5" />
        Search
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search"
      className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f2f2ff] pl-3 pr-2 text-[13px] font-medium text-[#0d0d50]/55 transition-colors hover:text-[#0d0d50]"
    >
      <Search className="h-4 w-4" />
      <kbd className="rounded-md bg-white px-1.5 py-0.5 font-sans text-[11px] font-semibold text-[#0d0d50]/50 shadow-sm">⌘K</kbd>
    </button>
  );
}

function score(item: SearchItem, words: string[]): number {
  const title = item.title.toLowerCase();
  const all = `${title} ${item.text.toLowerCase()}`;
  let s = 0;
  for (const w of words) {
    if (!all.includes(w)) return 0;
    s += title.includes(w) ? 3 : 1;
    if (title.startsWith(w)) s += 2;
  }
  return s;
}

export function HelpSearch({ items, suggested }: { items: SearchItem[]; suggested?: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const router = useRouter();

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return suggested ?? items.slice(0, 6);
    return items
      .map((it) => ({ it, s: score(it, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((r) => r.it);
  }, [q, items, suggested]);

  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener(OPEN_EVENT, show);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, show);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => input.current?.focus());
    return () => {
      document.body.style.overflow = before;
    };
  }, [open]);

  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-i="${at}"]`)?.scrollIntoView({ block: "nearest" });
  }, [at]);

  const close = () => {
    setOpen(false);
    setQ("");
    setAt(0);
  };
  const go = (item?: SearchItem) => {
    if (!item) return;
    close();
    router.push(item.href);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-[#0d0d50]/25 px-3 pt-[10vh] backdrop-blur-sm" onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search help"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[38rem] overflow-hidden rounded-[1.6rem] bg-white shadow-[0_40px_100px_-30px_rgba(13,13,80,0.6)] ring-1 ring-[#0d0d50]/10"
      >
        <div className="flex items-center gap-3 border-b border-[#0d0d50]/[0.08] px-5">
          <Search className="h-5 w-5 shrink-0 text-[#6666ff]" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAt(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setAt((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setAt((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") go(results[at]);
            }}
            placeholder="Search docs, answers and updates"
            aria-label="Search"
            className="h-16 min-w-0 flex-1 bg-transparent text-[17px] text-[#0d0d50] outline-none placeholder:text-[#0d0d50]/35"
          />
          <button type="button" onClick={close} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-[#0d0d50]/45 hover:bg-[#f2f2ff]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul ref={list} className="max-h-[55vh] overflow-y-auto p-2">
          {!q && <li className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#0d0d50]/40">Popular</li>}
          {results.length === 0 && (
            <li className="px-4 py-10 text-center text-[15px] text-[#0d0d50]/60">
              Nothing matches &ldquo;{q}&rdquo;.{" "}
              <button type="button" className="font-semibold text-[#4b4bea] underline-offset-4 hover:underline" onClick={() => go({ group: "Help", title: "", text: "", href: "/help#ask" })}>
                Ask the team
              </button>
            </li>
          )}
          {results.map((it, i) => {
            const Icon = GROUP_ICON[it.group];
            const on = i === at;
            return (
              <li key={`${it.href}-${it.title}`}>
                <button
                  type="button"
                  data-i={i}
                  onMouseMove={() => setAt(i)}
                  onClick={() => go(it)}
                  className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${on ? "bg-[#f2f2ff]" : ""}`}
                >
                  <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${on ? "bg-[#6666ff] text-white" : "bg-[#f2f2ff] text-[#6666ff]"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-[#0d0d50]">{it.title}</span>
                      <span className="shrink-0 text-[11px] font-medium text-[#0d0d50]/40">{it.group}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[13.5px] leading-snug text-[#0d0d50]/60">{it.text}</span>
                  </span>
                  {on && <CornerDownLeft className="mt-2 h-4 w-4 shrink-0 text-[#0d0d50]/35" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center justify-between border-t border-[#0d0d50]/[0.08] px-5 py-3 text-[12px] text-[#0d0d50]/45 sm:flex">
          <span>↑ ↓ to move · Enter to open · Esc to close</span>
          <Link href="/help#ask" className="inline-flex items-center gap-1 font-semibold text-[#4b4bea]" onClick={close}>
            Can&rsquo;t find it? Ask us <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** The big search box at the top of a page; opens the same search. */
export function SearchBar({ placeholder = "Search docs, answers and updates", compact = false }: { placeholder?: string; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className={`group flex h-14 w-full items-center ${compact ? "" : "mt-9 max-w-xl"} gap-3 rounded-2xl border border-[#0d0d50]/10 bg-white px-5 text-left text-[16px] text-[#0d0d50]/45 shadow-[0_14px_40px_-20px_rgba(13,13,80,0.35)] transition-[border-color,box-shadow] hover:border-[#6666ff]/50 hover:shadow-[0_14px_40px_-16px_rgba(102,102,255,0.45)]`}
    >
      <Search className="h-5 w-5 text-[#6666ff]" />
      <span className="flex-1 truncate">{placeholder}</span>
      <kbd className="hidden rounded-lg bg-[#f2f2ff] px-2 py-1 font-sans text-[12px] font-semibold text-[#0d0d50]/50 sm:inline">⌘K</kbd>
    </button>
  );
}
