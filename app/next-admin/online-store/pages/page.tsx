import { Plus } from "lucide-react";
import { Page } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { PagesBoard } from "@/components/next-admin/pages-board";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Pages" };

export default function PagesPage() {
  return (
    <Page title="Pages" crumbs={[{ label: "Online Store", href: `${A}/online-store` }]} sub="About, guides, lookbooks and your policies. Each built from sections in the customiser." actions={<Act kind="primary" msg="A new page opens in the customiser"><Plus /> Add page</Act>}>
      <PagesBoard />
    </Page>
  );
}
