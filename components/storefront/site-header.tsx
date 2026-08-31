"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { useCartStore } from "@/lib/cart-store";

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
  logoHeight = 24,
}: {
  links?: NavLink[];
  logoColor?: string | null;
  logoSrc?: string;
  logoHeight?: number;
}) {
  const NAV_LINKS = links && links.length > 0 ? links : FALLBACK_NAV_LINKS;
  const [menuOpen, setMenuOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

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
      <Container className="flex h-16 items-center justify-between gap-4">
        <button
          className="inline-flex items-center justify-center rounded p-1 transition-colors hover:bg-subtle active:bg-brand-100 lg:hidden"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="shrink-0" data-shp-region="logo">
          <Logo color={logoColor} height={logoHeight} src={logoSrc} />
        </Link>

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

        <div className="flex items-center gap-2">
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
