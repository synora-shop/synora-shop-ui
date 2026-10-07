import { Inter } from "next/font/google";

/**
 * Inter with its optical-size axis, which is the Inter Figma draws.
 *
 * Figma sets Inter at the optical size that matches the font size, so a 60px
 * heading is drawn from the tighter display cut. The app-wide Inter in
 * app/layout.tsx loads weight only, and without `opsz` every display line runs
 * about 5% wide: "Explore by" measures 269px against the 256px box the file
 * wraps it in, so the title broke onto three lines and pushed the rest of the
 * page 65px down. With the axis it measures 244 and wraps where the file does.
 *
 * Loaded here rather than changed globally on purpose. The storefront's Inter
 * is what every live shop is wearing, and switching optical sizing on for all
 * of them is a visible change to their headings — a decision of its own when
 * Loom is ported, not a side effect of the reference build. docs/LOOM.md
 * records it.
 */
const loomInter = Inter({
  variable: "--font-loom",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
});

/**
 * Loom's frame: everything a Loom page sits inside, on the reference pages
 * and on a real storefront alike.
 *
 * The font (above), a size container so the page's unit can be worked out
 * from its width in `cqw` rather than `vw` — `100vw` counts the scrollbar, and
 * on a 1440 Windows screen would draw the page 15px wider than the window —
 * and `<main>`, where that unit is set:
 *
 *   under 768   the phone design, scaled to the screen: --u = width / 375,
 *               capped at 1.2px, so 320–450 is the 375 design at its own
 *               proportions and anything wider centres a 450 column
 *   768 and up  the desktop design, scaled the same way: --u = width / 1440,
 *               capped at 1px, so 1440 is exact and wider screens centre it
 *
 * At 375 and at 1440 --u is exactly 1px and the page is the file.
 */
export function LoomFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${loomInter.variable} min-h-screen bg-white [container-type:inline-size] font-[family-name:var(--font-loom)] text-[#121212] [font-optical-sizing:auto]`}
    >
      <main className="mx-auto w-[calc(375*var(--u))] [--u:min(calc(100cqw/375),1.2px)] md:w-[calc(1440*var(--u))] md:[--u:min(calc(100cqw/1440),1px)]">
        {children}
      </main>
    </div>
  );
}
