"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronDown, ExternalLink, LogOut, Menu, Settings2, Store, User, X } from "lucide-react";
import { SettingsSearch } from "@/components/customizer/settings-search";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/utils";
import { useAdminNav } from "@/lib/admin-nav-store";

/**
 * The bar across the top of every admin page.
 *
 * Search sits in the middle because it is the fastest route to anything, and
 * "Preview store" sits on the right because the question a merchant asks most
 * often is "what does this look like to a customer?" — which previously had no
 * answer anywhere in the panel.
 *
 * The store name and its visibility live here too: knowing whether customers
 * can currently see the shop is the kind of thing that should never require
 * navigating to find out.
 */
export function AdminTopbar({
  storeName,
  isLive,
  userName,
  userEmail,
  storeUrl,
  hasOtherStores = false,
}: {
  storeName: string;
  isLive: boolean;
  userName: string;
  userEmail: string;
  /**
   * The shop's own public address.
   *
   * An absolute URL rather than "/", which is what this used to be. On a shop's
   * own domain those are the same thing; on the platform's own host "/" is the
   * marketing page, so the button quietly stopped pointing at the store.
   */
  storeUrl: string;
  /** Shown only to people who work on more than one — see app/merchant/stores. */
  hasOtherStores?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navOpen = useAdminNav((s) => s.open);
  const toggleNav = useAdminNav((s) => s.toggle);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="gutter-fluid flex h-14 items-center gap-3">
        {/* The navigation toggle belongs here, in the bar that is actually on
            top. The sidebar used to carry its own bar for this at the same
            offset but a layer below, so this button was painted over and the
            drawer could not be opened on a phone at all. */}
        <button
          type="button"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          aria-controls="admin-nav"
          onClick={toggleNav}
          className="-ml-1 flex-shrink-0 rounded-lg p-1.5 text-ink transition-colors hover:bg-subtle active:bg-brand-100 lg:hidden"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/admin" className="flex flex-shrink-0 items-center lg:hidden">
          <Wordmark size="sm" markOnly />
        </Link>

        <div className="ml-auto flex min-w-0 max-w-xl flex-1 lg:ml-0">
          <SettingsSearch className="w-full" />
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {/* Visibility, stated rather than implied. */}
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex",
              isLive ? "bg-green-bg text-green" : "bg-amber-bg text-amber"
            )}
            title={
              isLive
                ? "Customers can see your store."
                : "Your store is hidden from customers while maintenance mode is on."
            }
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-green" : "bg-amber")}
              aria-hidden
            />
            {isLive ? "Live" : "Hidden"}
          </span>

          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
          >
            <Store className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview store</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Account menu"
              className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-subtle"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600 text-[11px] font-semibold text-white">
                {initials(storeName)}
              </span>
              <span className="hidden max-w-28 truncate text-xs font-medium sm:block">
                {storeName}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
                  <div className="border-b border-border px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-sm font-medium">
                      <User className="h-3.5 w-3.5 text-ink-faint" />
                      {userName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-soft">{userEmail}</p>
                  </div>
                  <Link
                    href="/admin/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-subtle"
                  >
                    <Settings2 className="h-4 w-4 text-ink-faint" />
                    Store settings
                  </Link>
                  {hasOtherStores && (
                    <Link
                      href="/merchant/stores"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-subtle"
                    >
                      <Store className="h-4 w-4 text-ink-faint" />
                      Switch store
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ redirectTo: "/" })}
                    className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-sm transition-colors hover:bg-rose-bg hover:text-rose"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/** Up to two initials, so the avatar reads as the store rather than a generic icon. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
