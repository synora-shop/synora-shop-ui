"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { LOOM_RULE } from "@/components/loom/primitives";
import {
  LoomCartIcon,
  LoomChevronDown,
  LoomHeartOutline,
  LoomMenuIcon,
  LoomSearchIcon,
  LoomUserIcon,
} from "@/components/loom/icons";
import { T } from "@/components/loom/type";
import { menu, on, str, type LoomContext, type LoomLink } from "@/components/loom/contract";

/**
 * The header — the kit's "Navbar" strip and "Navigation" row, as one section a
 * merchant sets up in the customizer, like Shopify's header section.
 *
 * Everything it shows is a setting: the wordmark, which menu the categories
 * are, which menu the strip is, the search placeholder, and whether the strip,
 * the search and each of the three icons are shown at all. Menus are chosen,
 * not typed: build one under Admin → Menus, with dropdowns if wanted, and
 * point the header at it.
 *
 * Desktop: the file's geometry exactly (verify-loom.mjs measures it). A link
 * with children opens a dropdown on hover, on focus and on tap — the chevron
 * the kit draws beside every category is the promise of one. The panel is the
 * kit's language: white, outlined in the search field's #e3e3e3, radius 24,
 * links in Body 6.
 *
 * Phone: the wordmark and the menu button, as drawn. What the button opens is
 * not in the kit, so it is designed here — see Drawer.
 */

