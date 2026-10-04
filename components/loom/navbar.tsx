const UTILITY = ["Tracking Package", "FAQ", "About Us", "Contact Us"];

/**
 * The utility strip — Navbar in the file, 1440x64.
 *
 * Every number here is read rather than chosen: 64 tall, 60 of side padding,
 * 36 between the two left items and 40 between the four right ones, 13/16
 * Inter Medium, and a hairline underneath that is black at five per cent
 * rather than a grey. That last one matters — a solid grey of the same
 * apparent weight goes wrong the moment anything sits behind it.
 */
export function LoomNavbar() {
  return (
    <div className="flex h-[64px] items-center justify-between border-b border-black/5 px-[60px]">
      <div className="flex items-center gap-[36px]">
        {["English", "Dollar"].map((t) => (
          <span key={t} className="text-[13px] font-medium leading-[16px] text-black/50">
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-[40px]">
        {UTILITY.map((t) => (
          <a key={t} href="#" className="text-[13px] font-medium leading-[16px] text-black/50">
            {t}
          </a>
        ))}
      </div>
    </div>
  );
}
