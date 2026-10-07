import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomCart } from "@/components/loom/cart/cart";
import { DEMO_LINES } from "@/components/loom/cart/lines";

export const metadata: Metadata = { title: "Your cart — Loom reference build" };


/** The cart — the third page the kit does not draw. The design is on LoomCart. */
export default function LoomCartPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }]} current="Cart" />
      <LoomCart initial={DEMO_LINES} />
    </LoomShell>
  );
}
