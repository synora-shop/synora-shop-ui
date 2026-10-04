import { Heart, Search, ShoppingCart, User } from "lucide-react";

const CATEGORIES = ["All category", "Gift Cards", "Special Event"];

/**
 * The shop's own row — Navigation in the file, 1440x80.
 *
 * Not auto-layout in Figma: its three groups are placed absolutely at x=60,
 * 245 and 1263. Rebuilt as a flex row because the positions are consistent
 * with one — logo at the 60px gutter, the search group 24px after it, icons
 * ending at 1380, which is 1440 less the same gutter. Reproducing absolute
 * coordinates would be exact at 1440 and broken at every other width.
 *
 * The search field is the signature: 312x34, radius 2000 so it is a true
 * pill, outlined #e3e3e3 — a lighter hairline than the #ddd the buttons use,
 * which is the kit's own inconsistency and is kept rather than tidied.
 *
 * Icons are lucide stand-ins. The file's own glyphs live in binary path
 * blobs that this build does not yet decode, so these are the one knowingly
 * approximate thing on the page.
 */
export function LoomNavigation() {
  return (
    <div className="flex h-[80px] items-center px-[60px]">
      {/* The width is explicit, and that is deliberate. Figma gives this text
          box 161px; the same string in the same face measures 159.33 in a
          browser, and the next group is positioned after it — so without the
          box the search field lands 1.67px left of where the design puts it,
          and everything after inherits the error. Matching the box rather
          than the glyph run is what keeps the row's geometry exact. */}
      <a
        href="#"
        className="w-[161px] text-[24px] font-extrabold leading-[30px] tracking-normal text-black"
      >
        ECOMMERCE
      </a>

      <div className="ml-[24px] flex items-center gap-[40px]">
        <div className="flex h-[34px] w-[312px] items-center justify-between rounded-[2000px] border border-[#e3e3e3] px-[20px]">
          <span className="text-[13px] leading-[18px] text-[#737b8b]">Search here</span>
          <Search className="h-[20px] w-[20px] opacity-50" strokeWidth={1.5} />
        </div>

        <nav className="flex items-center gap-[40px]">
          {CATEGORIES.map((c) => (
            <a
              key={c}
              href="#"
              className="flex h-[34px] items-center text-[14px] font-semibold leading-[22px] text-black/80"
            >
              {c}
            </a>
          ))}
        </nav>
      </div>

      <div className="ml-auto flex items-center gap-[24px] text-[#2e3a59]">
        <Heart className="h-[24px] w-[24px]" strokeWidth={1.6} />
        <User className="h-[24px] w-[24px]" strokeWidth={1.6} />
        <ShoppingCart className="h-[21px] w-[21px]" strokeWidth={1.6} />
      </div>
    </div>
  );
}
