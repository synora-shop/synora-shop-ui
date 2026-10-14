import { PageHeader } from "@/components/new-admin/ui";
import { PagesBoard } from "@/components/new-admin/pages-board";

export const metadata = { title: "Pages" };

export default function PagesPage() {
  return (
    <>
      <PageHeader icon="app" tone="sky" title="Pages" sub="About, guides, lookbooks and your policies. Each built from sections in the customiser." />
      <PagesBoard />
    </>
  );
}
