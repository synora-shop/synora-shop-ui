import { PageHeader } from "@/components/new-admin/ui";
import { Words } from "@/components/new-admin/words";

export const metadata = { title: "Store wording" };

export default function WordsPage() {
  return (
    <>
      <PageHeader icon="content" tone="mint" title="Store wording" sub="Every phrase your store says. Change any of it, in English or Urdu, without touching the theme." />
      <Words />
    </>
  );
}
