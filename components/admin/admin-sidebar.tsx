"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ChevronsUpDown, LifeBuoy, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react";
import { useAdminNav } from "@/lib/admin-nav-store";
import { resolveNav, type NavTone } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * The rail (new admin, 15 October).
 *
 * Black, and the one place the panel names where you can go. Every section
 * is a row; the section you are in opens to show its screens beneath it, and
 * the others stay shut, so the list is as short as it can be while still
 * saying where you are. Each section wears its brand colour as a dot, and the
 * open one carries it as a mark on the left edge.
 *
 * Settings and Bin sit at the foot with Help. Settings' own screens are listed
 * beside them on the settings pages (components/admin/settings-frame.tsx), not
 * here: twelve rows of arrangements under one word would be the longest thing
 * in the rail and the least visited.
 *
 * On a desktop it folds to icons and remembers that in this browser. On a
 * phone it is a drawer, opened from the top bar, closed by any link in it.
 *
 * Which row is lit comes from resolveNav and nowhere else, so exactly one
 * section is ever current: see lib/admin-nav.ts and scripts/check-active-nav.ts.
 */

const DOT: Record<NavTone, string> = {
  iris: "bg-[#6666ff]",
  lavender: "bg-[#b7b9ff]",
  sky: "bg-[#8cc8f5]",
  mint: "bg-[#6fd6a8]",
  ink: "bg-white",
};

function readFold() {
  try {
    return localStorage.getItem("admin-rail-folded") === "1";
  } catch {
    return false;
  }
}
function subscribeFold(on: () => void) {
  window.addEventListener("admin-rail-fold", on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener("admin-rail-fold", on);
    window.removeEventListener("storage", on);
  };
}
export function useRailFolded() {
  return useSyncExternalStore(subscribeFold, readFold, () => false);
}
export function toggleRailFold() {
  try {
    localStorage.setItem("admin-rail-folded", readFold() ? "0" : "1");
  } catch {}
  window.dispatchEvent(new Event("admin-rail-fold"));
}

