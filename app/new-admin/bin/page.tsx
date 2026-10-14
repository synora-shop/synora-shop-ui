import { PageHeader } from "@/components/new-admin/ui";
import { Bin } from "@/components/new-admin/bin";

export const metadata = { title: "Bin" };

export default function BinPage() {
  return (
    <>
      <PageHeader icon="boxes" title="Bin" sub="Products, orders and pages you deleted, kept for 30 days in case you change your mind." />
      <Bin />
    </>
  );
}
