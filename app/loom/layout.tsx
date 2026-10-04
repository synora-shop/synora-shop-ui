import type { Metadata } from "next";

export const metadata: Metadata = { title: "Loom — reference build" };

/**
 * A bare shell for the Loom reference build.
 *
 * Deliberately nothing of this platform in it: no header, no footer, no
 * theme tokens, no shop. The point of this route is to reproduce the design
 * exactly, and anything inherited is something that could be mistaken for the
 * design's own. The components are React and Tailwind in the same stack as
 * the rest of the app, so they port afterwards rather than being thrown away.
 *
 * Measurements are written as arbitrary values — `h-[64px]`, `gap-[36px]` —
 * on purpose. The scale steps are a different design's rhythm; this one's
 * numbers come out of the file and are kept literal so they can be checked
 * against it.
 */
export default function LoomLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white font-[family-name:var(--font-inter)] text-[#121212]">{children}</div>;
}