export function LoomHeader({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const [drawer, setDrawer] = useState(false);
  const main = menu(data, "mainMenu", ctx);
  const utility = menu(data, "utilityMenu", ctx);

  return (
    <header>
      {on(data, "showUtility") && (
        <div className="hidden h-[calc(64*var(--u))] items-center justify-between border-b border-black/5 px-[calc(60*var(--u))] md:flex">
          <div className="flex items-center gap-[calc(36*var(--u))]">
            {[str(data, "languageLabel"), str(data, "currencyLabel")].filter(Boolean).map((t) => (
              <button key={t} type="button" className={cn(T.small, "text-black/50")}>
                {t}
              </button>
            ))}
          </div>
          <div data-m="navbar-links" className="flex items-center gap-[calc(40*var(--u))]">
            {utility.map((l) => (
              <a key={l.id} href={l.href} className={cn(T.small, "text-black/50")}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="flex h-[calc(94*var(--u))] items-center px-[calc(24*var(--u))] pb-[calc(24*var(--u))] pt-[calc(40*var(--u))] md:h-[calc(80*var(--u))] md:px-[calc(60*var(--u))] md:py-0">
        {/* 161 wide on purpose: Figma's text box, not the glyph run, so the
            search lands where the file puts it. */}
        <a
          href="/loom"
          data-m="nav-wordmark"
          className="min-w-[calc(161*var(--u))] whitespace-nowrap text-[max(calc(24*var(--u)),19.2px)] font-extrabold leading-[max(calc(30*var(--u)),24px)] tracking-normal text-black"
        >
          {str(data, "logoText")}
        </a>

        <div className="ml-[calc(24*var(--u))] hidden items-center gap-[calc(40*var(--u))] md:flex">
          {on(data, "showSearch") && <SearchField placeholder={str(data, "searchPlaceholder")} />}
          <nav data-m="nav-categories" aria-label="Main" className="hidden items-center gap-[calc(40*var(--u))] lg:flex">
            {main.map((l) => (
              <TopLink key={l.id} link={l} />
            ))}
          </nav>
        </div>

        {/* 117x24, gap 24, bottom-aligned — so the 21px cart sits 3px lower. */}
        <div className="ml-auto hidden items-end gap-[calc(24*var(--u))] text-[#2e3a59] md:flex">
          {on(data, "showWishlist") && (
            <a href="/loom/wishlist" aria-label="Wishlist">
              <LoomHeartOutline className="h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)]" />
            </a>
          )}
          {on(data, "showAccount") && (
            <a href="/loom/account/sign-in" aria-label="Account">
              <LoomUserIcon className="h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)]" />
            </a>
          )}
          {on(data, "showCart") && (
            <a href="/loom/cart" aria-label="Cart">
              <LoomCartIcon className="h-[max(calc(21*var(--u)),17.5px)] w-[max(calc(21*var(--u)),17.5px)]" />
            </a>
          )}
        </div>

        <button
          type="button"
          aria-label={str(data, "menuButtonLabel")}
          aria-haspopup="dialog"
          aria-expanded={drawer}
          onClick={() => setDrawer(true)}
          data-m="menu-button"
          className="ml-auto text-black md:ml-[calc(24*var(--u))] lg:hidden"
        >
          <LoomMenuIcon className="h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)]" />
        </button>
      </div>

      {drawer && <Drawer data={data} main={main} utility={utility} onClose={() => setDrawer(false)} />}
    </header>
  );
}

/** The header's search: 312x34, a true pill outlined #e3e3e3. It submits to the search page. */
function SearchField({ placeholder, big = false }: { placeholder: string; big?: boolean }) {
  return (
    <form
      role="search"
      action="/loom/search"
      className={cn(
        "flex items-center justify-between rounded-[2000px] border border-[#e3e3e3] px-[calc(20*var(--u))]",
        big ? "h-[max(calc(50*var(--u)),40px)] w-full" : "h-[max(calc(34*var(--u)),32px)] w-[calc(312*var(--u))]"
      )}
    >
      <input
        type="search"
        name="q"
        placeholder={placeholder}
        aria-label="Search"
        className={cn(
          "w-full min-w-0 bg-transparent text-[#121212] outline-none placeholder:text-[#121212]/50",
          big ? T.body6 : "text-[max(calc(13*var(--u)),11px)] leading-[max(calc(18*var(--u)),14.4px)]"
        )}
      />
      <button type="submit" aria-label="Search" className="shrink-0">
        <LoomSearchIcon className="h-[max(calc(20*var(--u)),16px)] w-[max(calc(20*var(--u)),16px)] text-[#2e3a59] opacity-50" />
      </button>
    </form>
  );
}

/**
 * One top-level link: label, 8, the 24px chevron — and, when it has children,
 * a dropdown that opens on hover and focus (CSS) and on tap (state), so it
 * works with a mouse, a keyboard and a finger on a tablet alike.
 */
function TopLink({ link }: { link: LoomLink }) {
  const [open, setOpen] = useState(false);
  const label = "flex h-[calc(34*var(--u))] items-center gap-[calc(8*var(--u))] text-[max(calc(14*var(--u)),11.2px)] font-semibold leading-[max(calc(16*var(--u)),12.8px)] text-black/80";
  if (!link.children?.length) {
    return (
      <a href={link.href} className={label}>
        {link.label}
      </a>
    );
  }
  return (
    <div
      className="group relative"
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={label}>
        {link.label}
        <LoomChevronDown className="h-[calc(24*var(--u))] w-[calc(24*var(--u))] transition-transform duration-200 group-hover:rotate-180" />
      </button>
      <div
        className={cn(
          "absolute left-0 top-full z-40 pt-[calc(8*var(--u))]",
          open ? "block" : "hidden group-hover:block group-focus-within:block"
        )}
      >
        <ul className="flex min-w-[calc(220*var(--u))] flex-col gap-[calc(4*var(--u))] rounded-[calc(24*var(--u))] border border-[#e3e3e3] bg-white p-[calc(12*var(--u))]">
          {[{ ...link, id: `${link.id}-self`, label: `All ${link.label.replace(/^All /, "")}`, children: undefined }, ...link.children].map((c) => (
            <li key={c.id}>
              <a
                href={c.href}
                className={cn(T.body6, "block whitespace-nowrap rounded-[200px] px-[calc(12*var(--u))] py-[calc(6*var(--u))] text-[#121212]/80 hover:bg-[#121212]/5 hover:text-[#121212]")}
              >
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * What the phone's menu button opens — not in the kit, designed from it.
 *
 * A full-screen sheet, like the collection's filters. Its top row is the phone
 * header exactly (wordmark at 24, 94 tall), with the menu button's place taken
 * by a close button, so opening the menu changes nothing but the one glyph
 * under your thumb. Then the search pill at the buttons' 50; then the main
 * menu in Heading 4 on the section rule — the size the kit gives "Trending",
 * big enough to hit without aiming — each parent opening its children in
 * Body 4 with the kit's chevron. Then the three icons as words, then the
 * strip's links and the language and currency in the strip's own small type.
 */
function Drawer({
  data,
  main,
  utility,
  onClose,
}: {
  data: Record<string, unknown>;
  main: LoomLink[];
  utility: LoomLink[];
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  const [opened, setOpened] = useState<string | null>(null);

  useEffect(() => {
    close.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Menu" data-m="drawer" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-white lg:hidden">
      <div className="mx-auto flex w-full flex-col md:w-[calc(1440*var(--u))]">
        <div className="flex h-[calc(94*var(--u))] shrink-0 items-center px-[calc(24*var(--u))] pb-[calc(24*var(--u))] pt-[calc(40*var(--u))] md:h-[calc(80*var(--u))] md:px-[calc(60*var(--u))] md:py-0">
          <a href="/loom" className="whitespace-nowrap text-[max(calc(24*var(--u)),19.2px)] font-extrabold leading-[max(calc(30*var(--u)),24px)] text-black">
            {str(data, "logoText")}
          </a>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="ml-auto flex h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)] items-center justify-center text-black"
          >
            {/* The menu glyph's three 16px bars, two of them crossed. */}
            <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-[calc(32*var(--u))] px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))]">
          {on(data, "showSearch") && <SearchField placeholder={str(data, "searchPlaceholder")} big />}

          <nav aria-label="Main">
            <ul>
              {main.map((l) => {
                const isOpen = opened === l.id;
                return (
                  <li key={l.id} className={LOOM_RULE}>
                    {l.children?.length ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpened(isOpen ? null : l.id)}
                          className={cn(T.h4, "flex w-full items-center justify-between py-[calc(20*var(--u))] text-left text-[#121212]")}
                        >
                          {l.label}
                          <LoomChevronDown className={cn("h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)] transition-transform duration-200", isOpen && "rotate-180")} />
                        </button>
                        {isOpen && (
                          <ul className="flex flex-col gap-[calc(16*var(--u))] pb-[calc(24*var(--u))]">
                            <li>
                              <a href={l.href} className={cn(T.body4, "text-[#121212]")}>
                                All {l.label.replace(/^All /, "")}
                              </a>
                            </li>
                            {l.children.map((c) => (
                              <li key={c.id}>
                                <a href={c.href} className={cn(T.body4, "text-[#121212]/80")}>
                                  {c.label}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <a href={l.href} className={cn(T.h4, "block py-[calc(20*var(--u))] text-[#121212]")}>
                        {l.label}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          <ul className={cn("flex flex-col gap-[calc(16*var(--u))] pt-[calc(24*var(--u))]", LOOM_RULE)}>
            {[
              on(data, "showWishlist") && { href: "/loom/wishlist", label: "Wishlist", Icon: LoomHeartOutline },
              on(data, "showAccount") && { href: "/loom/account/sign-in", label: "Account", Icon: LoomUserIcon },
              on(data, "showCart") && { href: "/loom/cart", label: "Cart", Icon: LoomCartIcon },
            ]
              .filter((x): x is { href: string; label: string; Icon: typeof LoomCartIcon } => !!x)
              .map(({ href, label, Icon }) => (
                <li key={label}>
                  <a href={href} className={cn(T.body6, "flex items-center gap-[calc(12*var(--u))] text-[#121212]")}>
                    <Icon className="h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)] text-[#2e3a59]" />
                    {label}
                  </a>
                </li>
              ))}
          </ul>

          <div className="flex flex-col gap-[calc(16*var(--u))]">
            <ul className="flex flex-wrap gap-x-[calc(24*var(--u))] gap-y-[calc(12*var(--u))]">
              {utility.map((l) => (
                <li key={l.id}>
                  <a href={l.href} className={cn(T.small, "text-black/50")}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className={cn(T.small, "text-black/50")}>
              {[str(data, "languageLabel"), str(data, "currencyLabel")].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

