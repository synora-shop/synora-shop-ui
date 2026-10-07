import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomCheckout } from "@/components/loom/checkout/checkout";
import { DEMO_LINES } from "@/components/loom/cart/lines";

export const metadata: Metadata = { title: "Checkout — Loom reference build" };

/** Checkout — the fourth page the kit does not draw. The design is on LoomCheckout. */
export default function LoomCheckoutPage() {
  return (
    <LoomShell checkout>
      <LoomCheckout lines={DEMO_LINES} />
    </LoomShell>
  );
}
