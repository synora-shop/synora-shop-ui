import type { Metadata } from "next";
import { KiteFrame } from "@/components/kite/frame";

export const metadata: Metadata = { title: "Kite — reference", robots: { index: false } };

/** The reference build of Kite, from "KITE - Trümung" in Figmaa. See docs/KITE.md. */
export default function KiteLayout({ children }: { children: React.ReactNode }) {
  return <KiteFrame>{children}</KiteFrame>;
}
