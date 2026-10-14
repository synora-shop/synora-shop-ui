"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronRight, ExternalLink, FileText, HelpCircle, Info, Keyboard, LogOut, Menu, Package, Plus,
  Search, Store, Tag, Users, X,
} from "lucide-react";
import { AdminSearch } from "@/components/admin/admin-search";
import { BusinessTypeDialog } from "@/components/admin/business-type-dialog";
import { AccountIcon, NotificationIcon } from "@/components/admin/nav-icons";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import type { ShopStatusName } from "@/lib/store-type-switch";
import { resolveNav } from "@/lib/admin-nav";
import { useAdminNav } from "@/lib/admin-nav-store";
import { cn } from "@/lib/utils";

/**
 * The top bar (new admin, 15 October).
 *
 * White, sticky over the page, and short: where you are on the left (from the
 * navigation model, plus the one crumb only a page knows, like an order's
 * number), and on the right the four things wanted from anywhere: Create, the
 * alerts, the shortcuts, and you. Everything the old header's account menu
 * held is still in that menu: the store's state, previewing it, your
 * account, the business type, switching store, signing out.
 *
 * It also owns the keyboard, because it is mounted on every screen:
 *   ⌘K or /   the command bar
 *   G then …  go to a section (G O orders, G P products, G S settings…)
 *   C         the Create menu
 *   ?         the list of these
 */
export type Alert = { label: string; href: string };

const GOTO: Record<string, string> = {
  h: "/admin", o: "/admin/orders", p: "/admin/products", c: "/admin/customers", d: "/admin/discounts",
  f: "/admin/data", a: "/admin/analytics", t: "/admin/theme", s: "/admin/store",
};

const CREATE: [string, string, typeof Package][] = [
  ["Product", "/admin/products/new", Package],
  ["Collection", "/admin/categories", Package],
  ["Discount code", "/admin/discounts", Tag],
  ["Page", "/admin/pages", FileText],
  ["Menu", "/admin/menus", FileText],
  ["Team member", "/admin/account", Users],
];

