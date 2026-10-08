import { kt } from "@/components/kite/type";

/**
 * The bar that opens four of the home page's screens — "Frame 33" in the
 * file: a numeral at the left and the section's name at the right, both SF
 * Pro Light 32 inside 32 of padding (102 high), then two 1px rules at 102
 * and 106. Desktop only: the phone screens that exist start without it.
 */
export function KiteSectionHead({ numeral, title }: { numeral: string; title: string }) {
  if (!numeral && !title) return null;
  return (
    <div className="relative hidden h-[calc(106*var(--u))] md:block">
      <div className="flex h-[calc(102*var(--u))] items-center justify-between px-[calc(32*var(--u))]">
        <p {...kt("sans", 32)}>{numeral}</p>
        <p {...kt("sans", 32)}>{title}</p>
      </div>
      <div aria-hidden className="absolute inset-x-0 top-[calc(101.5*var(--u))] h-px bg-[#f4f3f1]" />
      <div aria-hidden className="absolute inset-x-0 top-[calc(105.5*var(--u))] h-px bg-[#f4f3f1]" />
    </div>
  );
}
