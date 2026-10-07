import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomTemplateView } from "@/components/loom/template";
import { ACCOUNT } from "@/components/loom/templates";
import { demoContext } from "@/components/loom/demo";

export const metadata: Metadata = { title: "Your account — Loom reference build" };

/** This page is its template, drawn — what it is made of is in components/loom/templates.ts. */
export default function LoomAccountPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }]} current="Account" />
      <LoomTemplateView template={ACCOUNT} ctx={demoContext()} />
    </LoomShell>
  );
}
