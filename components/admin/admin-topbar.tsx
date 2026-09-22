"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Settings2,
  Store,
  X,
} from "lucide-react";
import { AdminSearch } from "@/components/admin/admin-search";
import { NotificationIcon } from "@/components/admin/nav-icons";
import { ExternalLinkIcon, InfoIcon, SynoraAppMark } from "@/components/ui/synora-marks";
import { BusinessTypeDialog } from "@/components/admin/business-type-dialog";
import type { ShopStatusName } from "@/lib/store-type-switch";
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
  storeStatus,
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
  /** Whether the store is open. An open store cannot change what it sells. */
  storeStatus: ShopStatusName;
  hasOtherStores?: boolean;
  /** Things waiting on the merchant. Empty means nothing needs them. */
  alerts?: Alert[];
}) {
  const [menu, setMenu] = useState<"account" | "bell" | null>(null);
  const [searching, setSearching] = useState(false);
  const [dialog, setDialog] = useState<"info" | "switch" | null>(null);
  const navOpen = useAdminNav((s) => s.open);
  const toggleNav = useAdminNav((s) => s.toggle);
  const trailing = useAdminNav((s) => s.crumb);
  const pathname = usePathname();

  const { section, crumbs } = resolveNav(pathname);

  const close = () => setMenu(null);

  // "/" is the near-universal search shortcut and ⌘K is the other one. Both
  // only when the merchant is not already typing somewhere.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      const palette = (event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey);
      if (palette || (event.key === "/" && !typing)) {
        event.preventDefault();
        setMenu(null);
        setSearching(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    // 80px of #5050ea across the whole window, above the sidebar as well as
    // the content. The one saturated surface in the panel.
    //
    // It is flat. What makes it look like a gradient in the drawing is the
    // page's own white glow falling upward across it — the same relationship
    // the header and background have on synoradigitals.com. A painted gradient
    // would look close and behave wrong: the light would not move when the
    // content beneath it does.
    <header className="relative z-0 h-[calc(var(--header-h)+var(--radius-page))] flex-shrink-0 bg-header">
      {/* The bar itself is 80px. The header element is taller by the
          background's corner radius, and that extra strip exists only to be
          the indigo showing through behind the curve — see app/admin/layout. */}
      {/* 65 in on the left, 41 on the right — measured off the artboard, not
          assumed to be the 30 that governs everything below the header. */}
      <div className="flex h-[var(--header-h)] items-center gap-3 pl-[calc(65*var(--u))] pr-[calc(41*var(--u))] max-lg:px-4">
        {/* The mark, at the left where the design puts it. It was centred on
            the window while the header was colourless and the centre was the
            only place it could sit without looking like a heading. */}
        <Link href="/admin" className="hidden flex-shrink-0 items-center lg:flex">
          <SynoraAppMark className="h-[var(--logo-h)] w-auto text-white" />
        </Link>

        <button
          type="button"
          aria-label={navOpen ? "Close menu" : "Open menu"}
          aria-expanded={navOpen}
          aria-controls="admin-nav"
          onClick={toggleNav}
          className="-ml-1 flex-shrink-0 rounded-full p-2 text-white transition-colors hover:bg-white/15 lg:hidden"
        >
          {navOpen ? <X className="h-[var(--icon-box)] w-[var(--icon-box)]" /> : <Menu className="h-[var(--icon-box)] w-[var(--icon-box)]" />}
        </button>

        {/* Where you are is said twice already — the sidebar lights the
            section and the navigation bar lights the screen — so the design
            puts neither a title nor a trail in the header, and there is no
            third place to say it.
            
            The heading stays, unseen. A page with no h1 is a page a screen
            reader cannot summarise, and "drawn nowhere" is not the same as
            "does not exist". */}
        <h1 className="sr-only">{section.label}</h1>
        <div className="min-w-0 flex-1" />

        {/* Search, as drawn: a field rather than an icon, so what it searches
            is written on it instead of being something you have to try.
            
            390.5 x 50 in #0c0c4a — Synora's night — all three read off the
            artboard. It was a translucent tint of that colour at 360 wide,
            which is a different colour and a different size.
            
            A button that looks like an input, deliberately. Typing happens in
            the overlay it opens, which is where the results are; an input here
            would hand its first keystroke to a second input, and the handover
            is always visible. */}
        <button
          type="button"
          onClick={() => {
            setMenu(null);
            setSearching(true);
          }}
          className="hidden h-[var(--header-bar-h)] min-w-0 flex-shrink items-center gap-[calc(12*var(--u))] rounded-pill bg-[var(--color-header-field)] px-[calc(21*var(--u))] text-left text-[length:var(--text-secondary)] text-[var(--color-placeholder-dark)] transition-opacity hover:opacity-90 md:flex md:w-[calc(390.5*var(--u))]"
        >
          <Search className="h-[var(--icon-box)] w-[var(--icon-box)] flex-shrink-0 text-white" />
          <span className="truncate">Search Products, Customers, Pages</span>
        </button>

        {/* Notifications and the account. One pill, as drawn. */}
        {/* Below the search field's breakpoint the field is hidden, so the
            magnifier comes back as its own button — outside the pill, which
            keeps its drawn width at every size. */}
          <IconButton
            label="Search the admin"
            active={searching}
            onClick={() => {
              setMenu(null);
              setSearching(true);
            }}
            className="md:hidden"
          >
            <Search className="h-[var(--icon-box)] w-[var(--icon-box)]" />
          </IconButton>

        {/* 103.1 x 50, with the bell 16.1 in from the left, a 21.3 gap, and
            the avatar 6.3 from the right — all measured. The asymmetry is the
            drawing's: a 20px glyph needs air around it, a 39.4 avatar in a 50
            pill does not. */}
        <div className="relative ml-[calc(28.5*var(--u))] flex h-[var(--header-bar-h)] w-[calc(103.1*var(--u))] flex-shrink-0 items-center justify-between rounded-pill bg-panel pl-[calc(16.1*var(--u))] pr-[calc(6.3*var(--u))]">

          <button
            type="button"
            aria-label={alerts.length ? `${alerts.length} things need attention` : "Notifications"}
            title={alerts.length ? `${alerts.length} things need attention` : "Notifications"}
            aria-expanded={menu === "bell"}
            onClick={() => setMenu((m) => (m === "bell" ? null : "bell"))}
            className="flex flex-shrink-0 items-center justify-center text-control-ink transition-opacity hover:opacity-70"
          >
            {/* The dot lives inside the glyph, where it was drawn: green,
                ringed in white, breaking the bell's outline at the top right.
                It was a red dot pinned to the corner of the button. */}
            <NotificationIcon unread={alerts.length > 0} />
          </button>

          <button
            type="button"
            aria-label="Store and account menu"
            aria-expanded={menu === "account"}
            onClick={() => setMenu((m) => (m === "account" ? null : "account"))}
            // 39.4 square with a 14.65 corner — a rounded square, not a
            // circle, and the radius is kept as a percentage so it survives
            // scaling. #aa4cc1 is the drawing's own.
            //
            // The initials belong on it. The plate in the drawing is empty
            // because a drawing has no store to name; removing them was me
            // reading an absence as a decision.
            //
            // The status dot stays off. That one really was mine, and whether
            // the store is live is said in words in the menu this opens, which
            // is where a merchant can act on it rather than just see it.
            className="flex h-[calc(39.4*var(--u))] w-[calc(39.4*var(--u))] flex-shrink-0 items-center justify-center rounded-[var(--radius-avatar)] bg-[var(--color-avatar)] text-[length:var(--text-small)] font-semibold text-white"
          >
            {initials(storeName)}
          </button>

          {menu && (
            <>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-[var(--radius-container)] border border-control-line bg-control text-ink shadow-lg">
                {menu === "bell" && (
                  <div className="py-1">
                    <p className="px-3 pb-1 pt-2 text-[length:calc(11*var(--u))] font-semibold uppercase tracking-wide text-control-soft">
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
                          <ChevronRight className="ml-auto h-[var(--icon-box)] w-[var(--icon-box)].5 text-control-soft" />
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
                      <Store className="h-[var(--icon-box)] w-[var(--icon-box)] text-control-soft" />
                      Preview store
                      <ExternalLinkIcon className="ml-auto opacity-60" />
                    </a>
                    <Link
                      href="/admin/account"
                      onClick={close}
                      className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
                    >
                      <Settings2 className="h-[var(--icon-box)] w-[var(--icon-box)] text-control-soft" />
                      Your account
                    </Link>
                    {/* These two were a pair of controls in the header. The
                        design's header holds the mark, search, notifications
                        and the account and nothing else, so they moved here
                        rather than being dropped — which is where a merchant
                        looks for what their store *is* anyway. */}
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        setDialog("switch");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
                    >
                      <ChevronRight className="h-[var(--icon-box)] w-[var(--icon-box)] text-control-soft" />
                      Change APP type
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        setDialog("info");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
                    >
                      <InfoIcon className="h-[var(--icon-box)] w-[var(--icon-box)] text-control-soft" />
                      Which type fits your business?
                    </button>
                    {hasOtherStores && (
                      <Link
                        href="/merchant/stores"
                        onClick={close}
                        className="flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-panel"
                      >
                        <Store className="h-[var(--icon-box)] w-[var(--icon-box)] text-control-soft" />
                        Switch store
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => signOut({ redirectTo: "/" })}
                      className="flex w-full items-center gap-2 border-t border-control-line px-3 py-2 text-sm transition-colors hover:bg-rose-bg hover:text-rose"
                    >
                      <LogOut className="h-[var(--icon-box)] w-[var(--icon-box)]" />
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rendered only while it is open, so a fresh mount is a fresh search.
          It used to stay mounted and reset itself in an effect. */}
      {searching && <AdminSearch onClose={() => setSearching(false)} />}

      {dialog && (
        <BusinessTypeDialog
          current={registryType}
          mode={dialog}
          status={storeStatus}
          onClose={() => setDialog(null)}
        />
      )}
    </header>
  );
}

/**
 * Up to two initials, so the plate names the store rather than being a colour.
 *
 * Deleted for a day, because the drawing shows an empty plate — which it would,
 * having no store to name.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function IconButton({
  label,
  active,
  onClick,
  children,
  className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={active}
      onClick={onClick}
      className={cn(
        // Scaled: a fixed 36px button in a 50-design-pixel pill overflows it
        // on every screen narrower than the artboard.
        "relative flex h-[calc(38*var(--u))] w-[calc(38*var(--u))] flex-shrink-0 items-center justify-center rounded-full transition-colors",
        active ? "bg-brand-500 text-white" : "text-control-ink hover:bg-control",
        className
      )}
    >
      {children}
    </button>
  );
}


