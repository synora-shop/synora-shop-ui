import { cn } from "@/lib/utils";
import { kt } from "@/components/kite/type";
import type { KitProduct } from "@/lib/themes/kit";
import { WHOLE, isFilePhoto } from "@/components/kite/assets";

/** The file's arrow after "Add to cart": three 1.5 strokes, 10 square — Vector 16. */
export function KiteArrow({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="miter" className={cn("h-[calc(10*var(--u))] w-[calc(10*var(--u))] overflow-visible", className)}>
      <path d="M0 0V10H10M0 10 10 0" />
    </svg>
  );
}

/**
 * A piece — "Frame 38" in the file: the photograph, then right-aligned, the
 * blurb (SF Pro Light 16, 325 wide), then the title and price at the left
 * (SF Pro Light 20 capitals, 8 apart) and "Add to cart" with its arrow at the
 * right, on the card's bottom line. 24 between photograph and words, 32
 * under them, and a 1px rule along the bottom.
 */
export function KitePieceCard({
  product,
  photoHeight,
  addLabel,
  className,
  style,
  blurb = "right",
}: {
  product: KitProduct & { priceText: string };
  photoHeight: number;
  addLabel: string;
  className?: string;
  style?: React.CSSProperties;
  /**
   * The file's two cards: on the home page the blurb is 325 wide at the
   * right, the row straight under it; in the account it is the card's width
   * at the left, 32 above the row.
   */
  blurb?: "right" | "full";
}) {
  return (
    <article style={style} className={cn("flex flex-col gap-[calc(24*var(--u))] pb-[calc(32*var(--u))] shadow-[inset_0_-1px_0_#f4f3f1]", className)}>
      <a href={product.href} className="relative block w-full overflow-hidden" style={{ height: `calc(${photoHeight}*var(--u))` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.src} alt={product.title} className={cn("absolute inset-0 h-full w-full", isFilePhoto(product.src) ? "object-cover" : WHOLE)} />
      </a>
      <div className={cn("flex flex-col items-end", blurb === "full" && "gap-[calc(32*var(--u))]")}>
        {product.blurb ? (
          <p {...kt("sans", 16)} className={cn(kt("sans", 16).className, blurb === "full" ? "w-full" : "w-[calc(325*var(--u))] text-right")}>
            {product.blurb}
          </p>
        ) : null}
        <div className="flex w-full items-end justify-between">
          <div className="flex flex-col gap-[calc(8*var(--u))]">
            <a href={product.href} {...kt("sans", 20)} className={cn(kt("sans", 20).className, "uppercase")}>
              {product.title}
            </a>
            <p {...kt("sans", 20)} className={cn(kt("sans", 20).className, "uppercase")}>
              {product.priceText}
            </p>
          </div>
          <a href={product.href} className="flex items-center gap-[calc(8*var(--u))]">
            <span {...kt("sans", 20)} className={cn(kt("sans", 20).className, "uppercase")}>
              {addLabel}
            </span>
            <KiteArrow />
          </a>
        </div>
      </div>
    </article>
  );
}
