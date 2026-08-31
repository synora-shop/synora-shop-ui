/**
 * The drawing that stands in for a picture nobody has uploaded yet.
 *
 * A product with no photo rendered as a plain coloured rectangle, which reads
 * as a broken image rather than an empty slot. The difference matters most on
 * the day a merchant opens their shop, when nothing has a photo yet and the
 * whole page is those rectangles.
 *
 * These drawings existed before, for Shopify themes, and were deleted with the
 * Liquid layer they served. They belong to the storefront rather than to any
 * theme, so they come back here.
 *
 * Two rules worth keeping from the first time:
 *
 * 1. **The kind changes the drawing.** A row of six product cards showing one
 *    identical shape reads as one repeated mistake.
 * 2. **The colours are fixed, never inherited.** Drawn in the surrounding text
 *    colour, a placeholder inside a dark banner is dark on dark, which is a
 *    blank page a merchant cannot explain.
 */

const GROUND = "#e7e7ec";
const INK = "#b0b0bd";

export type PlaceholderKind = "product" | "collection" | "article" | "image" | "logo";

const stroke = (d: string, w = 6) => (
  <path
    d={d}
    fill="none"
    stroke={INK}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

/** Drawn in a 525 square, then laid across a wider canvas below. */
const DRAWINGS: Record<PlaceholderKind, (variant: number) => React.ReactNode> = {
  product: (v) =>
    v % 2 === 0 ? (
      <>
        {stroke("M262 120a22 22 0 0 1 22 22c0 14-22 18-22 32")}
        {stroke("M225 190h74l70 60-38 26v130H203V276l-38-26z")}
      </>
    ) : (
      <>
        {stroke("M170 215h185l24 175H152z")}
        {stroke("M212 215v-30a50 50 0 0 1 101 0v30")}
      </>
    ),
  collection: () => (
    <>
      {stroke("M150 205h225v190H150z")}
      {stroke("M182 170h161", 5)}
      {stroke("M205 142h115", 5)}
      {stroke("M168 372l70-70 52 50 40-34 45 40", 5)}
    </>
  ),
  article: () => (
    <>
      {stroke("M140 155h245v215H140z", 7)}
      {stroke("M175 205h140", 5)}
      {stroke("M175 248h175", 5)}
      {stroke("M175 288h175", 5)}
      {stroke("M175 328h95", 5)}
    </>
  ),
  image: () => (
    <>
      {stroke("M105 150h315v225H105z", 7)}
      <circle cx={180} cy={212} r={22} fill="none" stroke={INK} strokeWidth={6} />
      {stroke("M130 340l85-95 70 78 55-45 85 62")}
    </>
  ),
  logo: () => (
    <>
      {stroke("M132 232h260", 14)}
      {stroke("M172 292h180", 10)}
    </>
  ),
};

/**
 * A placeholder that fills whatever box it is given.
 *
 * The motif is drawn three times across a 2:1 canvas rather than once on a
 * square one. The slot is sized by its container and the drawing covers it the
 * way a photograph would, so a single motif on a square canvas would be
 * magnified until one stroke filled a wide banner. Repeating a smaller one
 * means every crop, from a square card to a full width hero, lands on
 * something recognisable.
 *
 * `variant` only needs to differ between neighbours; passing an index is enough.
 */
export function ImagePlaceholder({
  kind = "image",
  variant = 0,
  className,
}: {
  kind?: PlaceholderKind;
  variant?: number;
  className?: string;
}) {
  const draw = DRAWINGS[kind] ?? DRAWINGS.image;

  return (
    <svg
      className={className}
      role="presentation"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1050 525"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      data-placeholder={kind}
    >
      <rect width={1050} height={525} fill={GROUND} />
      {[175, 525, 875].map((cx, i) => (
        <g key={cx} transform={`translate(${cx - 157.5} 105) scale(0.6)`}>
          {draw(variant + i)}
        </g>
      ))}
    </svg>
  );
}
