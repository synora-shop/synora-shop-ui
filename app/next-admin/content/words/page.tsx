import { Page } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { Words } from "@/components/next-admin/words";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Store wording" };

export default function WordsPage() {
  return (
    <Page title="Store wording" crumbs={[{ label: "Content", href: `${A}/content` }]} sub="Every phrase your store says. Change any of it, in English or Urdu, without touching the theme." actions={<Act kind="primary" msg="Wording saved">Save</Act>}>
      <Words />
    </Page>
  );
}
