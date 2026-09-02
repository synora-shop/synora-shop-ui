"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { ChevronRight, ExternalLink, Info, LogOut, Menu, Settings2, Store, User, X } from "lucide-react";
import { SettingsSearch } from "@/components/customizer/settings-search";
import { Wordmark } from "@/components/ui/wordmark";
import { chromeFor } from "@/lib/admin-chrome";
import { cn } from "@/lib/utils";
import { useAdminNav } from "@/lib/admin-nav-store";

/**
 * The bar across the top of every admin page.
 *
 * Three things, in the order a merchant needs them. Which store am I in, on the
 * left, where the eye starts. Whose product this is, in the middle. And search,
 * given the whole right side because it is the fastest route to anything and
 * the panel now has more screens than a sidebar can show at once.
 *
 * The bar is coloured by the kind of business — see lib/admin-chrome.ts. A
 * merchant with a restaurant and a shop switches between two panels that are
 * otherwise identical; the colour is what tells them which one they are in
 * before they read a word.
 *
 * The store identity on the left is also the account menu. Everything that used
 * to sit on the right — visibility, preview, settings, switching store, signing
 * out — is inside it, because the right side is search now and because those
 * are all answers to "what about this store?", which is what the name is.
 */
export function AdminTopbar({
  storeName,
  isLive,
  userName,
  userEmail,
  storeUrl,
  businessType,
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
  /** Registry spelling — "ecommerce", not "ECOMMERCE". Picks the colour. */
  businessType: string;
  /** Shown only to people who work on more than one — see app/merchant/stores. */
  hasOtherStores?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navOpen = useAdminNav((s) => s.open);
  const toggleNav = useAdminNav((s) => s.toggle);
  const skin = chromeFor(businessType);

  return (
    <header
      className="sticky top-0 z-40 text-white"
      style={{ backgroundColor: skin.bar }}
    >
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
          className="-ml-1 flex-shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/10 lg:hidden"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Which store, and whose account. Both, because a merchant with two
            stores and two logins needs to know which pair they are in. */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Store and account menu"
            className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-white/10"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-semibold">
              {initials(storeName)}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <span className="flex items-center gap-1.5">
                <span className="block max-w-40 truncate text-sm font-semibold leading-tight">
                  {storeName}
                </span>
                <span
                  className={cn(
                    "h-1.5 w-1.5 flex-shrink-0 rounded-full",
                    isLive ? "bg-green-400" : "bg-amber-400"
                  )}
                  title={
                    isLive
                      ? "Customers can see your store."
                      : "Your store is hidden while maintenance mode is on."
                  }
                  aria-label={isLive ? "Live" : "Hidden"}
                />
              </span>
              <span className="block max-w-40 truncate text-[11px] leading-tight text-white/70">
                {userEmail}
              </span>
            </span>
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute left-0 top-full z-50 mt-1.5 w-64 overflow-hidden rounded-xl border border-border bg-surface text-ink shadow-xl">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <User className="h-3.5 w-3.5 text-ink-faint" />
                    {userName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{userEmail}</p>
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium",
                    isLive ? "text-green" : "text-amber"
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", isLive ? "bg-green" : "bg-amber")}
                    aria-hidden
                  />
                  {isLive ? "Live — customers can see your store" : "Hidden while in maintenance"}
                </span>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm transition-colors hover:bg-subtle"
                >
                  <Store className="h-4 w-4 text-ink-faint" />
                  Preview store
                  <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
                </a>
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

        {/* Changing what kind of business this is rewrites the sidebar, the
            words on every screen and the colour of this bar, so it says what it
            is and sits next to the store it would change — not buried in
            settings, where a merchant would not think to look for it. */}
        <Link
          href="/admin/account"
          className="hidden flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white xl:inline-flex"
        >
          <Info className="h-3.5 w-3.5 opacity-70" />
          Change APP type
          <ChevronRight className="h-3.5 w-3.5 opacity-70" />
        </Link>

        <Link href="/admin" className="mx-auto hidden flex-shrink-0 items-center lg:flex">
          <Wordmark size="sm" />
        </Link>

        <div className="ml-auto flex min-w-0 max-w-md flex-1 lg:ml-0 lg:max-w-sm xl:max-w-md">
          <SettingsSearch className="w-full" onDark />
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
