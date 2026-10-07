import {
  LoomCartIcon,
  LoomChevronDown,
  LoomHeartOutline,
  LoomMenuIcon,
  LoomSearchIcon,
  LoomUserIcon,
} from "@/components/loom/icons";

/**
 * The shop's own row — "Navigation" in the file, 1440x80.
 *
 * Absolutely positioned in Figma, at x=60, 245 and 1263, and rebuilt as a
 * flex row because those positions *are* a flex row: the wordmark at the 60px
 * gutter, the search group 24 after it, the icon cluster ending at 1380 —
 * 1440 less the same gutter. Copying coordinates would be exact at 1440 and
 * broken at every other width.
 *
 * The category items hug: label, 8, then a 24px chevron. The file's stored
 * widths for two of the three are stale (they record the label alone, with
 * the chevron left at a position copied from a sibling), and "All Category"
 * is the one with fresh numbers — 116 = 84 + 8 + 24, chevron at 92. That is
 * the layout the design means, so that is what is built.
 *
 * On the 375 screen it is 94 tall — 40 above, 24 below and at either side —
 * holding only the wordmark and a 24px menu button. Search, the categories and
 * the three icons are not on the phone screen at all; what the menu opens is
 * not drawn in the kit either, so the button is the file's and the drawer
 * behind it is a design still to do.
 *
 * Between 768 and 1023 the desktop row is drawn scaled down, and the three
 * category links do not fit beside the search field at that size — so they
 * give way to the same menu button the phone has, and come back at 1024.
 */
const CATEGORIES = ["All Category", "Gift Cards", "Special Event"];

export function LoomNavigation() {
  return (
    <div className="flex h-[calc(94*var(--u))] items-center px-[calc(24*var(--u))] pb-[calc(24*var(--u))] pt-[calc(40*var(--u))] md:h-[calc(80*var(--u))] md:px-[calc(60*var(--u))] md:py-0">
      {/* The width is explicit, and deliberately so. Figma gives this text box
          161px; the same string in the same face measures 159.33 in a
          browser, and the search group is positioned after it — so without
          the box the field lands 1.67px left of the design and everything
          after inherits the error. */}
      <a
        href="#"
        data-m="nav-wordmark"
        className="min-w-[calc(161*var(--u))] whitespace-nowrap text-[max(calc(24*var(--u)),19.2px)] font-extrabold leading-[max(calc(30*var(--u)),24px)] tracking-normal text-black"
      >
        ECOMMERCE
      </a>

      <div className="ml-[calc(24*var(--u))] hidden items-center gap-[calc(40*var(--u))] md:flex">
        {/* 312x34, radius 2000 so it is a true pill, outlined #e3e3e3 — a
            lighter hairline than the #dddddd the buttons use. That is the
            kit's own inconsistency, kept rather than reconciled. */}
        {/* A div, not a form. This page is a server component and a
            reference build — there is nothing to submit to, and an onSubmit
            here would force the whole header to the client for no behaviour. */}
        <div
          role="search"
          className="flex h-[max(calc(34*var(--u)),32px)] w-[calc(312*var(--u))] items-center justify-between rounded-[2000px] border border-[#e3e3e3] px-[calc(20*var(--u))]"
        >
          <input
            type="search"
            placeholder="Search here"
            aria-label="Search"
            className="w-full bg-transparent text-[max(calc(13*var(--u)),11px)] leading-[max(calc(18*var(--u)),14.4px)] text-[#121212] outline-none placeholder:text-[#737b8b]"
          />
          <LoomSearchIcon className="h-[max(calc(20*var(--u)),16px)] w-[max(calc(20*var(--u)),16px)] shrink-0 text-[#2e3a59] opacity-50" />
        </div>

        <nav data-m="nav-categories" className="hidden items-center lg:flex gap-[calc(40*var(--u))]">
          {CATEGORIES.map((c) => (
            <a
              key={c}
              href="#"
              className="flex h-[calc(34*var(--u))] items-center gap-[calc(8*var(--u))] text-[max(calc(14*var(--u)),11.2px)] font-semibold leading-[max(calc(16*var(--u)),12.8px)] text-black/80"
            >
              {c}
              <LoomChevronDown className="h-[calc(24*var(--u))] w-[calc(24*var(--u))]" />
            </a>
          ))}
        </nav>
      </div>

      {/* 117x24, gap 24, bottom-aligned — which is why the 21px cart sits 3px
          lower than the two 24px glyphs beside it. */}
      <div className="ml-auto hidden items-end gap-[calc(24*var(--u))] text-[#2e3a59] md:flex">
        <a href="#" aria-label="Wishlist">
          <LoomHeartOutline className="h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)]" />
        </a>
        <a href="#" aria-label="Account">
          <LoomUserIcon className="h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)]" />
        </a>
        <a href="#" aria-label="Cart">
          <LoomCartIcon className="h-[max(calc(21*var(--u)),17.5px)] w-[max(calc(21*var(--u)),17.5px)]" />
        </a>
      </div>

      <button type="button" aria-label="Menu" className="ml-auto text-black md:ml-[calc(24*var(--u))] lg:hidden">
        <LoomMenuIcon className="h-[max(calc(24*var(--u)),20px)] w-[max(calc(24*var(--u)),20px)]" />
      </button>
    </div>
  );
}
