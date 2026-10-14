"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowRight, Crown, LayoutDashboard, LifeBuoy, LogOut, Loader2, Sparkles, Store, Ticket } from "lucide-react";
import { AccountAvatar } from "@/components/platform/account-avatar";
import { initialsOf } from "@/lib/initials";

/**
 * The right end of the light header (14 October): "Log in" and "Start free"
 * for a visitor, the person's avatar for someone signed in.
 *
 * Asked from the browser (/api/auth/session) rather than by the page, so the
 * front page stays the same cached page for everybody and still never reads
 * the session itself (scripts/check-platform.ts). Until the answer comes the
 * buttons hold their place invisibly, so nothing jumps.
 *
 * The avatar opens a card: who you are, where you work (your dashboard, or the
 * Synora console for a master admin, whose avatar is gold), help, and sign
 * out, which leaves you on the page you were on.
 */
type Me = { name: string; email: string; master: string | null; shops: { subdomain: string; role: string }[] };

export function AccountSlot({ signup, login }: { signup: string; login: string }) {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!live) return;
        const u = s?.user;
        // A shopper's session (customerId) is for one shop, not for us.
        setMe(u?.id && !u.customerId ? { name: u.name ?? "", email: u.email ?? "", master: u.master ?? null, shops: u.shops ?? [] } : null);
      })
      .catch(() => live && setMe(null));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!me) {
    return (
      <nav className={`flex shrink-0 items-center gap-1 text-sm transition-opacity duration-200 ${me === undefined ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <a href={login} className="rounded-full px-3 py-2 font-medium text-[#0d0d50]/70 transition-colors hover:bg-[#0d0d50]/[0.05] hover:text-[#0d0d50]">
          Log in
        </a>
        <a href={signup} className="group inline-flex items-center rounded-full bg-[#6666ff] py-2 pl-4 pr-4 font-semibold text-white shadow-[0_6px_20px_-6px_rgba(102,102,255,0.7)] transition-[padding] duration-300 hover:pr-3">
          Start free
          <ArrowRight className="ml-0 h-4 w-0 opacity-0 transition-all duration-300 group-hover:ml-1.5 group-hover:w-4 group-hover:opacity-100" />
        </a>
      </nav>
    );
  }

  const master = me.master !== null;
  const initials = (master && me.master) || initialsOf(me.name, me.email);
  const home = master ? "/synora" : me.shops.length === 1 ? "/admin" : "/merchant/stores";
  const owner = me.shops.find((s) => s.role === "OWNER");

  return (
    <div ref={box} className="relative flex shrink-0 items-center gap-1.5">
      {/* The way in, always in sight: signing in leaves you where you were. */}
      <Link
        href={home}
        className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13.5px] font-semibold transition-colors ${
          master ? "bg-[#0d0d50] text-[#f2cf72] hover:bg-[#1a1a6e]" : "bg-[#6666ff] text-white shadow-[0_6px_20px_-6px_rgba(102,102,255,0.7)] hover:bg-[#5a5af5]"
        }`}
      >
        {master ? <Crown className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
        <span className="sm:hidden">{master ? "Console" : "Dashboard"}</span>
        <span className="hidden sm:inline">{master ? "Open console" : me.shops.length === 0 ? "Create your store" : "Go to dashboard"}</span>
      </Link>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${me.name || me.email}`}
        onClick={() => setOpen(!open)}
        className={`rounded-full p-0.5 transition-shadow ${open ? "ring-2 ring-[#6666ff]/40" : "hover:ring-2 hover:ring-[#0d0d50]/10"}`}
      >
        <AccountAvatar initials={initials} master={master} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+10px)] w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem] bg-white shadow-[0_30px_80px_-24px_rgba(13,13,80,0.45)] ring-1 ring-[#0d0d50]/10">
          {/* Who. */}
          <div className={`flex items-center gap-3.5 p-4 ${master ? "bg-[linear-gradient(140deg,#fff9e6_0%,#fdf0c8_55%,#f7e2a4_100%)]" : "bg-[linear-gradient(140deg,#f3f3ff_0%,#eef8ff_60%,#effcf6_100%)]"}`}>
            <AccountAvatar initials={initials} master={master} size="md" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-[#0d0d50]">{me.name || me.email.split("@")[0]}</p>
              <p className="truncate text-[12.5px] text-[#0d0d50]/55">{me.email}</p>
              {master ? (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#0d0d50] px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#f2cf72]">
                  <Crown className="h-3 w-3" /> Synora master admin
                </span>
              ) : (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-[#4b4bea]">
                  <Store className="h-3 w-3" />
                  {me.shops.length === 0 ? "No store yet" : me.shops.length === 1 ? (owner ? "Store owner" : "Store team") : `${me.shops.length} stores`}
                </span>
              )}
            </div>
          </div>

          {/* Where. */}
          <div className="p-2">
            <Link role="menuitem" href={home} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#0d0d50] hover:bg-[#f2f2ff]">
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${master ? "bg-[#0d0d50] text-[#f2cf72]" : "bg-[#6666ff] text-white"}`}>
                <LayoutDashboard className="h-4 w-4" />
              </span>
              <span className="flex-1">{master ? "Open the console" : me.shops.length === 0 ? "Create your store" : "Open your dashboard"}</span>
              <ArrowRight className="h-4 w-4 text-[#0d0d50]/30 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {master ? (
              <>
                <Link role="menuitem" href="/synora/tickets" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#0d0d50]/80 hover:bg-[#f2f2ff]">
                  <Ticket className="h-4 w-4 text-[#0d0d50]/45" /> Tickets and suggestions
                </Link>
                <Link role="menuitem" href="/synora/patch-notes" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#0d0d50]/80 hover:bg-[#f2f2ff]">
                  <Sparkles className="h-4 w-4 text-[#0d0d50]/45" /> Patch notes
                </Link>
              </>
            ) : (
              <Link role="menuitem" href="/help#history" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#0d0d50]/80 hover:bg-[#f2f2ff]">
                <LifeBuoy className="h-4 w-4 text-[#0d0d50]/45" /> Help and your tickets
              </Link>
            )}
          </div>

          <div className="border-t border-[#0d0d50]/[0.07] p-2">
            <button
              role="menuitem"
              type="button"
              disabled={leaving}
              onClick={() => {
                setLeaving(true);
                signOut({ redirectTo: window.location.pathname });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#0d0d50]/70 hover:bg-[#fff4ee] hover:text-[#c2410c]"
            >
              {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
