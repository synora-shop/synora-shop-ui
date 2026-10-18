"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell, ChevronsUpDown, CornerDownLeft, CreditCard, ExternalLink, HelpCircle, Keyboard, LifeBuoy, LogOut, Menu, MessageSquare,
  Package, PanelLeftClose, PanelLeftOpen, Plus, Repeat, Search, ShoppingBag, Sparkles, Trash2, TriangleAlert, UserRound, X,
} from "lucide-react";
import { ALERTS, SHOP } from "@/lib/new-admin/sample";
import { ICONS, TONE } from "@/components/new-admin/ui";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { ToastCtx } from "@/components/next-admin/bits";
import { A, COMMANDS, GOTO, RAIL, STORE_SETTINGS, to, type Command } from "@/components/next-admin/nav";

/**
 * The third design's frame (/next-admin, 18 October).
 *
 * A black rail, 216px (the preview's was 248): the Synora mark, then search and Create side by
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
          <button type="button" aria-label={`Alerts, ${unread} new`} aria-expanded={open === "bell"} onClick={() => show(open === "bell" ? null : "bell")} className="relative grid h-7 w-7 place-items-center rounded-[10px] text-white/60 hover:bg-white/10 hover:text-white">
            <Bell className="h-4 w-4" />
            {unread > 0 && <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#b7b9ff]" />}
          </button>
          {open === "bell" && (
            <Pop className="left-0 top-9 w-[min(21rem,calc(100vw-2rem))] lg:left-full lg:top-0 lg:ml-3">
              <p className="flex h-10 items-center justify-between border-b border-[#f1f1f1] px-3.5 text-[13px] font-semibold">Alerts <button type="button" className="text-[12px] font-medium text-[#4b4bea]">Mark all read</button></p>
              <ul className="p-1">
                {ALERTS.map((a) => {
                  const I = { order: ShoppingBag, enquiry: MessageSquare, stock: TriangleAlert, support: LifeBuoy }[a.kind] ?? Bell;
                  return (
                    <li key={a.text}>
                      <Link href={to(a.href)} onClick={() => show(null)} className="flex gap-2.5 rounded-[10px] px-2.5 py-2 hover:bg-[#f3f3f3]">
                        <I className={`mt-0.5 h-4 w-4 shrink-0 ${a.unread ? "text-[#6666ff]" : "text-[#a3a3a3]"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] ${a.unread ? "font-medium" : "text-[#555555]"}`}>{a.text}</span>
                          <span className="block text-[12px] text-[#737373]">{a.sub} · {a.when}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Pop>
          )}
        </div>
        <button type="button" onClick={fold} aria-label={narrow ? "Open the menu out" : "Fold the menu"} title={narrow ? "Open the menu out" : "Fold the menu"} className="hidden h-7 w-7 place-items-center rounded-[10px] text-white/45 hover:bg-white/10 hover:text-white lg:grid">
          {narrow ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Search and Create, side by side. */}
      <div className={`flex shrink-0 gap-1.5 pb-2 ${narrow ? "flex-col items-center px-2" : "px-3"}`}>
        <button type="button" onClick={() => show("palette")} title="Search and commands (⌘K)" className={`flex h-8 items-center gap-2 rounded-[10px] bg-white/[0.07] text-[13px] text-white/50 hover:bg-white/[0.11] ${narrow ? "w-8 justify-center" : "min-w-0 flex-1 px-2.5"}`}>
          <Search className="h-3.5 w-3.5 shrink-0" />
          {!narrow && <><span className="flex-1 truncate text-left">Search</span><kbd className="text-[11px] text-white/35">⌘K</kbd></>}
        </button>
        <div className="relative">
          <button type="button" aria-label="Create" title="Create (C)" aria-expanded={open === "create"} onClick={() => show(open === "create" ? null : "create")} className="grid h-8 w-8 place-items-center rounded-[10px] bg-white text-[#0a0a0a] hover:bg-white/85">
            <Plus className="h-4 w-4" />
          </button>
          {open === "create" && (
            <Pop className="right-0 top-10 w-56 lg:left-full lg:right-auto lg:top-0 lg:ml-3">
              <p className="px-3 pb-1 pt-2.5 text-[11.5px] font-medium text-[#737373]">Create</p>
              <div className="px-1 pb-1">
                {CREATE.map(([l, h, I]) => (
                  <Link key={l} href={h} onClick={() => show(null)} className="flex h-8 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] hover:bg-[#f3f3f3]">
                    <I className="h-4 w-4 text-[#737373]" /> {l}
                  </Link>
                ))}
              </div>
              <p className="border-t border-[#f1f1f1] px-3 py-2 text-[11.5px] text-[#a3a3a3]">Press C anywhere</p>
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
                className={`relative flex h-8 items-center gap-2.5 rounded-[10px] text-[13.5px] font-medium transition-colors ${narrow ? "justify-center" : "px-2.5"} ${onIt ? "bg-white/[0.12] text-white" : inside ? "bg-white/[0.05] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"}`}
              >
                {inside && !narrow && <span aria-hidden className={`absolute -left-2 top-1.5 h-5 w-[3px] rounded-r-full ${TONE[g.tone].dot}`} />}
                <Icon className="h-4 w-4 shrink-0" />
                {!narrow && <span className="flex-1 truncate">{g.label}</span>}
                {g.badge ? <span className={`rounded-full bg-[#6666ff] px-1.5 text-[11px] font-bold tabular-nums text-white ${narrow ? "absolute -right-0.5 -top-0.5" : ""}`}>{g.badge}</span> : null}
                {!narrow && g.tone !== "ink" && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${TONE[g.tone].dot} ${inside ? "" : "opacity-40"}`} />}
              </Link>
              {!narrow && inside && g.items && (
                <ul className="mb-1 ml-[17px] mt-px flex flex-col gap-px border-l border-white/[0.09] pl-2">
                  {g.items.map((it) => {
                    const on = path === it.href || path.startsWith(`${it.href}/`);
                    return (
                      <li key={it.href}>
                        <Link href={it.href} onClick={() => show(null)} aria-current={on ? "page" : undefined} className={`flex h-7 items-center justify-between rounded-[8px] px-2.5 text-[13px] ${on ? "bg-white/[0.12] font-semibold text-white" : "text-white/45 hover:text-white"}`}>
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
          <Link key={href} href={href} onClick={() => show(null)} title={narrow ? label : undefined} aria-current={on ? "page" : undefined} className={`flex h-8 items-center gap-2.5 rounded-[10px] text-[13.5px] font-medium ${narrow ? "justify-center" : "px-2.5"} ${on ? "bg-white/[0.12] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"}`}>
            <Icon className="h-4 w-4 shrink-0" /> {!narrow && label}
          </Link>
        ))}
      </div>

      {/* The store, and you in it: the one profile in the admin. */}
      <div className="relative shrink-0 border-t border-white/[0.08] p-2">
        <button type="button" aria-label="Store and account" aria-expanded={open === "me"} onClick={() => show(open === "me" ? null : "me")} title={narrow ? `${SHOP.name} · ${SHOP.email}` : undefined} className={`flex w-full items-center gap-2.5 rounded-[10px] p-1.5 text-left hover:bg-white/[0.06] ${open === "me" ? "bg-white/[0.08]" : ""} ${narrow ? "justify-center" : ""}`}>
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#b8efd6] text-[11px] font-bold text-[#0a0a0a]">
            {SHOP.initials}
            <span aria-hidden className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#22c55e] ring-2 ring-[#0a0a0a]" />
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
            <div className="border-b border-[#f1f1f1] px-3.5 py-3">
              <p className="truncate text-[13px] font-semibold">{SHOP.name}</p>
              <p className="truncate text-[12px] text-[#737373]">{SHOP.email}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#15803d]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" /> Open · 23 days of trial left</p>
            </div>
            <div className="p-1">
              <Link href={`${A}/account`} onClick={() => show(null)} className={MENU}><UserRound /> Your account</Link>
              <Link href={`${A}/settings/plan`} onClick={() => show(null)} className={MENU}><CreditCard /> Plan and billing</Link>
              <a href="#" onClick={() => show(null)} className={MENU}><ExternalLink /> Preview store</a>
              <button type="button" onClick={() => { show(null); toast("Your stores would open here"); }} className={MENU}><Repeat /> Switch store</button>
            </div>
            <div className="border-t border-[#f1f1f1] p-1">
              <button type="button" onClick={() => { show(null); toast("Signed out (preview)"); }} className={`${MENU} text-[#b91c1c] hover:bg-[#fef2f2]`}><LogOut /> Sign out</button>
            </div>
          </Pop>
        )}
      </div>
    </nav>
  );

  return (
    <ToastCtx.Provider value={toast}>
      <div className={`na3 min-h-dvh bg-[#0a0a0a] font-sans text-[#0a0a0a] antialiased ${folded ? "lg:pl-16" : "lg:pl-[13.5rem]"}`}>
        <aside className={`fixed inset-y-0 left-0 z-40 hidden bg-[#0a0a0a] lg:block ${folded ? "w-16" : "w-[13.5rem]"}`}>{rail(folded)}</aside>

        {/* Phones: a slim bar and a drawer. */}
        <div className="sticky top-0 z-30 flex h-12 items-center gap-2 bg-[#0a0a0a] px-3 text-white lg:hidden">
          <button type="button" aria-label={open === "drawer" ? "Close menu" : "Open menu"} onClick={() => show(open === "drawer" ? null : "drawer")} className="grid h-8 w-8 place-items-center rounded-[10px] hover:bg-white/10">
            {open === "drawer" ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <SynoraAppMark className="mr-auto h-[15px]" />
          <button type="button" aria-label="Search" onClick={() => show("palette")} className="grid h-8 w-8 place-items-center rounded-[10px] hover:bg-white/10"><Search className="h-4 w-4" /></button>
        </div>
        {open === "drawer" && <div className="fixed inset-x-0 bottom-0 top-12 z-40 bg-[#0a0a0a] lg:hidden">{rail(false)}</div>}

        {/* The sheet: the preview's rounded canvas, set into the black. */}
        <div className="min-w-0 lg:py-2 lg:pr-2">
          <main className="min-h-[calc(100dvh-3rem)] overflow-clip bg-[#f4f4f4] lg:min-h-[calc(100dvh-1rem)] lg:rounded-[20px]">{children}</main>
        </div>

        {(open === "create" || open === "bell" || open === "me") && <div aria-hidden className="fixed inset-0 z-30" onMouseDown={() => show(null)} />}
        {open === "palette" && <Palette onClose={() => show(null)} />}
        {open === "keys" && <Shortcuts onClose={() => show(null)} />}

        <div aria-live="polite" className="fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 lg:ml-[6.75rem]">
          {toasts.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-[16px] bg-[#0a0a0a] py-2 pl-3.5 pr-1.5 text-[13px] text-white shadow-[0_14px_40px_-14px_rgba(0,0,0,0.6)]">
              {t.text}
              {t.undo && (
                <button type="button" onClick={() => { t.undo?.(); setToasts((x) => x.filter((y) => y.id !== t.id)); }} className="rounded-[10px] px-2 py-1 font-medium text-[#c9c9ff] hover:bg-white/10">Undo</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" aria-label="Keyboard shortcuts" title="Shortcuts (?)" onClick={() => show("keys")} className="fixed bottom-4 right-4 z-20 hidden h-8 w-8 place-items-center rounded-[10px] bg-white text-[#737373] ring-1 ring-[#ebebeb] hover:text-[#0a0a0a] lg:grid">
          <Keyboard className="h-4 w-4" />
        </button>
      </div>
    </ToastCtx.Provider>
  );
}

const MENU = "flex h-8 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] text-[#1f1f1f] hover:bg-[#f3f3f3] [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[#737373]";

function Pop({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`absolute z-50 overflow-hidden rounded-[16px] bg-white text-[#0a0a0a] shadow-[0_20px_50px_-18px_rgba(0,0,0,0.45)] ring-1 ring-black/10 ${className}`}>{children}</div>;
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
      <div role="dialog" aria-label="Search and commands" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-[16px] bg-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/10">
        <div className="flex items-center gap-2.5 border-b border-[#f1f1f1] px-3.5">
          <Search className="h-4 w-4 text-[#a3a3a3]" />
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
            className="h-11 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a3a3a3]"
          />
          <kbd className="rounded-[6px] bg-[#f3f3f3] px-1.5 py-0.5 text-[11px] text-[#737373]">Esc</kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto p-1">
          {results.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-[#737373]">Nothing matches &ldquo;{q}&rdquo;.</li>}
          {results.map((c, i) => {
            const head = i === 0 || results[i - 1].group !== c.group ? c.group : null;
            return (
              <li key={`${c.group}${c.label}${c.href}`}>
                {head && <p className="px-2.5 pb-0.5 pt-2 text-[11.5px] font-medium text-[#a3a3a3]">{head}</p>}
                <button type="button" onMouseMove={() => setAt(i)} onClick={() => go(c)} className={`flex h-9 w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left ${i === at ? "bg-[#ecebff]" : ""}`}>
                  {c.group === "Do" ? <Sparkles className="h-3.5 w-3.5 text-[#6666ff]" /> : <CornerDownLeft className="h-3.5 w-3.5 text-[#a3a3a3]" />}
                  <span className="min-w-0 flex-1 truncate text-[13px]">{c.label}{c.hint && <span className="text-[#a3a3a3]"> · {c.hint}</span>}</span>
                  {c.keys && <kbd className="rounded-[6px] bg-[#f3f3f3] px-1.5 py-0.5 text-[11px] text-[#737373]">{c.keys}</kbd>}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="flex justify-between border-t border-[#f1f1f1] px-3.5 py-2 text-[11.5px] text-[#a3a3a3]">
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
      <div role="dialog" aria-label="Keyboard shortcuts" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-[16px] bg-white shadow-[0_30px_80px_-24px_rgba(0,0,0,0.55)] ring-1 ring-black/10">
        <p className="flex h-11 items-center gap-2 border-b border-[#f1f1f1] px-4 text-[13px] font-semibold"><Keyboard className="h-4 w-4" /> Keyboard shortcuts</p>
        <ul className="px-4 py-1">
          {rows.map(([k, l]) => (
            <li key={k} className="flex h-8 items-center justify-between text-[13px]">
              {l}
              <kbd className="rounded-[6px] bg-[#f3f3f3] px-1.5 py-0.5 font-sans text-[11.5px] text-[#555555]">{k}</kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
