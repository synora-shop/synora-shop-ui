import { Metrics, Page } from "@/components/next-admin/ui";
import { Enquiries } from "@/components/next-admin/enquiries";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Enquiries" };

/** Requests from bulk and made-to-order products, before they are orders. */
export default function EnquiriesPage() {
  return (
    <Page title="Enquiries" crumbs={[{ label: "Orders", href: `${A}/orders` }]} sub="Bulk and made-to-order requests. Answer, quote, and turn them into orders.">
      <Metrics items={[{ label: "New", value: "2", delta: "Answer within a day", down: true }, { label: "Quoted", value: "1" }, { label: "Won this month", value: "1", delta: "60 pieces" }, { label: "Usually answered in", value: "3 hours" }]} />
      <Enquiries />
    </Page>
  );
}
