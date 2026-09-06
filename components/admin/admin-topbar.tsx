"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  Info,
  LogOut,
  Menu,
  Search,
  Settings2,
  Store,
  X,
} from "lucide-react";
import { SettingsSearch } from "@/components/customizer/settings-search";
import { SynoraAppMark } from "@/components/ui/synora-app-mark";
import { BusinessTypeDialog } from "@/components/admin/business-type-dialog";
import { resolveNav } from "@/lib/admin-nav";
import { useAdminNav } from "@/lib/admin-nav-store";
import { cn } from "@/lib/utils";

export type Alert = { label: string; href: string };

/**
 * The heading bar and the top header, which APP.ai draws as one row.
 *
 * Three things across the width. On the left, where the eye starts, the name of
 * the sidebar section you are in and the trail that got you here — every crumb
 * a link, so going back up is one click rather than a hunt in the sidebar. In
 * the middle, dead centre of the *window* rather than of the column, the mark
 * that names the product. On the right, one pill holding search, notifications
 * and the account.
 *
 * The bar carries no colour of its own any more. It used to be painted by
 * business type — maroon for a shop, purple for a restaurant — and that is gone
 * on purpose: colour in this panel means "selected", and a permanently coloured
 * bar was competing with the one thing that needed to say it.
 */
