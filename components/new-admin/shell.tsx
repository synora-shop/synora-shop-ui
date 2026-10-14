"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  Bell, ChevronsLeft, ChevronsRight, ChevronsUpDown, CornerDownLeft, ExternalLink, HelpCircle, Keyboard, LifeBuoy, Menu, MessageSquare,
  Package, Plus, Search, ShoppingBag, Sparkles, Trash2, TriangleAlert, X,
} from "lucide-react";
import { ALERTS, NAV, SETTINGS, SHOP } from "@/lib/new-admin/sample";
import { ICONS, TONE } from "@/components/new-admin/ui";
import { COMMANDS, GOTO, type Command } from "@/components/new-admin/commands";

/**
 * The new admin's frame (preview, 15 October).
 *
 * A black rail: the store and its status; search; every area with its pages
 * always open (each marked by its brand colour); Settings, Bin and help at the
 * foot. It folds to icons and remembers. On the white sheet, a top bar says
 * where you are and holds Create, the alerts and help.
 *
 * And the quality-of-life layer, all of it reachable by keyboard:
 *   ⌘K or /   the command bar: every screen, setting, action, order, product
 *   G then …  go somewhere (G O orders, G P products, G S settings…)
 *   C         the Create menu
 *   ?         this list
 *   toasts    every action says what it did, with Undo
 */

type Toast = { id: number; text: string; undo?: () => void };

