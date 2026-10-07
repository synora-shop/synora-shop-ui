import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomTemplateView } from "@/components/loom/template";
import { CHECKOUT } from "@/components/loom/templates";
import { demoContext } from "@/components/loom/demo";

export const metadata: Metadata = { title: "Checkout — Loom reference build" };

/** This page is its template, drawn — what it is made of is in components/loom/templates.ts. */
export default function LoomCheckoutPage() {
  return (
    <LoomShell checkout>
      <LoomTemplateView template={CHECKOUT} ctx={demoContext()} />
    </LoomShell>
  );
}
