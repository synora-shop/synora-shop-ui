"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { signOut } from "next-auth/react";
import {
  ChevronRight, ChevronsUpDown, CreditCard, ExternalLink, FileText, HelpCircle, Info, LogOut, Package,
  PanelLeftClose, PanelLeftOpen, Plus, Repeat, Search, ShoppingBag, Tag, Users, X,
} from "lucide-react";
import { useAdminNav } from "@/lib/admin-nav-store";
import { resolveNav, type NavTone } from "@/lib/admin-nav";
import { BusinessTypeDialog } from "@/components/admin/business-type-dialog";
import { AccountIcon, NotificationIcon } from "@/components/admin/nav-icons";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import type { ShopStatusName } from "@/lib/store-type-switch";
import { cn } from "@/lib/utils";

/**
 * The rail (18 October, from the third design at /next-admin).
 *
 * Black and 216px. At the top the Synora mark, the alerts and the fold; then
 * search and Create side by side; then the sections, where only the one you
 * are in opens its screens (its first screen is the section itself, so it is
 * not written again beneath it); then Settings, Bin and Help; and at the very
 * foot the one profile in the admin: the store's name with the email signed
 * in. It opens your account, previewing the store, the business type,
 * switching store and signing out. There is no top bar: every screen's own
 * heading is the bar (components/ui/primitives PageHeader).
 *
 * Which row is lit comes from resolveNav and nowhere else, so exactly one
 * section is ever current: see lib/admin-nav.ts and scripts/check-active-nav.ts.
 */
export type Alert = { label: string; href: string };

const DOT: Record<NavTone, string> = {
  iris: "bg-[#6666ff]",
  lavender: "bg-[#b7b9ff]",
  sky: "bg-[#8cc8f5]",
  mint: "bg-[#6fd6a8]",
  ink: "bg-white",
};

