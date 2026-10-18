import { Page } from "@/components/next-admin/ui";
import { Bin } from "@/components/next-admin/bin";

export const metadata = { title: "Bin" };

export default function BinPage() {
  return (
    <Page title="Bin" sub="Products, orders and pages you deleted, kept for 30 days in case you change your mind.">
      <Bin />
    </Page>
  );
}