export function AdminTopbar({
  storeName,
  isLive,
  userEmail,
  storeUrl,
  registryType,
  hasOtherStores = false,
  alerts = [],
}: {
  storeName: string;
  isLive: boolean;
  userEmail: string;
  /** The shop's own public address — absolute, because "/" is the platform's. */
  storeUrl: string;
  /** Registry spelling — "ecommerce", not "ECOMMERCE". For the type dialog. */
  registryType: string;
  hasOtherStores?: boolean;
  /** Things waiting on the merchant. Empty means nothing needs them. */
  alerts?: Alert[];
}) {
  const [menu, setMenu] = useState<"account" | "bell" | "search" | null>(null);
  const [dialog, setDialog] = useState<"info" | "switch" | null>(null);
  const navOpen = useAdminNav((s) => s.open);
  const toggleNav = useAdminNav((s) => s.toggle);
  const trailing = useAdminNav((s) => s.crumb);
  const pathname = usePathname();

  const { section, crumbs } = resolveNav(pathname);
  const trail = trailing ? [...crumbs, { label: trailing, href: pathname }] : crumbs;

  const close = () => setMenu(null);

  return (
    <header className="sticky top-0 z-40 bg-shell">
      {/* Centred on the window, not on this column, which is where APP.ai puts
          it. Fixed rather than absolute so it cannot drift when the column
          under it changes width.
          From xl only: below that the window's centre falls inside the page
          title, and the mark would sit on top of the word it is beside. */}
      <span className="pointer-events-none fixed inset-x-0 top-0 z-50 hidden h-[76px] items-center justify-center xl:flex">
        <Link href="/admin" className="pointer-events-auto">
          <SynoraAppMark color="var(--color-brand-500)" tone="onLight" />
        </Link>
      </span>

      {/* A fixed height, so a screen without a breadcrumb does not make the
          bar shorter than its neighbours — the mark is centred against this
          height from a fixed position and would drift with it. */}
      <div className="gutter-fluid flex h-[76px] items-center gap-3">
        <button
          type="button"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          aria-controls="admin-nav"
          onClick={toggleNav}
          className="-ml-1 flex-shrink-0 rounded-full p-2 text-control-ink transition-colors hover:bg-panel lg:hidden"
        >
          {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* The heading bar: which section, and how you got here. */}
        <div className="min-w-0 flex-1">
          <h1 className="text-page-title truncate font-normal tracking-tight text-ink">
            {section.label}
          </h1>
          {trail.length > 0 && (
          <nav aria-label="Breadcrumb" className="mt-0.5 flex items-center gap-1 text-[13px]">
            {trail.map((crumb, i) => (
              <span key={`${crumb.href}-${i}`} className="flex min-w-0 items-center gap-1">
                {i > 0 && <span className="text-control-soft">›</span>}
                {i === trail.length - 1 ? (
                  <span className="truncate text-control-soft">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="truncate rounded text-control-soft transition-colors hover:text-brand-500 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
          )}
        </div>

        {/* Which type this store is, and what the types mean. Two questions a
            merchant asks a moment apart, so two controls side by side. */}
        <div className="hidden flex-shrink-0 items-center xl:flex">
          <button
            type="button"
            onClick={() => setDialog("info")}
            aria-label="Which type fits your business?"
            className="rounded-full p-2 text-control-soft transition-colors hover:bg-panel hover:text-ink"
          >
            <Info className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDialog("switch")}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs text-control-soft transition-colors hover:bg-panel hover:text-ink"
          >
            Change APP type
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search, notifications, account. One pill, as drawn. */}
        <div className="relative flex flex-shrink-0 items-center gap-1 rounded-pill bg-panel px-1.5 py-1.5">
          <IconButton
            label="Search the admin"
            active={menu === "search"}
            onClick={() => setMenu((m) => (m === "search" ? null : "search"))}
          >
            <Search className="h-[18px] w-[18px]" />
          </IconButton>

          <IconButton
            label={alerts.length ? `${alerts.length} things need attention` : "Notifications"}
            active={menu === "bell"}
            onClick={() => setMenu((m) => (m === "bell" ? null : "bell"))}
          >
            <Bell className="h-[18px] w-[18px]" />
            {alerts.length > 0 && (
              <span
                className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose ring-2 ring-panel"
                aria-hidden
              />
            )}
          </IconButton>

          <button
            type="button"
            aria-label="Store and account menu"
            aria-expanded={menu === "account"}
            onClick={() => setMenu((m) => (m === "account" ? null : "account"))}
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white transition-transform hover:-translate-y-px"
          >
            {initials(storeName)}
            <span
              className={cn(
                "absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full ring-2 ring-panel",
                isLive ? "bg-green" : "bg-amber"
              )}
              title={isLive ? "Customers can see your store." : "Your store is hidden."}
              aria-label={isLive ? "Live" : "Hidden"}
            />
          </button>

          {menu && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-control-line bg-control text-ink shadow-lg">
                {menu === "search" && (
                  <div className="p-2">
                    <SettingsSearch />
                  </div>
                )}

                {menu === "bell" && (
                  <div className="py-1">
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-control-soft">
                      Notifications
                    </p>
                    {alerts.length === 0 ? (
                      <p className="px-3 pb-3 pt-1 text-sm text-ink-soft">
                        Nothing needs your attention.
                      </p>
                    ) : (
                      alerts.map((alert) => (
                        <Link
                          key={alert.href}
                          href={alert.href}
                          onClick={close}
                          className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
                        >
                          {alert.label}
                          <ChevronRight className="ml-auto h-3.5 w-3.5 text-control-soft" />
                        </Link>
                      ))
                    )}
                  </div>
                )}

                {menu === "account" && (
                  <>
                    <div className="border-b border-control-line px-3 py-2.5">
                      <p className="truncate text-sm font-medium">{storeName}</p>
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
                      onClick={close}
                      className="flex items-center gap-2 border-t border-control-line px-3 py-2 text-sm transition-colors hover:bg-panel"
                    >
                      <Store className="h-4 w-4 text-control-soft" />
                      Preview store
                      <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
                    </a>
                    <Link
                      href="/admin/account"
                      onClick={close}
                      className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
                    >
                      <Settings2 className="h-4 w-4 text-control-soft" />
                      Your account
                    </Link>
                    {hasOtherStores && (
                      <Link
                        href="/merchant/stores"
                        onClick={close}
                        className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
                      >
                        <Store className="h-4 w-4 text-control-soft" />
                        Switch store
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => signOut({ redirectTo: "/" })}
                      className="flex w-full items-center gap-2 border-t border-control-line px-3 py-2 text-sm transition-colors hover:bg-rose-bg hover:text-rose"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {dialog && (
        <BusinessTypeDialog
          current={registryType}
          mode={dialog}
          onClose={() => setDialog(null)}
        />
      )}
    </header>
  );
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={active}
      onClick={onClick}
      className={cn(
        "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-colors",
        active ? "bg-brand-500 text-white" : "text-control-ink hover:bg-control"
      )}
    >
      {children}
    </button>
  );
}

/** Up to two initials, so the avatar reads as the store rather than a generic icon. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