const CREATE: [string, string, typeof Package][] = [
  ["Product", "/admin/products/new", Package],
  ["Order by hand", "/admin/orders/drafts/new", ShoppingBag],
  ["Collection", "/admin/categories", Package],
  ["Discount code", "/admin/discounts", Tag],
  ["Page", "/admin/pages", FileText],
  ["Menu", "/admin/menus", FileText],
  ["Team member", "/admin/account", Users],
];

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
  userEmail,
  storeUrl,
  registryType,
  storeStatus,
  alerts = [],
}: {
  storeName: string;
  statusLabel: string;
  isLive: boolean;
  /** Counts that need the merchant, keyed by the screen they belong to. */
  badges?: Record<string, number>;
  hasOtherStores?: boolean;
  userEmail: string;
  storeUrl: string;
  registryType: string;
  storeStatus: ShopStatusName;
  alerts?: Alert[];
}) {
  const open = useAdminNav((s) => s.open);
  const setOpen = useAdminNav((s) => s.setOpen);
  const setSearching = useAdminNav((s) => s.setSearching);
  const folded = useRailFolded();
  const pathname = usePathname();
  const { sections, section, current } = resolveNav(pathname);
  // Each menu remembers the page it opened on, so moving page closes it.
  const [menuAt, setMenuAt] = useState<{ which: "me" | "bell" | "create"; at: string } | null>(null);
  const menu = menuAt?.at === pathname ? menuAt.which : null;
  const show = (which: "me" | "bell" | "create" | null) => setMenuAt(which ? { which, at: pathname } : null);
  const [dialog, setDialog] = useState<"info" | "switch" | null>(null);
  const go = () => { setOpen(false); show(null); };
  // C, anywhere, opens Create (components/admin/admin-topbar.tsx sends it).
  useEffect(() => {
    const on = () => setMenuAt((m) => (m?.which === "create" ? null : { which: "create", at: window.location.pathname }));
    window.addEventListener("admin-create", on);
    return () => window.removeEventListener("admin-create", on);
  }, []);

  // Your account is a settings screen in the model; the profile menu reaches it from there.
  const accountHref = sections.flatMap((s) => s.tabs).find((t) => t.href.endsWith("/account"))?.href ?? section.href;
  const main = sections.filter((s) => s.group !== 3);
  const foot = sections.filter((s) => s.group === 3);

  const rail = (narrow: boolean) => (
    <nav aria-label="Admin" className="flex h-full flex-col text-white">
      {/* Synora, the alerts, and the fold. */}
      <div className={cn("flex shrink-0 items-center gap-1", narrow ? "flex-col px-2 py-2" : "h-12 px-3")}>
        {!narrow && (
          <Link href="/admin" onClick={go} aria-label="Home" className="mr-auto flex items-center text-white/90 hover:text-white">
            <SynoraAppMark className="h-[15px]" />
          </Link>
        )}
        <div className="relative">
          <button type="button" aria-label={alerts.length ? `${alerts.length} things need attention` : "Alerts"} aria-expanded={menu === "bell"} onClick={() => show(menu === "bell" ? null : "bell")} className="relative grid h-7 w-7 place-items-center rounded-[8px] text-white/60 hover:bg-white/10 hover:text-white">
            {/* The drawn bell from Assestz; its unread ring is cut from the rail's black. */}
            <NotificationIcon unread={alerts.length > 0} className="h-4 w-4 [--color-panel:#0a0a0a]" />
          </button>
          {menu === "bell" && (
            <Pop className="left-0 top-9 w-[min(21rem,calc(100vw-2rem))] lg:left-full lg:top-0 lg:ml-3">
              <p className="flex h-10 items-center border-b border-[#0a0a0a]/[0.06] px-3.5 text-[13px] font-semibold">Needs you</p>
              {alerts.length === 0 ? (
                <p className="px-4 py-6 text-center text-[13px] text-[#0a0a0a]/55">Nothing needs your attention.</p>
              ) : (
                <ul className="p-1">
                  {alerts.map((a) => (
                    <li key={a.href}>
                      <Link href={a.href} onClick={go} className="flex h-10 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] font-medium hover:bg-[#f3f3f3]">
                        <NotificationIcon className="h-4 w-4 text-[#6666ff]" />
                        <span className="flex-1">{a.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[#a3a3a3]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Pop>
          )}
        </div>
        <button type="button" onClick={toggleRailFold} aria-label={narrow ? "Open the menu out" : "Fold the menu"} title={narrow ? "Open the menu out" : "Fold the menu"} className="hidden h-7 w-7 place-items-center rounded-[8px] text-white/45 hover:bg-white/10 hover:text-white lg:grid">
          {narrow ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Search and Create, side by side. */}
      <div className={cn("flex shrink-0 gap-1.5 pb-2", narrow ? "flex-col items-center px-2" : "px-3")}>
        <button type="button" onClick={() => { go(); setSearching(true); }} title="Search and commands (⌘K)" className={cn("flex h-8 items-center gap-2 rounded-[10px] bg-white/[0.07] text-[13px] text-white/50 hover:bg-white/[0.11]", narrow ? "w-8 justify-center" : "min-w-0 flex-1 px-2.5")}>
          <Search className="h-3.5 w-3.5 shrink-0" />
          {!narrow && <><span className="flex-1 truncate text-left">Search</span><kbd className="text-[11px] text-white/35">⌘K</kbd></>}
        </button>
        <div className="relative">
          <button type="button" aria-label="Create" title="Create (C)" aria-expanded={menu === "create"} onClick={() => show(menu === "create" ? null : "create")} className="grid h-8 w-8 place-items-center rounded-[10px] bg-white text-[#0a0a0a] hover:bg-white/85">
            <Plus className="h-4 w-4" />
          </button>
          {menu === "create" && (
            <Pop className="right-0 top-10 w-56 lg:left-full lg:right-auto lg:top-0 lg:ml-3">
              <p className="px-3 pb-1 pt-2.5 text-[11.5px] font-medium text-[#737373]">Create</p>
              <div className="px-1 pb-1">
                {CREATE.map(([l, h, I]) => (
                  <Link key={l} href={h} onClick={go} className="flex h-8 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] hover:bg-[#f3f3f3]">
                    <I className="h-4 w-4 text-[#737373]" /> {l}
                  </Link>
                ))}
              </div>
              <p className="border-t border-[#0a0a0a]/[0.06] px-3 py-2 text-[11.5px] text-[#a3a3a3]">Press C anywhere</p>
            </Pop>
          )}
        </div>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-2 py-1 [scrollbar-width:thin]">
        {main.map((s, i) => {
          const Icon = s.icon;
          const inside = s.key === section.key;
          const onParent = current === s.href;
          const below = s.tabs.filter((t) => t.href !== s.href);
          // Open, the parent counts its own screen and each row below counts
          // its own; folded or shut, the parent carries the lot.
          const badge = narrow || !inside ? s.tabs.reduce((n, t) => n + (badges[t.href] ?? 0), 0) : badges[s.href] ?? 0;
          const startsGroup = i > 0 && main[i - 1].group !== s.group;
          return (
            <li key={s.key} className={startsGroup ? "mt-1.5 border-t border-white/[0.08] pt-1.5" : ""}>
              <Link
                href={s.href}
                onClick={go}
                title={narrow ? s.label : undefined}
                aria-current={onParent ? "page" : undefined}
                className={cn(
                  "relative flex h-8 items-center gap-2.5 rounded-[10px] text-[13.5px] font-medium transition-colors",
                  narrow ? "justify-center" : "px-2.5",
                  onParent ? "bg-white/[0.12] text-white" : inside ? "bg-white/[0.05] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {inside && !narrow && <span aria-hidden className={cn("absolute -left-2 top-1.5 h-5 w-[3px] rounded-r-full", DOT[s.tone])} />}
                <Icon className="h-4 w-4 shrink-0" />
                {!narrow && <span className="flex-1 truncate">{s.label}</span>}
                {badge > 0 && <span className={cn("rounded-full bg-[#6666ff] px-1.5 text-[11px] font-bold tabular-nums text-white", narrow && "absolute -right-0.5 -top-0.5")}>{badge}</span>}
                {!narrow && s.tone !== "ink" && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", DOT[s.tone], inside ? "" : "opacity-40")} />}
              </Link>
              {!narrow && inside && below.length > 0 && (
                <ul className="mb-1 ml-[17px] mt-px flex flex-col gap-px border-l border-white/[0.09] pl-2">
                  {below.map((t) => {
                    // A screen with no row of its own (Page drafts) lights the row it sits under.
                    const on = t.href === current || (s.hidden.some((h) => h.href === current) && current?.startsWith(`${t.href}/`) === true);
                    const n = badges[t.href] ?? 0;
                    return (
                      <li key={t.href}>
                        <Link href={t.href} onClick={go} aria-current={on ? "page" : undefined} className={cn("flex h-7 items-center justify-between rounded-[8px] px-2.5 text-[13px]", on ? "bg-white/[0.12] font-semibold text-white" : "text-white/45 hover:text-white")}>
                          {t.label}
                          {n > 0 && <span className="text-[11px] tabular-nums text-white/50">{n}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex shrink-0 flex-col gap-px border-t border-white/[0.08] px-2 py-1.5">
        {foot.map((s) => {
          const Icon = s.icon;
          const on = s.key === section.key;
          return (
            <Link key={s.key} href={s.href} onClick={go} title={narrow ? s.label : undefined} aria-current={current === s.href && s.tabs.length === 1 ? "page" : undefined} className={cn("flex h-8 items-center gap-2.5 rounded-[10px] text-[13.5px] font-medium", narrow ? "justify-center" : "px-2.5", on ? "bg-white/[0.12] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white")}>
              <Icon className="h-4 w-4 shrink-0" /> {!narrow && s.label}
            </Link>
          );
        })}
        <Link href="/support" title={narrow ? "Help" : undefined} className={cn("flex h-8 items-center gap-2.5 rounded-[10px] text-[13.5px] font-medium text-white/65 hover:bg-white/[0.06] hover:text-white", narrow ? "justify-center" : "px-2.5")}>
          <HelpCircle className="h-4 w-4 shrink-0" /> {!narrow && "Help"}
        </Link>
      </div>

      {/* The store, and you in it: the one profile in the admin. */}
      <div className="relative shrink-0 border-t border-white/[0.08] p-2">
        <button type="button" aria-label="Store and account" aria-expanded={menu === "me"} onClick={() => show(menu === "me" ? null : "me")} title={narrow ? `${storeName} · ${userEmail}` : undefined} className={cn("flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left hover:bg-white/[0.06]", menu === "me" && "bg-white/[0.08]", narrow && "justify-center")}>
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#b8efd6] text-[11px] font-bold text-[#0a0a0a]">
            {initials(storeName)}
            <span aria-hidden className={cn("absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#0a0a0a]", isLive ? "bg-[#22c55e]" : "bg-[#f2a33a]")} />
          </span>
          {!narrow && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-semibold">{storeName}</span>
                <span className="block truncate text-[11.5px] text-white/45">{userEmail}</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-white/35" />
            </>
          )}
        </button>
        {menu === "me" && (
          <Pop className={cn("w-64", narrow ? "bottom-2 left-full ml-2" : "bottom-full left-2 mb-1")}>
            <div className="border-b border-[#0a0a0a]/[0.06] px-3.5 py-3">
              <p className="truncate text-[13px] font-semibold">{storeName}</p>
              <p className="truncate text-[12px] text-[#737373]">{userEmail}</p>
              <p className={cn("mt-1.5 flex items-center gap-1.5 text-[12px] font-medium", isLive ? "text-[#11643f]" : "text-[#7a4b00]")}><span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-[#2fb37c]" : "bg-[#f2a33a]")} /> {statusLabel}</p>
            </div>
            <div className="p-1">
              <Link href={accountHref} onClick={go} className={MENU}><AccountIcon /> Your account</Link>
              <a href={storeUrl} target="_blank" rel="noreferrer" onClick={() => show(null)} className={MENU}><ExternalLink /> Preview store</a>
              <button type="button" onClick={() => { show(null); setDialog("switch"); }} className={MENU}><CreditCard /> Change APP type</button>
              <button type="button" onClick={() => { show(null); setDialog("info"); }} className={MENU}><Info /> Which type fits your business?</button>
              {hasOtherStores && <Link href="/merchant/stores" onClick={go} className={MENU}><Repeat /> Switch store</Link>}
            </div>
            <div className="border-t border-[#0a0a0a]/[0.06] p-1">
              <button type="button" onClick={() => signOut({ redirectTo: "/" })} className={cn(MENU, "text-[#a3330c] hover:bg-[#fff1ec]")}><LogOut /> Sign out</button>
            </div>
          </Pop>
        )}
      </div>
    </nav>
  );

  return (
    <>
      {/* The phone's drawer. */}
      {open && (
        <div id="admin-nav" className="fixed inset-x-0 bottom-0 top-12 z-40 bg-[#0a0a0a] lg:hidden">
          {rail(false)}
        </div>
      )}
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden bg-[#0a0a0a] lg:block", folded ? "w-16" : "w-[13.5rem]")}>{rail(folded)}</aside>
      {menu && <div aria-hidden className="fixed inset-0 z-30" onMouseDown={() => show(null)} />}
      {dialog && <BusinessTypeDialog current={registryType} mode={dialog} status={storeStatus} onClose={() => setDialog(null)} />}
    </>
  );
}

/** The phone's slim bar: the drawer, the Synora mark, and search. */
export function AdminPhoneBar() {
  const open = useAdminNav((s) => s.open);
  const toggle = useAdminNav((s) => s.toggle);
  const setSearching = useAdminNav((s) => s.setSearching);
  return (
    <div className="sticky top-0 z-30 flex h-12 items-center gap-2 bg-[#0a0a0a] px-3 text-white lg:hidden">
      <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="admin-nav" onClick={toggle} className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-white/10">
        {open ? <X className="h-5 w-5" /> : <MenuIcon />}
      </button>
      <SynoraAppMark className="mr-auto h-[15px]" />
      <button type="button" aria-label="Search" onClick={() => setSearching(true)} className="grid h-8 w-8 place-items-center rounded-[8px] hover:bg-white/10"><Search className="h-4 w-4" /></button>
    </div>
  );
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

const MENU = "flex h-8 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] text-[#1f1f1f] hover:bg-[#f3f3f3] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#737373]";

function Pop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`absolute z-50 overflow-hidden rounded-[14px] bg-white text-[#0a0a0a] shadow-[0_20px_50px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/10 ${className}`}>{children}</div>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * The sheet (18 October): the rounded canvas set into the black. On a
 * computer it holds still, corners and all, and only what is inside it
 * scrolls; on a phone the page scrolls as usual under the slim bar.
 */
export function AdminSheet({ children }: { children: ReactNode }) {
  const folded = useRailFolded();
  return (
    <main
      id="admin-sheet"
      className={cn(
        "min-h-[calc(100dvh-3rem)] bg-canvas lg:fixed lg:bottom-2 lg:right-2 lg:top-2 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:rounded-[20px] [scrollbar-width:thin]",
        folded ? "lg:left-16" : "lg:left-[13.5rem]"
      )}
    >
      {children}
    </main>
  );
}
