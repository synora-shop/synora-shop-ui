import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomTemplateView } from "@/components/loom/template";
import { PRODUCT } from "@/components/loom/templates";
import { demoContext } from "@/components/loom/demo";

export const metadata: Metadata = { title: "Skateboard Shoe — Loom reference build" };

/** This page is its template, drawn — what it is made of is in components/loom/templates.ts. */
export default function LoomProductPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }, { label: "Shoes", href: "/loom/collection" }]} current="Skateboard Shoe" />
      <LoomTemplateView template={PRODUCT} ctx={demoContext()} />
    </LoomShell>
  );
}
