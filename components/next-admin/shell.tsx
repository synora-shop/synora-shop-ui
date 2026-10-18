"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell, ChevronsUpDown, CornerDownLeft, CreditCard, ExternalLink, HelpCircle, Keyboard, LifeBuoy, LogOut, Menu, MessageSquare,
  Package, PanelLeftClose, PanelLeftOpen, Plus, Repeat, Search, ShoppingBag, Sparkles, Trash2, TriangleAlert, UserRound, X,
} from "lucide-react";
import { ALERTS, SHOP } from "@/lib/new-admin/sample";
import { ICONS } from "@/components/new-admin/ui";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { ToastCtx } from "@/components/next-admin/bits";
import { A, COMMANDS, GOTO, RAIL, STORE_SETTINGS, to, type Command } from "@/components/next-admin/nav";

/**
 * The third design's frame (/next-admin, 18 October).
 *
 * A narrow black rail, 208px: the Synora mark, then search and Create side by
 * side, then the sections (only the one you are in opens), then Settings, Bin
 * and Help, and at the very foot the store. There is one "you" in the whole
 * admin, and it is that button: the store's name with the email signed in,
 * opening the account, plan, preview, switching and signing out.
 *
 * No top bar. Each screen's own heading is the bar (components/next-admin/ui
 * Page), so the first 52px of every screen are its name and its actions.
 */
type Toast = { id: number; text: string; undo?: () => void };

function readFold() {
  try {
    return localStorage.getItem("na3-folded") === "1";
  } catch {
    return false;
  }
}
function subscribeFold(on: () => void) {
  window.addEventListener("na3-fold", on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener("na3-fold", on);
    window.removeEventListener("storage", on);
  };
}

