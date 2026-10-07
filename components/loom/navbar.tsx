/**
 * The utility strip — "Navbar" in the file, 1440x64.
 *
 * Two groups, and the left one is easy to lose: locale and currency, 36
 * apart. The four links on the right are 40 apart. Both are 13/16 Inter
 * Medium at fifty per cent black — muting here is opacity, not a grey, which
 * is true of every soft text in this kit.
 *
 * The hairline below is black at five per cent and is the frame's own
 * single-sided border, not a box.
 *
 * Desktop only. The 375 screen has no strip at all — its header is the
 * wordmark and a menu button, so these four links live behind that button
 * and in the footer, which already carries all of them.
 */
const LOCALE = ["English", "Dollar"];
const LINKS = ["Tracking Package", "FAQ", "About Us", "Contact Us"];

export function LoomNavbar() {
  return (
    <div className="hidden h-[calc(64*var(--u))] items-center justify-between border-b border-black/5 px-[calc(60*var(--u))] md:flex">
      <div className="flex items-center gap-[calc(36*var(--u))]">
        {LOCALE.map((t) => (
          <button
            key={t}
            type="button"
            className="text-[max(calc(13*var(--u)),11px)] font-medium leading-[max(calc(16*var(--u)),12.8px)] text-black/50"
          >
            {t}
          </button>
        ))}
      </div>
      <div data-m="navbar-links" className="flex items-center gap-[calc(40*var(--u))]">
        {LINKS.map((t) => (
          <a key={t} href="#" className="text-[max(calc(13*var(--u)),11px)] font-medium leading-[max(calc(16*var(--u)),12.8px)] text-black/50">
            {t}
          </a>
        ))}
      </div>
    </div>
  );
}
