"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ArrowRight, Crown, LayoutDashboard, LogOut, Loader2, Store } from "lucide-react";
import { AccountAvatar } from "@/components/platform/account-avatar";
import { MasterDashboardPill } from "@/components/platform/gold-glass";
import { useAccount, dashboardHref } from "@/components/platform/use-account";
import { initialsOf } from "@/lib/initials";

/**
 * The right end of the site header (14 October), as Abdul set it out:
 *
 *   a visitor        Log in · Sign up free
 *   signed in        Dashboard · the avatar (its menu: Dashboard, Log out)
 *   master admin     the same, plus the gold "Master dashboard" pill, and the
 *                    avatar in gold with their initials
 *
 * Signing in leaves you on the page you were on; this is how you go on to
 * your dashboard. Who is signed in comes from the browser (use-account.ts),
 * so the pages stay cached; until it is known the visitor's buttons hold
 * their place invisibly and nothing jumps.
 */
export function AccountSlot({ signup, login }: { signup: string; login: string }) {
  const me = useAccount();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);

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
        <a href={login} className="whitespace-nowrap rounded-full px-3 py-2 font-medium text-[#0d0d50]/70 transition-colors hover:bg-[#0d0d50]/[0.05] hover:text-[#0d0d50]">
          Log in
        </a>
        <a href={signup} className="group inline-flex items-center whitespace-nowrap rounded-full bg-[#6666ff] py-2 pl-4 pr-4 font-semibold text-white shadow-[0_6px_20px_-6px_rgba(102,102,255,0.7)] transition-[padding] duration-300 hover:pr-3">
          <span className="sm:hidden">Sign up</span>
          <span className="hidden sm:inline">Sign up free</span>
          <ArrowRight className="ml-0 h-4 w-0 opacity-0 transition-all duration-300 group-hover:ml-1.5 group-hover:w-4 group-hover:opacity-100" />
        </a>
      </nav>
    );
  }

  const master = me.master !== null;
  const initials = (master && me.master) || initialsOf(me.name, me.email);
  const dashboard = dashboardHref(me);

  return (
    <div ref={box} className="relative flex shrink-0 items-center gap-1.5">
      {master && (
        <span className="hidden md:inline-flex">
          <span className="inline-flex xl:hidden">
            <MasterDashboardPill compact />
          </span>
          <span className="hidden xl:inline-flex">
            <MasterDashboardPill />
          </span>
        </span>
      )}
      <Link
        href={dashboard}
        className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#6666ff] px-4 text-[13.5px] font-semibold text-white shadow-[0_6px_20px_-6px_rgba(102,102,255,0.7)] transition-colors hover:bg-[#5a5af5]"
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
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
        <div role="menu" className="absolute right-0 top-[calc(100%+12px)] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-[1.4rem] bg-white shadow-[0_30px_80px_-24px_rgba(13,13,80,0.45)] ring-1 ring-[#0d0d50]/10">
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
                  {me.shops.length === 0 ? "No store yet" : me.shops.length === 1 ? "1 store" : `${me.shops.length} stores`}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 p-2">
            <Link role="menuitem" href={dashboard} onClick={() => setOpen(false)} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-[#0d0d50] hover:bg-[#f2f2ff]">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#6666ff] text-white">
                <LayoutDashboard className="h-4 w-4" />
              </span>
              <span className="flex-1">Dashboard</span>
              <ArrowRight className="h-4 w-4 text-[#0d0d50]/30 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {master && (
              <div className="px-1 pb-1">
                <MasterDashboardPill onClick={() => setOpen(false)} />
              </div>
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
              {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
