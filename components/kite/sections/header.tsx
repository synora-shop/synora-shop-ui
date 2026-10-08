import { cn } from "@/lib/utils";
import { menu, on, route, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { KITE_ICON } from "@/components/kite/assets";

/**
 * The header — "MacBook Pro 16" - 4" and "Mobile | Home" in the file.
 *
 * Desktop (1728): the menu at 32,46 in a row with 32 between items, each
 * SF Pro Light 16 in capitals, an item with links under it followed by
 * lucide's chevron-down at 4; the name centred at y 32 in Khand Light 32;
 * search, account and bag, 20 square, at the right edge less 32, y 46, 32
 * apart. Two 1px rules in the ink at y 113 and 119; the page starts at 151.
 *
 * Phone (440): a 69-high bar — the menu glyph at 16,24.5, the name centred at
 * y 16 in Khand Light 24, the bag at the right less 16 — the rules at 69 and
 * 75, the page at 107. The file draws no menu panel; the glyph is drawn, and
 * what it opens is a decision still to be taken (docs/KITE.md).
 *
 * The icons are the file's own images (FIT into 20 square), not redrawn.
 */
export function KiteHeader({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const items = menu(data, "menu", ctx);
  const name = str(data, "logoText");
  const icon = "absolute h-[calc(20*var(--u))] w-[calc(20*var(--u))] object-contain";
  return (
    <header data-k="header" className="relative h-[calc(107*var(--u))] md:h-[calc(151*var(--u))]">
      {/* Menu — desktop only. */}
      <nav aria-label="Main" className="absolute left-[calc(32*var(--u))] top-[calc(46*var(--u))] hidden h-[calc(20*var(--u))] items-center gap-[calc(32*var(--u))] md:flex">
        {items.map((l) => (
          <a key={l.id} href={l.href} className="flex items-center gap-[calc(4*var(--u))]">
            <span {...kt("sans", 16)} className={cn(kt("sans", 16).className, "uppercase")}>
              {l.label}
            </span>
            {l.children?.length ? (
              <svg aria-hidden viewBox="0 0 20 20" className="h-[calc(20*var(--u))] w-[calc(20*var(--u))]" fill="none" stroke="currentColor" strokeWidth={1}>
                <path d="M5 7.5 10 12.5 15 7.5" />
              </svg>
            ) : null}
          </a>
        ))}
      </nav>

      {/* The name, centred. */}
      <a
        href={route(ctx, "home")}
        data-k="header-name"
        {...kt("khand", 24, 32)}
        className={cn(kt("khand", 24, 32).className, "absolute left-1/2 top-[calc(16*var(--u))] -translate-x-1/2 whitespace-nowrap md:top-[calc(32*var(--u))]")}
      >
        {name}
      </a>

      {/* Phone: the menu glyph left, the bag right. */}
      <button type="button" aria-label="Menu" className={cn(icon, "left-[calc(16*var(--u))] top-[calc(24.5*var(--u))] md:hidden")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={KITE_ICON.menu} alt="" className="h-full w-full object-contain" />
      </button>

      {/* Search, account, bag. */}
      <div className="absolute right-[calc(16*var(--u))] top-[calc(24.5*var(--u))] flex items-center gap-[calc(32*var(--u))] md:right-[calc(32*var(--u))] md:top-[calc(46*var(--u))]">
        {on(data, "showSearch") && (
          <a href={route(ctx, "search")} aria-label="Search" className="hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={KITE_ICON.search} alt="" className="h-[calc(20*var(--u))] w-[calc(20*var(--u))] object-contain" />
          </a>
        )}
        {on(data, "showAccount") && (
          <a href={route(ctx, "account")} aria-label="Account" className="hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={KITE_ICON.user} alt="" className="h-[calc(20*var(--u))] w-[calc(20*var(--u))] object-contain" />
          </a>
        )}
        <a href={route(ctx, "cart")} aria-label="Bag">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={KITE_ICON.bag} alt="" className="h-[calc(20*var(--u))] w-[calc(20*var(--u))] object-contain" />
        </a>
      </div>

      {/* The double rule: 1px each, centred on 69/75 (phone) and 113/119. */}
      <div aria-hidden className="absolute inset-x-0 top-[calc(68.5*var(--u))] h-px bg-[#f4f3f1] md:top-[calc(112.5*var(--u))]" />
      <div aria-hidden className="absolute inset-x-0 top-[calc(74.5*var(--u))] h-px bg-[#f4f3f1] md:top-[calc(118.5*var(--u))]" />
    </header>
  );
}
