import { cn } from "@/lib/utils";
import { str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { KiteSectionHead } from "@/components/kite/section-head";
import { KitePieceCard } from "@/components/kite/piece-card";
import { kiteMoney } from "@/components/kite/money";

/**
 * Limited collection — "MacBook Pro 16" - 5" in the file, 1728x1117.
 *
 * The bar (XVI · LIMITED COLLECTION), the paragraph at 32,333 (366 wide),
 * and two pieces staggered as the file sets them: 439 wide at 786,333 and
 * 1257,177, each a 419-high photograph over its words. Behind everything the
 * shop's name in the serif at 400px, 6% opaque, at 6,517.
 *
 * The file draws no phone version of this screen, so on a phone it is not
 * shown (decided 8 October: only what is drawn is built).
 */
export function KiteLimited({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const pieces = ctx.products.slice(0, 2);
  const at = [
    { x: 786, y: 333 },
    { x: 1257, y: 177 },
  ];
  return (
    <section data-k="limited" className="relative hidden h-[calc(1117*var(--u))] overflow-hidden md:block">
      {str(data, "backdrop") ? (
        // SVG text held to the file's box (1721 wide, baseline 452 of 600, as Figma laid it):
        // the stand-in serif is ~3% wider than Hiragino, and as HTML the word
        // ran past the screen edge and lost its last letter. textLength keeps
        // the composition the file's whatever the face's own widths.
        <svg
          aria-hidden
          viewBox="0 0 1722 600"
          className="pointer-events-none absolute left-[calc(6*var(--u))] top-[calc(517*var(--u))] h-[calc(600*var(--u))] w-[calc(1722*var(--u))] opacity-[0.06]"
        >
          <text x="0" y="452" textLength="1721.09" lengthAdjust="spacingAndGlyphs" fill="#f4f3f1" style={{ font: "400 400px var(--kite-serif)" }}>
            {str(data, "backdrop")}
          </text>
        </svg>
      ) : null}
      <KiteSectionHead numeral={str(data, "numeral")} title={str(data, "title")} />
      {str(data, "text") ? (
        <p {...kt("sans", 16)} className={cn(kt("sans", 16).className, "absolute left-[calc(32*var(--u))] top-[calc(333*var(--u))] w-[calc(366*var(--u))]")}>
          {str(data, "text")}
        </p>
      ) : null}
      {pieces.map((p, i) => (
        <KitePieceCard
          key={p.id}
          product={{ ...p, priceText: kiteMoney(p.price, ctx.currency) }}
          photoHeight={419}
          addLabel={str(data, "addLabel")}
          className="absolute w-[calc(439*var(--u))]"
          style={{ left: `calc(${at[i].x}*var(--u))`, top: `calc(${at[i].y}*var(--u))` }}
        />
      ))}
    </section>
  );
}
