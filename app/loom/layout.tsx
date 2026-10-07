import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const metadata: Metadata = { title: "Loom — reference build" };

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
 * A bare shell for the Loom reference build.
 *
 * Deliberately nothing of this platform in it: no header, no footer, no
 * theme tokens, no shop. The point of this route is to reproduce the design
 * exactly, and anything inherited is something that could be mistaken for the
 * design's own. The components are React and Tailwind in the same stack as
 * the rest of the app, so they port afterwards rather than being thrown away.
 *
 * It is a size container so that `--u` (app/loom/page.tsx) can be worked out
 * from its width in `cqw` rather than from `vw` — `100vw` counts the
 * scrollbar, and on a 1440 Windows screen it would draw the page 15px wider
 * than the window.
 *
 * Measurements are written as the file's numbers — `calc(64*var(--u))` — on
 * purpose. The scale steps are a different design's rhythm; this one's
 * numbers come out of the file and are kept literal so they can be checked
 * against it.
 */
export default function LoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${loomInter.variable} min-h-screen bg-white [container-type:inline-size] font-[family-name:var(--font-loom)] text-[#121212] [font-optical-sizing:auto]`}
    >
      {children}
    </div>
  );
}
