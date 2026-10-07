import type { Metadata } from "next";
import { LoomFrame } from "@/components/loom/frame";

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
  return <LoomFrame>{children}</LoomFrame>;
}
