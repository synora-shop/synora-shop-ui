import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomCollection } from "@/components/loom/collection/collection";

export const metadata: Metadata = { title: "Shoes — Loom reference build" };

/**
 * The collection page — the second page the kit does not draw. The design and
 * its reasons are on LoomCollection.
 */
export default function LoomCollectionPage() {
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }]} current="Shoes" />
      <LoomCollection />
    </LoomShell>
  );
}