/** Whether the rail is folded, remembered in this browser. */
function readFold() {
  try {
    return localStorage.getItem("na-folded") === "1";
  } catch {
    return false;
  }
}
function subscribeFold(on: () => void) {
  window.addEventListener("na-fold", on);
  window.addEventListener("storage", on);
  return () => {
    window.removeEventListener("na-fold", on);
    window.removeEventListener("storage", on);
  };
}
const ToastCtx = createContext<(text: string, undo?: () => void) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const folded = useSyncExternalStore(subscribeFold, readFold, () => false);
  // Each overlay remembers the page it was opened on, so moving to another
  // page closes it without an effect: it simply no longer matches.
  const [paletteAt, setPaletteAt] = useState<string | null>(null);
  const [keysAt, setKeysAt] = useState<string | null>(null);
  const [createAt, setCreateAt] = useState<string | null>(null);
  const [bellAt, setBellAt] = useState<string | null>(null);
  const palette = paletteAt === path;
  const keys = keysAt === path;
  const create = createAt === path;
  const bell = bellAt === path;
  const setPalette = (v: boolean) => setPaletteAt(v ? path : null);
  const setKeys = (v: boolean | ((x: boolean) => boolean)) => setKeysAt((typeof v === "function" ? v(keys) : v) ? path : null);
  const setCreate = (v: boolean | ((x: boolean) => boolean)) => setCreateAt((typeof v === "function" ? v(create) : v) ? path : null);
  const setBell = (v: boolean) => setBellAt(v ? path : null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fold = () => {
    try {
      localStorage.setItem("na-folded", readFold() ? "0" : "1");
    } catch {}
    window.dispatchEvent(new Event("na-fold"));
  };

  const toast = useCallback((text: string, undo?: () => void) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, undo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  // Keyboard: ⌘K and / for the bar, G-then-letter to go, C to create, ? for help.
  const pendingG = useRef(0);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName));
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPalette(true);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        setKeys(false);
        setCreate(false);
        setBell(false);
        return;
      }
      if (e.key === "?") return setKeys((v) => !v);
      if (Date.now() - pendingG.current < 900 && GOTO[e.key]) {
        pendingG.current = 0;
        router.push(GOTO[e.key]);
        return;
      }
      if (e.key === "g") pendingG.current = Date.now();
      if (e.key === "c") setCreate((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, path, keys, create]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeAll = () => {
    setMobile(false);
    setCreate(false);
    setBell(false);
  };

  const here = (() => {
    if (path.startsWith("/new-admin/settings")) return ["Settings"];
    if (path.startsWith("/new-admin/bin")) return ["Bin"];
    for (const g of NAV) {
      const sub = g.items?.find((i) => path === i.href || path.startsWith(`${i.href}/`));
      if (sub) return [g.label, sub.label];
      if (g.id === "home" ? path === g.href : path === g.href || path.startsWith(`${g.href}/`)) return path === g.href ? [g.label] : [g.label, "Detail"];
    }
    return ["Home"];
  })();

  const unread = ALERTS.filter((a) => a.unread).length;

  const rail = (narrow: boolean) => (
    <nav aria-label="Admin" onClick={(e) => (e.target as HTMLElement).closest("a") && closeAll()} className="flex h-full flex-col gap-3 px-3 py-4 text-white">
      <div className={`flex items-center gap-3 rounded-xl ${narrow ? "justify-center" : "px-2 py-1.5"}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#b8efd6] text-[13px] font-bold text-[#0a0a0a]">{SHOP.initials}</span>
        {!narrow && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{SHOP.name}</span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6fd6a8]" /> Open · trial, 23 days left
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 text-white/35" />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setPalette(true)}
        title="Search and commands (⌘K)"
        className={`flex h-9 items-center gap-2 rounded-[10px] bg-white/[0.08] text-[13.5px] text-white/50 transition-colors hover:bg-white/[0.12] ${narrow ? "justify-center" : "px-3"}`}
      >
        <Search className="h-4 w-4" />
        {!narrow && (
          <>
            <span className="flex-1 text-left">Search or do anything</span>
            <kbd className="rounded bg-white/10 px-1.5 text-[11px] font-semibold text-white/55">⌘K</kbd>
          </>
        )}
      </button>

      <ul className="-mx-1 flex flex-1 flex-col gap-1 overflow-y-auto px-1 [scrollbar-width:thin]">
        {NAV.map((g) => {
          const Icon = ICONS[g.icon];
          const groupOn = path === g.href;
          const inside = g.id === "home" ? path === g.href : path === g.href || path.startsWith(`${g.href}/`);
          return (
            <li key={g.id}>
              <Link
                href={g.href}
                title={narrow ? g.label : undefined}
                className={`relative flex h-9 items-center gap-3 rounded-[10px] text-[14px] font-medium transition-colors ${narrow ? "justify-center" : "px-2.5"} ${
                  groupOn ? "bg-white/[0.12] text-white" : inside ? "text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />
                {!narrow && <span className="flex-1">{g.label}</span>}
                {g.badge ? <span className={`rounded-full bg-[#6666ff] px-1.5 text-[11px] font-bold text-white ${narrow ? "absolute -right-0.5 -top-0.5" : ""}`}>{g.badge}</span> : null}
                {!narrow && g.tone !== "ink" && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${TONE[g.tone].dot} ${inside ? "" : "opacity-40"}`} />}
              </Link>
              {!narrow && g.items && (
                <ul className="ml-[1.3rem] flex flex-col border-l border-white/[0.08] pl-3">
                  {g.items.map((it) => {
                    const on = path === it.href || path.startsWith(`${it.href}/`);
                    return (
                      <li key={it.href}>
                        <Link href={it.href} className={`flex items-center justify-between rounded-lg px-2.5 py-[5px] text-[13px] transition-colors ${on ? "bg-white/[0.12] font-semibold text-white" : "text-white/45 hover:text-white"}`}>
                          {it.label}
                          {it.label === "Enquiries" && <span className="rounded-full bg-white/15 px-1.5 text-[10.5px] font-bold text-white">2</span>}
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

      <div className="flex flex-col gap-0.5 border-t border-white/10 pt-3">
        {[
          { href: "/new-admin/settings", label: "Settings", icon: ICONS.settings, on: path.startsWith("/new-admin/settings") },
          { href: "/new-admin/bin", label: "Bin", icon: Trash2, on: path.startsWith("/new-admin/bin") },
          { href: "/support", label: "Help and support", icon: LifeBuoy, on: false },
        ].map(({ href, label, icon: Icon, on }) => (
          <Link key={href} href={href} title={narrow ? label : undefined} className={`flex h-9 items-center gap-3 rounded-[10px] text-[14px] font-medium ${narrow ? "justify-center" : "px-2.5"} ${on ? "bg-white/[0.12] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"}`}>
            <Icon className="h-[17px] w-[17px]" /> {!narrow && label}
          </Link>
        ))}
        <button type="button" onClick={fold} className={`mt-1 hidden h-9 items-center gap-3 rounded-[10px] text-[13px] text-white/40 hover:text-white lg:flex ${narrow ? "justify-center" : "px-2.5"}`}>
          {narrow ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Fold the menu</>}
        </button>
      </div>
    </nav>
  );

  return (
    <ToastCtx.Provider value={toast}>
      <div className={`min-h-dvh bg-[#0a0a0a] font-sans text-[#0a0a0a] lg:grid ${folded ? "lg:grid-cols-[4.5rem_minmax(0,1fr)]" : "lg:grid-cols-[15.5rem_minmax(0,1fr)]"}`}>
        <div className="relative z-50 flex items-center justify-between px-4 py-3 text-white lg:hidden">
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#b8efd6] text-[12px] font-bold text-[#0a0a0a]">{SHOP.initials}</span>
            <span className="text-[15px] font-semibold">{SHOP.name}</span>
          </span>
          <span className="flex items-center gap-1">
            <button type="button" aria-label="Search" onClick={() => setPalette(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10"><Search className="h-5 w-5" /></button>
            <button type="button" aria-label={mobile ? "Close menu" : "Open menu"} onClick={() => setMobile(!mobile)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
              {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </span>
        </div>
        {mobile && <div className="fixed inset-0 z-40 overflow-y-auto bg-[#0a0a0a] pt-16 lg:hidden">{rail(false)}</div>}

        <aside className="sticky top-0 hidden h-dvh lg:block">{rail(folded)}</aside>

        <div className="min-w-0 lg:py-2 lg:pr-2">
          <main className="min-h-[calc(100dvh-4rem)] overflow-clip bg-[#f4f4f4] lg:min-h-[calc(100dvh-1rem)] lg:rounded-[1.25rem]">
            <div onClick={(e) => (e.target as HTMLElement).closest("a") && closeAll()} className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#0a0a0a]/[0.06] bg-white/90 px-4 py-2.5 backdrop-blur sm:px-6">
              <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-[13.5px]">
                {here.map((h, i) => (
                  <span key={h} className={i === here.length - 1 ? "font-semibold" : "text-[#0a0a0a]/45"}>
                    {i > 0 && <span className="mr-1.5 text-[#0a0a0a]/25">/</span>}
                    {h}
                  </span>
                ))}
                <span className="ml-2 hidden rounded-full bg-[#ecebff] px-2 py-0.5 text-[11px] font-semibold text-[#4b4bea] sm:inline">Preview · sample data</span>
              </p>
              <div className="relative">
                <button type="button" onClick={() => { setCreate(!create); setBell(false); }} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3 text-[13px] font-semibold text-white hover:bg-[#262626]">
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Create</span>
                </button>
                {create && (
                  <div className="absolute right-0 top-11 w-60 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
                    {([
                      ["Product", "/new-admin/products/zohra", Package],
                      ["Order by hand", "/new-admin/orders/drafts", ShoppingBag],
                      ["Discount code", "/new-admin/discounts", ICONS.discounts],
                      ["Collection", "/new-admin/products/collections", ICONS.boxes],
                      ["Page", "/new-admin/online-store/pages", ICONS.content],
                      ["Menu", "/new-admin/content/menus", ICONS.app],
                    ] as [string, string, typeof Package][]).map(([l, h, Ico]) => (
                      <Link key={l} href={h} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] hover:bg-[#f5f5f5]">
                        <Ico className="h-4 w-4 text-[#0a0a0a]/55" /> {l}
                      </Link>
                    ))}
                    <p className="border-t border-[#0a0a0a]/[0.06] px-3 py-2 text-[11.5px] text-[#0a0a0a]/45">Press C to open this anywhere</p>
                  </div>
                )}
              </div>
              <div className="relative">
                <button type="button" aria-label={`Alerts, ${unread} new`} onClick={() => { setBell(!bell); setCreate(false); }} className="relative grid h-9 w-9 place-items-center rounded-[10px] hover:bg-[#f0f0f0]">
                  <Bell className="h-[18px] w-[18px]" />
                  {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#6666ff] ring-2 ring-white" />}
                </button>
                {bell && (
                  <div className="absolute right-0 top-11 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-[#0a0a0a]/10">
                    <p className="flex items-center justify-between border-b border-[#0a0a0a]/[0.06] px-4 py-3 text-[14px] font-semibold">Alerts <span className="text-[12px] font-medium text-[#4b4bea]">Mark all read</span></p>
                    <ul>
                      {ALERTS.map((a) => {
                        const I = { order: ShoppingBag, enquiry: MessageSquare, stock: TriangleAlert, support: LifeBuoy }[a.kind] ?? Bell;
                        return (
                          <li key={a.text}>
                            <Link href={a.href} className="flex gap-3 px-4 py-3 hover:bg-[#fafafa]">
                              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.unread ? "bg-[#0a0a0a] text-white" : "bg-[#f0f0f0] text-[#0a0a0a]/55"}`}><I className="h-4 w-4" /></span>
                              <span className="min-w-0 flex-1">
                                <span className={`block text-[13.5px] ${a.unread ? "font-semibold" : ""}`}>{a.text}</span>
                                <span className="block text-[12px] text-[#0a0a0a]/50">{a.sub} · {a.when}</span>
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <button type="button" aria-label="Keyboard shortcuts" title="Shortcuts (?)" onClick={() => setKeys(true)} className="hidden h-9 w-9 place-items-center rounded-[10px] hover:bg-[#f0f0f0] sm:grid">
                <HelpCircle className="h-[18px] w-[18px]" />
              </button>
              <a href="#" title="View your store" className="hidden h-9 w-9 place-items-center rounded-[10px] hover:bg-[#f0f0f0] sm:grid">
                <ExternalLink className="h-[18px] w-[18px]" />
              </a>
            </div>
            <div className="mx-auto flex max-w-[72rem] flex-col gap-5 p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
        </div>

        {(create || bell) && <div aria-hidden className="fixed inset-0 z-20" onMouseDown={() => { setCreate(false); setBell(false); }} />}
        {palette && <Palette onClose={() => setPalette(false)} />}
        {keys && <Shortcuts onClose={() => setKeys(false)} />}

        <div aria-live="polite" className="fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2">
          {toasts.map((t) => (
            <div key={t.id} className="flex items-center gap-4 rounded-xl bg-[#0a0a0a] py-2.5 pl-4 pr-2 text-[13.5px] text-white shadow-[0_16px_40px_-14px_rgba(0,0,0,0.6)]">
              {t.text}
              {t.undo && (
                <button type="button" onClick={() => { t.undo?.(); setToasts((x) => x.filter((y) => y.id !== t.id)); }} className="rounded-lg px-2.5 py-1 font-semibold text-[#b7b9ff] hover:bg-white/10">
                  Undo
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </ToastCtx.Provider>
  );
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
      : COMMANDS.filter((c) => c.group === "Do").slice(0, 6).concat(COMMANDS.filter((c) => c.group === "Go to" && c.keys));
    return list.slice(0, 14);
  }, [q]);
  const go = (c?: Command) => {
    if (!c) return;
    onClose();
    router.push(c.href);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 px-3 pt-[12vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div role="dialog" aria-label="Search and commands" onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.6)] ring-1 ring-black/10">
        <div className="flex items-center gap-3 border-b border-[#0a0a0a]/[0.07] px-4">
          <Search className="h-5 w-5 text-[#0a0a0a]/45" />
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
            placeholder="Find an order, a product, a setting, or type what to do"
            className="h-14 min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[#0a0a0a]/35"
          />
          <kbd className="rounded-md bg-[#f0f0f0] px-1.5 py-0.5 text-[11px] font-semibold text-[#0a0a0a]/50">Esc</kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto p-1.5">
          {results.length === 0 && <li className="px-4 py-10 text-center text-[14px] text-[#0a0a0a]/50">Nothing matches &ldquo;{q}&rdquo;.</li>}
          {results.map((c, i) => {
            const head = i === 0 || results[i - 1].group !== c.group ? c.group : null;
            return (
              <li key={`${c.group}${c.label}${c.href}`}>
                {head && <p className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0a0a]/40">{head}</p>}
                <button type="button" onMouseMove={() => setAt(i)} onClick={() => go(c)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === at ? "bg-[#f2f2f2]" : ""}`}>
                  {c.group === "Do" ? <Sparkles className="h-4 w-4 text-[#6666ff]" /> : <CornerDownLeft className="h-4 w-4 text-[#0a0a0a]/30" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{c.label}</span>
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
          <span>{SETTINGS.length} settings, every screen and record</span>
        </p>
      </div>
    </div>
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
    ["G  F", "Content and files"],
    ["G  A", "Analytics"],
    ["G  T", "Online store and themes"],
    ["G  S", "Settings"],
    ["J  /  K", "Next and previous order, on an order"],
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
