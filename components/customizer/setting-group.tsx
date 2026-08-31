"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { groupAnchor } from "@/lib/settings-index";
import { cn } from "@/lib/utils";

/**
 * A collapsible group of settings.
 *
 * Collapsed by default beyond the first, because the previous single scrolling
 * column made it impossible to see what the panel contained without reading all
 * of it. Showing the group names with a count is what turns "I can't find it"
 * into "it's under Logo" — the count also answers whether a group is worth
 * opening at all.
 *
 * Opens itself when the page is targeting something inside it, so a search
 * result or a link with a #hash lands on a visible control rather than one
 * hidden in a collapsed section.
 */
export function SettingGroup({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement | null>(null);

  // A hash pointing at this group, or at any control inside it, forces it open
  // and scrolls it into view. Runs on hash changes too, so a second search for
  // something in the same group still works.
  useEffect(() => {
    function reveal() {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const el = ref.current;
      if (!el) return;
      if (hash === groupAnchor(title) || el.querySelector(`#${CSS.escape(hash)}`)) {
        setOpen(true);
        // After the expand has painted, so the target is where we scroll to.
        requestAnimationFrame(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    }
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [title]);

  return (
    <div ref={ref} id={groupAnchor(title)} className="scroll-mt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 rounded py-1 text-left transition-colors hover:bg-subtle/60"
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 flex-shrink-0 text-ink-faint transition-transform", open && "rotate-90")}
        />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-ink">{title}</span>
        <span className="flex-shrink-0 rounded-full bg-subtle px-1.5 text-[10px] tabular-nums text-ink-soft">
          {count}
        </span>
      </button>
      {open && <div className="mt-3 space-y-4 pl-1">{children}</div>}
    </div>
  );
}