export function AdminSidebar({
  storeName,
  statusLabel,
  isLive,
  badges = {},
  hasOtherStores = false,
}: {
  storeName: string;
  statusLabel: string;
  isLive: boolean;
  /** Counts that need the merchant, keyed by the screen they belong to. */
  badges?: Record<string, number>;
  hasOtherStores?: boolean;
}) {
  const open = useAdminNav((s) => s.open);
  const setOpen = useAdminNav((s) => s.setOpen);
  const setSearching = useAdminNav((s) => s.setSearching);
  const folded = useRailFolded();
  const pathname = usePathname();
  const { sections, section, current } = resolveNav(pathname);

  const main = sections.filter((s) => s.group !== 3);
  const foot = sections.filter((s) => s.group === 3);

  const rail = (narrow: boolean) => (
    <nav aria-label="Admin" className="flex h-full flex-col gap-3 px-3 py-4 text-white">
      {/* The store, and the fold beside it, where the eye starts. */}
      <div className={cn("flex items-center gap-2", narrow ? "flex-col" : "pl-1")}>
        <Link
          href={hasOtherStores ? "/merchant/stores" : "/admin"}
          title={hasOtherStores ? "Switch store" : storeName}
          onClick={() => setOpen(false)}
          className={cn("flex min-w-0 items-center gap-3 rounded-lg py-1", narrow ? "" : "flex-1 pr-1 hover:bg-white/[0.04]")}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#b8efd6] text-[13px] font-bold text-[#0a0a0a]">{initials(storeName)}</span>
          {!narrow && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{storeName}</span>
                <span className="flex items-start gap-1.5 text-[11.5px] leading-snug text-white/50">
                  <span className={cn("mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full", isLive ? "bg-[#6fd6a8]" : "bg-[#f2a33a]")} />
                  {statusLabel}
                </span>
              </span>
              {hasOtherStores && <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/35" />}
            </>
          )}
        </Link>
        <button
          type="button"
          onClick={toggleRailFold}
          aria-label={narrow ? "Open the menu out" : "Fold the menu"}
          title={narrow ? "Open the menu out" : "Fold the menu"}
          className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 ring-1 ring-white/10 hover:bg-white/10 hover:text-white lg:grid"
        >
          {narrow ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {(
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setSearching(true);
          }}
          title="Search and commands (⌘K)"
          className={cn("flex h-9 items-center gap-2 rounded-[10px] bg-white/[0.08] text-[13.5px] text-white/50 transition-colors hover:bg-white/[0.12]", narrow ? "justify-center" : "px-3")}
        >
          <Search className="h-4 w-4" />
          {!narrow && (
            <>
              <span className="flex-1 text-left">Search or do anything</span>
              <kbd className="rounded bg-white/10 px-1.5 text-[11px] font-semibold text-white/55">⌘K</kbd>
            </>
          )}
        </button>
      )}

      <ul className="-mx-1 flex flex-1 flex-col gap-1 overflow-y-auto px-1 [scrollbar-width:thin]">
        {main.map((s, i) => {
          const Icon = s.icon;
          const inside = s.key === section.key;
          // A section with screens of its own hands "you are here" to the
          // screen's row beneath it; only a one-screen section claims it.
          const onParent = current === s.href;
          const claims = onParent && (narrow || s.tabs.length === 1);
          const badge = s.tabs.reduce((n, t) => n + (badges[t.href] ?? 0), 0);
          const startsGroup = i > 0 && main[i - 1].group !== s.group;
          return (
            <li key={s.key} className={startsGroup ? "mt-3 border-t border-white/[0.08] pt-3" : ""}>
              <Link
                href={s.href}
                onClick={() => setOpen(false)}
                title={narrow ? s.label : undefined}
                aria-current={claims ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center gap-3 rounded-[10px] text-[14px] font-medium transition-colors",
                  narrow ? "justify-center" : "px-2.5",
                  onParent ? "bg-white/[0.12] text-white" : inside ? "bg-white/[0.05] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {inside && !narrow && <span aria-hidden className={cn("absolute -left-3 top-1.5 h-6 w-[3px] rounded-r-full", DOT[s.tone])} />}
                <Icon className="h-[17px] w-[17px] shrink-0" />
                {!narrow && <span className="flex-1 truncate">{s.label}</span>}
                {badge > 0 && (
                  <span className={cn("rounded-full bg-[#6666ff] px-1.5 text-[11px] font-bold text-white", narrow && "absolute -right-0.5 -top-0.5")}>{badge}</span>
                )}
                {!narrow && s.tone !== "ink" && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", DOT[s.tone], inside ? "" : "opacity-40")} />}
              </Link>
              {/* Only the section you are in opens its screens. */}
              {!narrow && s.tabs.length > 1 && (
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                    inside ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                  inert={!inside}
                >
                  <ul className="ml-[1.3rem] flex min-h-0 flex-col overflow-hidden border-l border-white/[0.08] pl-3">
                    {s.tabs.map((t) => {
                      // A screen with no row of its own (Page drafts) lights the row it sits under.
                      const on = t.href === current || (s.hidden.some((h) => h.href === current) && current?.startsWith(`${t.href}/`) === true);
                      const n = badges[t.href] ?? 0;
                      return (
                        <li key={t.href}>
                          <Link
                            href={t.href}
                            onClick={() => setOpen(false)}
                            aria-current={on ? "page" : undefined}
                            className={cn(
                              "flex items-center justify-between rounded-lg px-2.5 py-[5px] text-[13px] transition-colors",
                              on ? "bg-white/[0.12] font-semibold text-white" : "text-white/45 hover:text-white"
                            )}
                          >
                            {t.label}
                            {n > 0 && t.href !== s.href && <span className="rounded-full bg-white/15 px-1.5 text-[10.5px] font-bold text-white">{n}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-0.5 border-t border-white/10 pt-3">
        {foot.map((s) => {
          const Icon = s.icon;
          const inside = s.key === section.key;
          return (
            <Link
              key={s.key}
              href={s.href}
              onClick={() => setOpen(false)}
              title={narrow ? s.label : undefined}
              aria-current={current === s.href && s.tabs.length === 1 ? "page" : undefined}
              className={cn(
                "flex h-9 items-center gap-3 rounded-[10px] text-[14px] font-medium",
                narrow ? "justify-center" : "px-2.5",
                inside ? "bg-white/[0.12] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icon className="h-[17px] w-[17px]" /> {!narrow && s.label}
            </Link>
          );
        })}
        <Link
          href="/support"
          title={narrow ? "Help and support" : undefined}
          className={cn("flex h-9 items-center gap-3 rounded-[10px] text-[14px] font-medium text-white/65 hover:bg-white/[0.06] hover:text-white", narrow ? "justify-center" : "px-2.5")}
        >
          <LifeBuoy className="h-[17px] w-[17px]" /> {!narrow && "Help and support"}
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* The phone's drawer. */}
      {open && (
        <div id="admin-nav" className="fixed inset-0 z-40 overflow-y-auto bg-[#0a0a0a] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          {rail(false)}
        </div>
      )}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 bg-[#0a0a0a] lg:block",
          folded ? "w-[4.5rem]" : "w-[15.5rem]"
        )}
      >
        {rail(folded)}
      </aside>
    </>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