const CREATE: [string, string, typeof Package][] = [
  ["Product", `${A}/products/zohra`, Package],
  ["Order by hand", `${A}/orders/drafts`, ShoppingBag],
  ["Discount code", `${A}/discounts/new`, ICONS.discounts],
  ["Blog post", `${A}/content/blog/new`, ICONS.content],
  ["Collection", `${A}/products/collections`, ICONS.boxes],
  ["Page", `${A}/online-store/pages`, ICONS.content],
  ["Menu", `${A}/content/menus`, ICONS.app],
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const folded = useSyncExternalStore(subscribeFold, readFold, () => false);
  // Each overlay remembers the page it opened on; moving page closes it.
  const [openAt, setOpenAt] = useState<{ what: "palette" | "keys" | "create" | "bell" | "me" | "drawer"; at: string } | null>(null);
  const open = openAt?.at === path ? openAt.what : null;
  const show = (what: NonNullable<typeof open> | null) => setOpenAt(what ? { what, at: path } : null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fold = () => {
    try {
      localStorage.setItem("na3-folded", readFold() ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event("na3-fold"));
  };

  const toast = useCallback((text: string, undo?: () => void) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.filter((x) => x.text !== text), { id, text, undo }].slice(-3));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const pendingG = useRef(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpenAt({ what: "palette", at: window.location.pathname });
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") return setOpenAt(null);
      if (e.key === "?") return setOpenAt((o) => (o?.what === "keys" ? null : { what: "keys", at: window.location.pathname }));
      if (Date.now() - pendingG.current < 900 && GOTO[e.key]) {
        pendingG.current = 0;
        router.push(GOTO[e.key]);
        return;
      }
      if (e.key === "g") pendingG.current = Date.now();
      if (e.key === "c") setOpenAt((o) => (o?.what === "create" ? null : { what: "create", at: window.location.pathname }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const inSettings = path.startsWith(`${A}/settings`);
  const unread = ALERTS.filter((a) => a.unread).length;

  const rail = (narrow: boolean) => (
    <nav aria-label="Admin" className="flex h-full flex-col text-white">
      {/* Synora, the alerts, and the fold. */}
      <div className={`flex shrink-0 items-center gap-1 ${narrow ? "flex-col px-2 py-2" : "h-12 px-3"}`}>
        {!narrow && (
          <Link href={A} aria-label="Home" className="mr-auto flex items-center text-white/90 hover:text-white">
            <SynoraAppMark className="h-[15px]" />
          </Link>
        )}
        <div className="relative">
          <button type="button" aria-label={`Alerts, ${unread} new`} aria-expanded={open === "bell"} onClick={() => show(open === "bell" ? null : "bell")} className="relative grid h-7 w-7 place-items-center rounded-[6px] text-white/60 hover:bg-white/10 hover:text-white">
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#8b8bff]" />}
          </button>
          {open === "bell" && (
            <Pop className="left-0 top-9 w-[min(21rem,calc(100vw-2rem))] lg:left-full lg:top-0 lg:ml-3">
              <p className="flex h-10 items-center justify-between border-b border-[#f0f0f2] px-3.5 text-[13px] font-semibold">Alerts <button type="button" className="text-[12px] font-medium text-[#4f46e5]">Mark all read</button></p>
              <ul className="p-1">
                {ALERTS.map((a) => {
                  const I = { order: ShoppingBag, enquiry: MessageSquare, stock: TriangleAlert, support: LifeBuoy }[a.kind] ?? Bell;
                  return (
                    <li key={a.text}>
                      <Link href={to(a.href)} onClick={() => show(null)} className="flex gap-2.5 rounded-[6px] px-2.5 py-2 hover:bg-[#f4f4f5]">
                        <I className={`mt-0.5 h-4 w-4 shrink-0 ${a.unread ? "text-[#5b5bf0]" : "text-[#a1a1aa]"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] ${a.unread ? "font-medium" : "text-[#52525b]"}`}>{a.text}</span>
                          <span className="block text-[12px] text-[#71717a]">{a.sub} · {a.when}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Pop>
          )}
        </div>
        <button type="button" onClick={fold} aria-label={narrow ? "Open the menu out" : "Fold the menu"} title={narrow ? "Open the menu out" : "Fold the menu"} className="hidden h-7 w-7 place-items-center rounded-[6px] text-white/45 hover:bg-white/10 hover:text-white lg:grid">
          {narrow ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Search and Create, side by side. */}
      <div className={`flex shrink-0 gap-1.5 pb-2 ${narrow ? "flex-col items-center px-2" : "px-3"}`}>
        <button type="button" onClick={() => show("palette")} title="Search and commands (⌘K)" className={`flex h-8 items-center gap-2 rounded-[6px] bg-white/[0.07] text-[13px] text-white/50 hover:bg-white/[0.11] ${narrow ? "w-8 justify-center" : "min-w-0 flex-1 px-2.5"}`}>
          <Search className="h-3.5 w-3.5 shrink-0" />
          {!narrow && <><span className="flex-1 truncate text-left">Search</span><kbd className="text-[11px] text-white/35">⌘K</kbd></>}
        </button>
        <div className="relative">
          <button type="button" aria-label="Create" title="Create (C)" aria-expanded={open === "create"} onClick={() => show(open === "create" ? null : "create")} className="grid h-8 w-8 place-items-center rounded-[6px] bg-white text-[#18181b] hover:bg-white/85">
            <Plus className="h-4 w-4" />
          </button>
          {open === "create" && (
            <Pop className="right-0 top-10 w-56 lg:left-full lg:right-auto lg:top-0 lg:ml-3">
              <p className="px-3 pb-1 pt-2.5 text-[11.5px] font-medium text-[#71717a]">Create</p>
              <div className="px-1 pb-1">
                {CREATE.map(([l, h, I]) => (
                  <Link key={l} href={h} onClick={() => show(null)} className="flex h-8 items-center gap-2.5 rounded-[6px] px-2.5 text-[13px] hover:bg-[#f4f4f5]">
                    <I className="h-4 w-4 text-[#71717a]" /> {l}
                  </Link>
                ))}
              </div>
              <p className="border-t border-[#f0f0f2] px-3 py-2 text-[11.5px] text-[#a1a1aa]">Press C anywhere</p>
            </Pop>
          )}
        </div>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-2 py-1 [scrollbar-width:thin]">
        {RAIL.map((g) => {
          const Icon = ICONS[g.icon];
          const onIt = path === g.href;
          const inside = g.id === "home" ? onIt : onIt || path.startsWith(`${g.href}/`);
          return (
            <li key={g.id}>
              <Link
                href={g.href}
                onClick={() => show(null)}
                title={narrow ? g.label : undefined}
                aria-current={onIt ? "page" : undefined}
                className={`relative flex h-[30px] items-center gap-2.5 rounded-[6px] text-[13px] transition-colors ${narrow ? "justify-center" : "px-2"} ${onIt ? "bg-white/[0.1] font-medium text-white" : inside ? "font-medium text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"}`}
              >
                {onIt && !narrow && <span aria-hidden className="absolute -left-2 top-[7px] h-4 w-[2px] rounded-r bg-[#8b8bff]" />}
                <Icon className="h-4 w-4 shrink-0" />
                {!narrow && <span className="flex-1 truncate">{g.label}</span>}
                {g.badge ? <span className={`rounded-[4px] px-1 text-[11px] font-semibold tabular-nums text-[#c7c9ff] ${narrow ? "absolute right-0.5 top-0" : "bg-[#5b5bf0]/25"}`}>{g.badge}</span> : null}
              </Link>
              {!narrow && inside && g.items && (
                <ul className="mb-1 ml-[17px] mt-px flex flex-col gap-px border-l border-white/[0.09] pl-2">
                  {g.items.map((it) => {
                    const on = path === it.href || path.startsWith(`${it.href}/`);
                    return (
                      <li key={it.href}>
                        <Link href={it.href} onClick={() => show(null)} aria-current={on ? "page" : undefined} className={`flex h-[26px] items-center justify-between rounded-[6px] px-2 text-[12.5px] ${on ? "bg-white/[0.1] font-medium text-white" : "text-white/50 hover:text-white"}`}>
                          {it.label}
                          {it.label === "Enquiries" && <span className="text-[11px] tabular-nums text-white/45">2</span>}
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
        {[
          { href: `${A}/settings`, label: "Settings", icon: ICONS.settings, on: inSettings },
          { href: `${A}/bin`, label: "Bin", icon: Trash2, on: path.startsWith(`${A}/bin`) },
          { href: "/support", label: "Help", icon: HelpCircle, on: false },
        ].map(({ href, label, icon: Icon, on }) => (
          <Link key={href} href={href} onClick={() => show(null)} title={narrow ? label : undefined} aria-current={on ? "page" : undefined} className={`flex h-[30px] items-center gap-2.5 rounded-[6px] text-[13px] ${narrow ? "justify-center" : "px-2"} ${on ? "bg-white/[0.1] font-medium text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"}`}>
            <Icon className="h-4 w-4 shrink-0" /> {!narrow && label}
          </Link>
        ))}
      </div>

      {/* The store, and you in it: the one profile in the admin. */}
      <div className="relative shrink-0 border-t border-white/[0.08] p-2">
        <button type="button" aria-label="Store and account" aria-expanded={open === "me"} onClick={() => show(open === "me" ? null : "me")} title={narrow ? `${SHOP.name} · ${SHOP.email}` : undefined} className={`flex w-full items-center gap-2.5 rounded-[6px] p-1.5 text-left hover:bg-white/[0.06] ${open === "me" ? "bg-white/[0.08]" : ""} ${narrow ? "justify-center" : ""}`}>
          <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-[#b8efd6] text-[11px] font-bold text-[#0a0a0a]">
            {SHOP.initials}
            <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#22c55e] ring-2 ring-[#111113]" />
          </span>
          {!narrow && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-semibold">{SHOP.name}</span>
                <span className="block truncate text-[11.5px] text-white/45">{SHOP.email}</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-white/35" />
            </>
          )}
        </button>
        {open === "me" && (
          <Pop className={`bottom-full mb-1 w-64 ${narrow ? "left-full mb-0 ml-2 bottom-2" : "left-2"}`}>
            <div className="border-b border-[#f0f0f2] px-3.5 py-3">
              <p className="truncate text-[13px] font-semibold">{SHOP.name}</p>
              <p className="truncate text-[12px] text-[#71717a]">{SHOP.email}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#15803d]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" /> Open · 23 days of trial left</p>
            </div>
            <div className="p-1">
              <Link href={`${A}/account`} onClick={() => show(null)} className={MENU}><UserRound /> Your account</Link>
              <Link href={`${A}/settings/plan`} onClick={() => show(null)} className={MENU}><CreditCard /> Plan and billing</Link>
              <a href="#" onClick={() => show(null)} className={MENU}><ExternalLink /> Preview store</a>
              <button type="button" onClick={() => { show(null); toast("Your stores would open here"); }} className={MENU}><Repeat /> Switch store</button>
            </div>
            <div className="border-t border-[#f0f0f2] p-1">
              <button type="button" onClick={() => { show(null); toast("Signed out (preview)"); }} className={`${MENU} text-[#b91c1c] hover:bg-[#fef2f2]`}><LogOut /> Sign out</button>
            </div>
          </Pop>
        )}
      </div>
    </nav>
  );

  return (
    <ToastCtx.Provider value={toast}>
      <div className={`na3 min-h-dvh bg-[#f7f7f8] font-sans text-[#18181b] antialiased ${folded ? "lg:pl-14" : "lg:pl-52"}`}>
        <aside className={`fixed inset-y-0 left-0 z-40 hidden bg-[#111113] lg:block ${folded ? "w-14" : "w-52"}`}>{rail(folded)}</aside>

        {/* Phones: a slim bar and a drawer. */}
        <div className="sticky top-0 z-30 flex h-12 items-center gap-2 bg-[#111113] px-3 text-white lg:hidden">
          <button type="button" aria-label={open === "drawer" ? "Close menu" : "Open menu"} onClick={() => show(open === "drawer" ? null : "drawer")} className="grid h-8 w-8 place-items-center rounded-[6px] hover:bg-white/10">
            {open === "drawer" ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <SynoraAppMark className="mr-auto h-[15px]" />
          <button type="button" aria-label="Search" onClick={() => show("palette")} className="grid h-8 w-8 place-items-center rounded-[6px] hover:bg-white/10"><Search className="h-4 w-4" /></button>
        </div>
        {open === "drawer" && <div className="fixed inset-x-0 bottom-0 top-12 z-40 bg-[#111113] lg:hidden">{rail(false)}</div>}

        <main className="min-w-0">{children}</main>

        {(open === "create" || open === "bell" || open === "me") && <div aria-hidden className="fixed inset-0 z-30" onMouseDown={() => show(null)} />}
        {open === "palette" && <Palette onClose={() => show(null)} />}
        {open === "keys" && <Shortcuts onClose={() => show(null)} />}

        <div aria-live="polite" className="fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 lg:ml-[6.5rem]">
          {toasts.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-[8px] bg-[#18181b] py-2 pl-3.5 pr-1.5 text-[13px] text-white shadow-[0_14px_40px_-14px_rgba(0,0,0,0.6)]">
              {t.text}
              {t.undo && (
                <button type="button" onClick={() => { t.undo?.(); setToasts((x) => x.filter((y) => y.id !== t.id)); }} className="rounded-[6px] px-2 py-1 font-medium text-[#c7c9ff] hover:bg-white/10">Undo</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" aria-label="Keyboard shortcuts" title="Shortcuts (?)" onClick={() => show("keys")} className="fixed bottom-4 right-4 z-20 hidden h-8 w-8 place-items-center rounded-[6px] bg-white text-[#71717a] ring-1 ring-[#e4e4e7] hover:text-[#18181b] lg:grid">
          <Keyboard className="h-4 w-4" />
        </button>
      </div>
    </ToastCtx.Provider>
  );
}

const MENU = "flex h-8 w-full items-center gap-2.5 rounded-[6px] px-2.5 text-left text-[13px] text-[#27272a] hover:bg-[#f4f4f5] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#71717a]";

function Pop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`absolute z-50 overflow-hidden rounded-[8px] bg-white text-[#18181b] shadow-[0_20px_50px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/10 ${className}`}>{children}</div>;
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = words.length
      ? COMMANDS.filter((c) => words.every((w) => `${c.label} ${c.hint ?? ""} ${c.group}`.toLowerCase().includes(w)))
      : COMMANDS.filter((c) => c.group === "Do").slice(0, 5).concat(COMMANDS.filter((c) => c.group === "Go to" && c.keys));
    return list.slice(0, 12);
  }, [q]);
  const go = (c?: Command) => {
    if (!c) return;
    onClose();
    router.push(c.href);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/25 px-3 pt-[12vh]" onMouseDown={onClose}>
      <div role="dialog" aria-label="Search and commands" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-[8px] bg-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/10">
        <div className="flex items-center gap-2.5 border-b border-[#f0f0f2] px-3.5">
          <Search className="h-4 w-4 text-[#a1a1aa]" />
          <input
            ref={input}
            value={q}
            onChange={(e) => { setQ(e.target.value); setAt(0); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") { e.preventDefault(); setAt((i) => Math.min(i + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setAt((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter") go(results[at]);
            }}
            placeholder="Find an order, product, setting, or what to do"
            className="h-11 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a1a1aa]"
          />
          <kbd className="rounded-[4px] bg-[#f4f4f5] px-1.5 py-0.5 text-[11px] text-[#71717a]">Esc</kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto p-1">
          {results.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#71717a]">Nothing matches &ldquo;{q}&rdquo;.</li>}
          {results.map((c, i) => {
            const head = i === 0 || results[i - 1].group !== c.group ? c.group : null;
            return (
              <li key={`${c.group}${c.label}${c.href}`}>
                {head && <p className="px-2.5 pb-0.5 pt-2 text-[11.5px] font-medium text-[#a1a1aa]">{head}</p>}
                <button type="button" onMouseMove={() => setAt(i)} onClick={() => go(c)} className={`flex h-9 w-full items-center gap-2.5 rounded-[6px] px-2.5 text-left ${i === at ? "bg-[#eef0ff]" : ""}`}>
                  {c.group === "Do" ? <Sparkles className="h-3.5 w-3.5 text-[#5b5bf0]" /> : <CornerDownLeft className="h-3.5 w-3.5 text-[#a1a1aa]" />}
                  <span className="min-w-0 flex-1 truncate text-[13px]">{c.label}{c.hint && <span className="text-[#a1a1aa]"> · {c.hint}</span>}</span>
                  {c.keys && <kbd className="rounded-[4px] bg-[#f4f4f5] px-1.5 py-0.5 text-[11px] text-[#71717a]">{c.keys}</kbd>}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="flex justify-between border-t border-[#f0f0f2] px-3.5 py-2 text-[11.5px] text-[#a1a1aa]">
          <span>↑ ↓ move · Enter open · Esc close</span>
          <span>{STORE_SETTINGS.length} settings, every screen and record</span>
        </p>
      </div>
    </div>
  );
}

function Shortcuts({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ["⌘ K  or  /", "Search and commands"], ["C", "Create something"], ["G H", "Home"], ["G O", "Orders"], ["G P", "Products"], ["G C", "Customers"],
    ["G D", "Discounts"], ["G F", "Content and files"], ["G A", "Analytics"], ["G T", "Online store"], ["G S", "Settings"], ["J / K", "Next and previous order"], ["?", "This list"],
  ];
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/25 px-3" onMouseDown={onClose}>
      <div role="dialog" aria-label="Keyboard shortcuts" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-[8px] bg-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/10">
        <p className="flex h-11 items-center gap-2 border-b border-[#f0f0f2] px-4 text-[13px] font-semibold"><Keyboard className="h-4 w-4" /> Keyboard shortcuts</p>
        <ul className="px-4 py-1">
          {rows.map(([k, l]) => (
            <li key={k} className="flex h-8 items-center justify-between text-[13px]">
              {l}
              <kbd className="rounded-[4px] bg-[#f4f4f5] px-1.5 py-0.5 font-sans text-[11.5px] text-[#52525b]">{k}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
