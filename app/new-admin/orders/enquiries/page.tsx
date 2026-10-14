import { PageHeader, StatStrip } from "@/components/new-admin/ui";
import { Enquiries } from "@/components/new-admin/enquiries";

export const metadata = { title: "Enquiries" };

/** Requests from bulk and made-to-order products, before they are orders. */
export default function EnquiriesPage() {
  return (
    <>
      <PageHeader icon="orders" tone="iris" title="Enquiries" sub="Bulk and made-to-order requests. Answer, quote, and turn them into orders." />
      <StatStrip stats={[{ label: "New", value: "2", delta: "Answer within a day" }, { label: "Quoted", value: "1" }, { label: "Won this month", value: "1", delta: "60 pieces" }, { label: "Usually answered in", value: "3 hours" }]} />
      <Enquiries />
    </>
  );
}
