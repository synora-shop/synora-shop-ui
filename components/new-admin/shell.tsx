"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ChevronsUpDown, ExternalLink, Menu, Search, X } from "lucide-react";
import { NAV, SHOP } from "@/lib/new-admin/sample";
import { ICONS } from "@/components/new-admin/ui";

/**
 * The new admin's frame (preview, 15 October).
 *
 * A navy rail on the left, the store's work on a white sheet beside it. The
 * rail holds, top to bottom: which store this is, search, the ten sections in
 * Abdul's order, and Settings apart at the foot. A section with pages of its
 * own opens them beneath it when you are in it, so there is never a second
 * row of tabs to find. On a phone the rail slides in from the menu button.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const inGroup = (href: string, id: string) => (id === "home" ? path === href : path === href || path.startsWith(`${href}/`));

  const rail = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-4 px-3 py-4 text-white">
      {/* The store. */}
      <button type="button" className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-white/[0.06]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#b8efd6] text-[13px] font-bold text-[#0d0d50]">{SHOP.initials}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">{SHOP.name}</span>
          <span className="block truncate text-[11.5px] text-white/45">{SHOP.address}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-white/35" />
      </button>

      <div className="flex h-9 items-center gap-2 rounded-[10px] bg-white/[0.08] px-3 text-[13.5px] text-white/45">
        <Search className="h-4 w-4" />
        <span className="flex-1">Search</span>
        <kbd className="rounded bg-white/10 px-1.5 text-[11px] font-semibold text-white/50">⌘K</kbd>
      </div>

      <ul className="-mx-1 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        {NAV.map((g) => {
          const Icon = ICONS[g.icon];
          const here = inGroup(g.href, g.id);
          return (
            <li key={g.id}>
              <Link
                href={g.href}
                onClick={() => setOpen(false)}
                className={`flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[14px] font-medium transition-colors ${here ? "bg-white text-[#0d0d50]" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />
                <span className="flex-1">{g.label}</span>
                {g.badge ? <span className={`rounded-full px-1.5 text-[11.5px] font-bold ${here ? "bg-[#6666ff] text-white" : "bg-white/15 text-white"}`}>{g.badge}</span> : null}
              </Link>
              {here && g.items && (
                <ul className="mb-1 ml-[1.35rem] mt-1 flex flex-col border-l border-white/10 pl-3">
                  {g.items.map((it) => {
                    const on = path === it.href;
                    return (
                      <li key={it.href}>
                        <Link href={it.href} onClick={() => setOpen(false)} className={`block rounded-lg px-2.5 py-1.5 text-[13.5px] ${on ? "font-semibold text-white" : "text-white/55 hover:text-white"}`}>
                          {it.label}
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
        <Link
          href="/new-admin/settings/general"
          onClick={() => setOpen(false)}
          className={`flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[14px] font-medium ${path.startsWith("/new-admin/settings") ? "bg-white text-[#0d0d50]" : "text-white/70 hover:bg-white/[0.06] hover:text-white"}`}
        >
          <ICONS.settings className="h-[17px] w-[17px]" /> Settings
        </Link>
        <a href="#" className="flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[14px] font-medium text-white/70 hover:bg-white/[0.06] hover:text-white">
          <ExternalLink className="h-[17px] w-[17px]" /> View your store
        </a>
        <div className="mt-2 flex items-center gap-3 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#6666ff] text-[12px] font-semibold">AK</span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold">{SHOP.owner}</span>
            <span className="block truncate text-[11.5px] text-white/45">{SHOP.email}</span>
          </span>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#0d0d50] font-sans text-[#0d0d50] lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      {/* Phone: a bar with the menu. */}
      <div className="relative z-50 flex items-center justify-between px-4 py-3 text-white lg:hidden">
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#b8efd6] text-[12px] font-bold text-[#0d0d50]">{SHOP.initials}</span>
          <span className="text-[15px] font-semibold">{SHOP.name}</span>
        </span>
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-[#0d0d50] pt-16 lg:hidden">{rail}</div>}

      <aside className="sticky top-0 hidden h-dvh lg:block">{rail}</aside>

      <div className="min-w-0 lg:py-2 lg:pr-2">
        <main className="min-h-[calc(100dvh-4rem)] overflow-hidden bg-[#f5f5f9] lg:min-h-[calc(100dvh-1rem)] lg:rounded-[1.25rem]">
          <div className="flex items-center justify-between gap-3 border-b border-[#0d0d50]/[0.06] bg-white px-5 py-2 text-[12.5px] text-[#0d0d50]/55">
            <span>
              <b className="font-semibold text-[#0d0d50]">Preview</b> of the new admin, with sample data. Nothing here changes your store.
            </span>
            <Link href="/admin" className="whitespace-nowrap font-semibold text-[#4b4bea] hover:underline">
              Open the current admin
            </Link>
          </div>
          <div className="mx-auto flex max-w-[72rem] flex-col gap-5 p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
