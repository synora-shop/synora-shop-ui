import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomTemplateView } from "@/components/loom/template";
import { WISHLIST } from "@/components/loom/templates";
import { DEMO_MENUS } from "@/components/loom/demo-menus";
import { SHOES } from "@/components/loom/catalogue";

export const metadata: Metadata = { title: "Wishlist — Loom reference build" };

/** The wishlist page: its template, drawn. What it is made of is in templates.ts. */
export default function LoomWishlistPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }]} current="Wishlist" />
      <LoomTemplateView template={WISHLIST} ctx={{ menus: DEMO_MENUS, products: SHOES }} />
    </LoomShell>
  );
}
