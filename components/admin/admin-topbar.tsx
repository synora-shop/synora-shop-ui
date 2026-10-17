"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight, FileText, HelpCircle, Keyboard, Menu, Package, Plus, Search, Tag, Users, X,
} from "lucide-react";
import { AdminSearch } from "@/components/admin/admin-search";
import { NotificationIcon } from "@/components/admin/nav-icons";
import { resolveNav } from "@/lib/admin-nav";
import { useAdminNav } from "@/lib/admin-nav-store";
import { cn } from "@/lib/utils";

/**
 * The top bar (new admin, 15 October).
 *
 * White, sticky over the page, and short: where you are on the left (from the
 * navigation model, plus the one crumb only a page knows, like an order's
 * number), and on the right the three things wanted from anywhere: Create,
 * the alerts and the shortcuts. You are not here: since 17 October the
 * signed-in person and their menu live at the foot of the rail, once.
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

export function AdminTopbar({ alerts = [] }: { alerts?: Alert[] }) {
  const pathname = usePathname();
  const router = useRouter();
  // Each menu remembers the page it was opened on, so moving to another page
  // closes it without an effect: it simply stops matching.
  const [menuAt, setMenuAt] = useState<{ which: "bell" | "create"; at: string } | null>(null);
  const [keysAt, setKeysAt] = useState<string | null>(null);
  const menu = menuAt?.at === pathname ? menuAt.which : null;
  const keys = keysAt === pathname;
  const setMenu = (which: "bell" | "create" | null) => setMenuAt(which ? { which, at: pathname } : null);
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
    <header className="sticky top-0 z-30 flex h-12 items-center gap-1.5 border-b border-[#0a0a0a]/[0.06] bg-white/90 px-4 backdrop-blur-md sm:px-6">
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
        className="grid h-8 w-8 place-items-center rounded-[9px] hover:bg-[#f0f0f0] lg:hidden"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      <div className="relative">
        <button
          type="button"
          aria-expanded={menu === "create"}
          onClick={() => setMenu(menu === "create" ? null : "create")}
          className="inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#0a0a0a] px-3 text-[13px] font-semibold text-white hover:bg-[#262626]"
        >
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create</span>
        </button>
        {menu === "create" && (
          <div className="absolute right-0 top-10 z-50 w-60 rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
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
          className="relative grid h-8 w-8 place-items-center rounded-[9px] hover:bg-[#f0f0f0]"
        >
          <NotificationIcon unread={alerts.length > 0} className="h-[18px] w-[18px]" />
        </button>
        {menu === "bell" && (
          <div className="absolute right-0 top-10 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
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
        className="hidden h-8 w-8 place-items-center rounded-[9px] hover:bg-[#f0f0f0] sm:grid"
      >
        <HelpCircle className="h-[18px] w-[18px]" />
      </button>

      {/* A click anywhere else closes an open menu. */}
      {menu && <button type="button" aria-label="Close menu" onClick={() => setMenu(null)} className="fixed inset-0 z-40 cursor-default" />}

      {searching && <AdminSearch onClose={() => setSearching(false)} />}
      {keys && <Shortcuts onClose={() => setKeysAt(null)} />}
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