export function AdminTopbar({
  storeName,
  isLive,
  userEmail,
  storeUrl,
  registryType,
  storeStatus,
  hasOtherStores = false,
  alerts = [],
}: {
  storeName: string;
  isLive: boolean;
  userEmail: string;
  storeUrl: string;
  registryType: string;
  storeStatus: ShopStatusName;
  hasOtherStores?: boolean;
  alerts?: Alert[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Each menu remembers the page it was opened on, so moving to another page
  // closes it without an effect: it simply stops matching.
  const [menuAt, setMenuAt] = useState<{ which: "account" | "bell" | "create"; at: string } | null>(null);
  const [keysAt, setKeysAt] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"info" | "switch" | null>(null);
  const menu = menuAt?.at === pathname ? menuAt.which : null;
  const keys = keysAt === pathname;
  const setMenu = (which: "account" | "bell" | "create" | null) => setMenuAt(which ? { which, at: pathname } : null);
  const navOpen = useAdminNav((s) => s.open);
  const toggleNav = useAdminNav((s) => s.toggle);
  const trailing = useAdminNav((s) => s.crumb);
  const searching = useAdminNav((s) => s.searching);
  const setSearching = useAdminNav((s) => s.setSearching);
  const { section, current } = resolveNav(pathname);
  const tab = [...section.tabs, ...section.hidden].find((t) => t.href === current);

  const here = [section.label];
  if (tab && tab.label !== section.label) here.push(tab.label);
  if (trailing) here.push(trailing);

  const pendingG = useRef(0);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT" || target?.isContentEditable;
      const palette = (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (palette || (event.key === "/" && !typing)) {
        event.preventDefault();
        setMenuAt(null);
        setSearching(true);
        return;
      }
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "Escape") {
        setMenuAt(null);
        setKeysAt(null);
        return;
      }
      if (event.key === "?") {
        setKeysAt((k) => (k ? null : window.location.pathname));
        return;
      }
      if (Date.now() - pendingG.current < 900 && GOTO[event.key]) {
        pendingG.current = 0;
        router.push(GOTO[event.key]);
        return;
      }
      if (event.key === "g") pendingG.current = Date.now();
      else if (event.key === "c") setMenuAt((m) => (m?.which === "create" ? null : { which: "create", at: window.location.pathname }));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, setSearching]);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#0a0a0a]/[0.06] bg-white px-4 py-2.5 sm:px-6">
      <button
        type="button"
        aria-label={navOpen ? "Close menu" : "Open menu"}
        aria-expanded={navOpen}
        aria-controls="admin-nav"
        onClick={toggleNav}
        className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] hover:bg-[#f0f0f0] lg:hidden"
      >
        {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <h1 className="sr-only">{here[here.length - 1]}</h1>
      <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[13.5px] text-[#0a0a0a]">
        {here.map((h, i) => (
          <span key={`${i}${h}`} className={cn("truncate", i === here.length - 1 ? "font-semibold" : "text-[#0a0a0a]/45")}>
            {i > 0 && <span className="mr-1.5 text-[#0a0a0a]/25">/</span>}
            {i === 0 && here.length > 1 ? <Link href={section.href} className="hover:text-[#0a0a0a]">{h}</Link> : h}
          </span>
        ))}
      </p>

      <button
        type="button"
        aria-label="Search the admin"
        title="Search (⌘K)"
        onClick={() => {
          setMenuAt(null);
          setSearching(true);
        }}
        className="grid h-9 w-9 place-items-center rounded-[10px] hover:bg-[#f0f0f0] lg:hidden"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      <div className="relative">
        <button
          type="button"
          aria-expanded={menu === "create"}
          onClick={() => setMenu(menu === "create" ? null : "create")}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3 text-[13px] font-semibold text-white hover:bg-[#262626]"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create</span>
        </button>
        {menu === "create" && (
          <div className="absolute right-0 top-11 z-50 w-60 rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
            {CREATE.map(([label, href, Icon]) => (
              <Link key={label} href={href} onClick={() => setMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] hover:bg-[#f5f5f5]">
                <Icon className="h-4 w-4 text-[#0a0a0a]/55" /> {label}
              </Link>
            ))}
            <p className="border-t border-[#0a0a0a]/[0.06] px-3 py-2 text-[11.5px] text-[#0a0a0a]/45">Press C to open this anywhere</p>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label={alerts.length ? `${alerts.length} things need attention` : "Notifications"}
          title={alerts.length ? `${alerts.length} things need attention` : "Notifications"}
          aria-expanded={menu === "bell"}
          onClick={() => setMenu(menu === "bell" ? null : "bell")}
          className="relative grid h-9 w-9 place-items-center rounded-[10px] hover:bg-[#f0f0f0]"
        >
          <NotificationIcon unread={alerts.length > 0} className="h-[18px] w-[18px]" />
        </button>
        {menu === "bell" && (
          <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
            <p className="border-b border-[#0a0a0a]/[0.06] px-4 py-3 text-[14px] font-semibold">Needs you</p>
            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13.5px] text-[#0a0a0a]/55">Nothing needs your attention.</p>
            ) : (
              <ul className="p-1.5">
                {alerts.map((a) => (
                  <li key={a.href}>
                    <Link href={a.href} onClick={() => setMenu(null)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold hover:bg-[#fafafa]">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0a0a0a] text-white"><NotificationIcon className="h-4 w-4" /></span>
                      <span className="flex-1">{a.label}</span>
                      <ChevronRight className="h-4 w-4 text-[#0a0a0a]/35" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Keyboard shortcuts"
        title="Shortcuts (?)"
        onClick={() => setKeysAt(pathname)}
        className="hidden h-9 w-9 place-items-center rounded-[10px] hover:bg-[#f0f0f0] sm:grid"
      >
        <HelpCircle className="h-[18px] w-[18px]" />
      </button>

      <div className="relative">
        <button
          type="button"
          aria-label="Store and account menu"
          aria-expanded={menu === "account"}
          onClick={() => setMenu(menu === "account" ? null : "account")}
          className="grid h-9 w-9 place-items-center rounded-full bg-[#0a0a0a] text-[12px] font-semibold text-white"
        >
          {initials(userEmail.split("@")[0])}
        </button>
        {menu === "account" && (
          <div className="absolute right-0 top-11 z-50 w-72 rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
            <div className="px-3 py-2.5">
              <p className="truncate text-[14px] font-semibold">{storeName}</p>
              <p className="mt-0.5 truncate text-[12.5px] text-[#0a0a0a]/55">{userEmail}</p>
              <p className={cn("mt-2 flex items-center gap-1.5 text-[12px] font-semibold", isLive ? "text-[#11643f]" : "text-[#7a4b00]")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-[#2fb37c]" : "bg-[#f2a33a]")} aria-hidden />
                {isLive ? "Live: customers can see your store" : "Hidden while in maintenance"}
              </p>
            </div>
            <div className="border-t border-[#0a0a0a]/[0.06] py-1">
              <a href={storeUrl} target="_blank" rel="noreferrer" onClick={() => setMenu(null)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] hover:bg-[#f5f5f5]">
                <Store className="h-4 w-4 text-[#0a0a0a]/50" /> Preview store <ExternalLink className="ml-auto h-3.5 w-3.5 opacity-50" />
              </a>
              <Link href="/admin/account" onClick={() => setMenu(null)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] hover:bg-[#f5f5f5]">
                <AccountIcon className="h-4 w-4 text-[#0a0a0a]/50" /> Your account
              </Link>
              <button type="button" onClick={() => { setMenu(null); setDialog("switch"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] hover:bg-[#f5f5f5]">
                <ChevronRight className="h-4 w-4 text-[#0a0a0a]/50" /> Change APP type
              </button>
              <button type="button" onClick={() => { setMenu(null); setDialog("info"); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] hover:bg-[#f5f5f5]">
                <Info className="h-4 w-4 text-[#0a0a0a]/50" /> Which type fits your business?
              </button>
              {hasOtherStores && (
                <Link href="/merchant/stores" onClick={() => setMenu(null)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13.5px] hover:bg-[#f5f5f5]">
                  <Store className="h-4 w-4 text-[#0a0a0a]/50" /> Switch store
                </Link>
              )}
            </div>
            <div className="border-t border-[#0a0a0a]/[0.06] pt-1">
              <button type="button" onClick={() => signOut({ redirectTo: "/" })} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13.5px] text-[#a3330c] hover:bg-[#fff1ec]">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
              <p className="flex items-center justify-center py-2"><SynoraAppMark className="h-4 w-auto text-[#0a0a0a]/35" /></p>
            </div>
          </div>
        )}
      </div>

      {/* A click anywhere else closes an open menu. */}
      {menu && <button type="button" aria-label="Close menu" onClick={() => setMenu(null)} className="fixed inset-0 z-40 cursor-default" />}

      {searching && <AdminSearch onClose={() => setSearching(false)} />}
      {keys && <Shortcuts onClose={() => setKeysAt(null)} />}
      {dialog && <BusinessTypeDialog current={registryType} mode={dialog} status={storeStatus} onClose={() => setDialog(null)} />}
    </header>
  );
}

function Shortcuts({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["⌘ K   or   /", "Search and commands"],
    ["C", "Create something"],
    ["G  H", "Home"],
    ["G  O", "Orders"],
    ["G  P", "Products"],
    ["G  C", "Customers"],
    ["G  D", "Discounts"],
    ["G  F", "Files and content"],
    ["G  A", "Analytics"],
    ["G  T", "Online store and themes"],
    ["G  S", "Settings"],
    ["?", "This list"],
  ];
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/30 px-3 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div role="dialog" aria-label="Keyboard shortcuts" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)] ring-1 ring-black/10">
        <p className="flex items-center gap-2.5 border-b border-[#0a0a0a]/[0.07] px-5 py-4 text-[15px] font-semibold"><Keyboard className="h-5 w-5" /> Keyboard shortcuts</p>
        <ul className="divide-y divide-[#0a0a0a]/[0.05] px-5 py-2">
          {rows.map(([k, l]) => (
            <li key={k} className="flex items-center justify-between py-2.5 text-[14px]">
              {l}
              <kbd className="rounded-md bg-[#f0f0f0] px-2 py-0.5 font-sans text-[12px] font-semibold">{k}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
