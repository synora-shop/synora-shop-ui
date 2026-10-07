import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomTemplateView } from "@/components/loom/template";
import { WISHLIST } from "@/components/loom/templates";
import { demoContext } from "@/components/loom/demo";

export const metadata: Metadata = { title: "Wishlist — Loom reference build" };

/** This page is its template, drawn — what it is made of is in components/loom/templates.ts. */
export default function LoomWishlistPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }]} current="Wishlist" />
      <LoomTemplateView template={WISHLIST} ctx={demoContext()} />
    </LoomShell>
  );
}
