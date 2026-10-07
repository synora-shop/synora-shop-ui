import type { Metadata } from "next";
import { LoomShell } from "@/components/loom/shell";
import { LoomBreadcrumb } from "@/components/loom/breadcrumb";
import { LoomTemplateView } from "@/components/loom/template";
import { SEARCH } from "@/components/loom/templates";
import { demoContext } from "@/components/loom/demo";

export const metadata: Metadata = { title: "Search — Loom reference build" };

/** The search page: its template, drawn with the query from the address. */
export default async function LoomSearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 100) ?? "";
  return (
    <LoomShell>
      <LoomBreadcrumb trail={[{ label: "Home", href: "/loom" }]} current="Search" />
      <LoomTemplateView template={SEARCH} ctx={demoContext({ query })} />
    </LoomShell>
  );
}
