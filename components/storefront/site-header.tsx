"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { useCartStore } from "@/lib/cart-store";
import { THEME_LAYOUT_DEFAULTS, type HeaderLayout } from "@/lib/theme-layout";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  children?: { id: string; href: string; label: string }[];
};

// Falls back to the original hardcoded links if no admin-managed menu items
// exist yet (e.g. this render raced the lazy DB seed) — never show an empty nav.
const FALLBACK_NAV_LINKS: NavLink[] = [
  { href: "/shop", label: "Shop All" },
  { href: "/collections/lawn", label: "Lawn" },
  { href: "/collections/formal", label: "Formal" },
  { href: "/collections/unstitched", label: "Unstitched" },
  { href: "/collections/sale", label: "Sale" },
];

export function SiteHeader({
  links,
  logoColor,
  logoSrc,
  logoSrcCompact,
  logoHeight = 24,
  storeName,
  layout,
}: {
  links?: NavLink[];
  /**
   * Where the logo and the links sit.
   *
   * Optional, and defaulting to the arrangement the storefront has always had,
   * so a shop on a theme that says nothing about its header is untouched.
   */
  layout?: HeaderLayout;
  logoColor?: string | null;
  /** The wide mark, resolved for this header's background. */
  logoSrc?: string;
  /**
   * The compact mark, for widths where a wordmark cannot be read.
   *
   * Both are rendered and CSS chooses, rather than a media query in
   * JavaScript. A hook that measures the window has nothing to measure on the
   * server, so the header would ship one mark, hydrate, and swap — a visible
   * flicker on the first thing anyone sees of the shop.
   *
   * Only differs from logoSrc when the merchant has actually uploaded a
   * compact mark; lib/brand-marks.ts falls back to the wide one otherwise, and
   * this renders a single image when the two are the same.
   */
  logoSrcCompact?: string;
  logoHeight?: number;
  /** Drawn when the shop has no logo at all. Never the platform's artwork. */
  storeName?: string;
}) {
  const NAV_LINKS = links && links.length > 0 ? links : FALLBACK_NAV_LINKS;
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  const mode = layout ?? THEME_LAYOUT_DEFAULTS.header;

  const desktopNav = (
    <nav className="hidden lg:flex lg:gap-8">
          {NAV_LINKS.map((link) =>
            link.children?.length ? (
              // The parent stays a real link, not just a menu trigger: a
              // dropdown whose top item goes nowhere strands anyone who clicks
              // the thing they were aiming at.
              <div key={link.href} className="group relative">
                <Link
                  href={link.href}
                  className="flex items-center gap-1 text-sm font-medium text-ink-soft transition-colors hover:text-brand-600"
                >
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Link>
                <div
                  className="invisible absolute left-0 top-full z-40 min-w-44 pt-2 opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  <div className="overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg">
                    {link.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className="block px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-blush hover:text-ink"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-ink-soft transition-colors hover:text-brand-600"
              >
                {link.label}
              </Link>
            )
          )}
    </nav>
  );

  return (
    <header
      data-shp-region="header"
      // Falls back to the original canvas/ink when no theme is set, so an
      // unthemed store renders byte-for-byte as it did before.
      style={{
        backgroundColor: "var(--shp-header-bg, var(--color-canvas))",
        color: "var(--shp-header-text, var(--color-ink))",
      }}
      className="sticky top-0 z-30 border-b border-border backdrop-blur"
    >
      <Container className={cn("flex h-16 items-center justify-between gap-4", mode === "centred" && "lg:relative")}>
        <button
          className={cn(
            "inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-subtle active:bg-brand-100",
            // Minimal keeps the button at every width: its links live nowhere
            // else, so hiding it on a desktop would hide the navigation.
            mode !== "minimal" && "lg:hidden"
          )}
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          href="/"
          className={cn("shrink-0", mode === "centred" && "lg:absolute lg:left-1/2 lg:-translate-x-1/2")}
          data-shp-region="logo"
        >
          {logoSrcCompact && logoSrcCompact !== logoSrc ? (
            <>
              <Logo
                color={logoColor}
                height={logoHeight}
                src={logoSrcCompact}
                fallbackText={storeName}
                className="sm:hidden"
              />
              <Logo
                color={logoColor}
                height={logoHeight}
                src={logoSrc}
                fallbackText={storeName}
                className="hidden sm:inline-block"
              />
            </>
          ) : (
            <Logo
              color={logoColor}
              height={logoHeight}
              src={logoSrc}
              fallbackText={storeName}
            />
          )}
        </Link>

        {mode === "classic" && desktopNav}

        {/* Pushed right by hand in the centred header.

            The logo is taken out of the flex flow there so it can sit on the
            true middle of the row, which leaves the tools as the only child of
            a justify-between and slides them to the left edge. Looked correct
            in the markup and wrong on the screen. */}
        <div className={cn("flex items-center gap-2", mode === "centred" && "lg:ml-auto")}>
          <Link
            href="/shop"
            aria-label="Search"
            className="hidden rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-ink sm:inline-flex"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-ink"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative rounded p-1.5 text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-ink"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-medium text-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </Container>

      {/* Centred puts the links on their own row underneath the logo. It costs
          about forty pixels of height, which is the trade a shop makes for a
          symmetrical mark — and the reason a shop with many links should stay
          on Classic. */}
      {mode === "centred" && (
        <Container className="hidden justify-center pb-3 lg:flex">{desktopNav}</Container>
      )}

      {menuOpen && (
        <nav className="border-t border-border bg-canvas lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-2 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-subtle hover:text-ink active:bg-brand-100 active:text-ink"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
