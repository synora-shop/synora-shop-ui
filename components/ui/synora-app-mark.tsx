/**
 * The "synora app" lockup that sits in the middle of the admin's top bar.
 *
 * Not the Synora Digitals wordmark, which names the company and belongs on the
 * marketing site. This names the thing a merchant is standing in.
 *
 * The badge is a white block with the word knocked out of it, so "app" is
 * painted in whatever colour the bar is. That is why the colour is a prop
 * rather than a constant: on a restaurant's purple bar the badge reads purple,
 * on a shop's maroon bar it reads maroon, and neither needs its own asset.
 *
 * Lowercase and tightly tracked, following the drawing. Set in the interface
 * font rather than shipping a face for three words — a webfont for a logo this
 * small costs more in load than it returns in fidelity.
 */
export function SynoraAppMark({
  /** The bar's colour, which the badge word is cut out of. */
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex select-none items-center gap-1.5 ${className ?? ""}`}
      // One accessible name for the pair, so a screen reader says "synora app"
      // rather than spelling out a word and a badge as separate things.
      role="img"
      aria-label="synora app"
    >
      <span
        aria-hidden
        className="text-[17px] font-medium lowercase leading-none tracking-[-0.02em] text-white"
      >
        synora
      </span>
      <span
        aria-hidden
        className="rounded-[7px] bg-white px-1.5 py-[3px] text-[17px] font-medium lowercase leading-none tracking-[-0.02em]"
        style={{ color }}
      >
        app
      </span>
    </span>
  );
}
