import { Plus } from "lucide-react";
import { Btn, Page, Status, T, pkr } from "@/components/next-admin/ui";
import { Table } from "@/components/next-admin/table";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Draft orders" };

/** Orders the merchant builds by hand: a phone order, a WhatsApp order. */
const DRAFTS = [
  { id: "D14", customer: "Saima Butt", via: "WhatsApp", total: 17800, when: "Today, 1:10 pm", at: 3, status: "Invoice sent" },
  { id: "D13", customer: "Kiran Aslam", via: "Phone", total: 8900, when: "Yesterday", at: 2, status: "Open" },
  { id: "D12", customer: "Mahnoor Zia", via: "Instagram DM", total: 24400, when: "12 Oct", at: 1, status: "Completed" },
];

export default function DraftsPage() {
  return (
    <Page title="Draft orders" crumbs={[{ label: "Orders", href: `${A}/orders` }]} sub="Orders you build yourself, for a customer who messaged or called." actions={<Btn kind="primary"><Plus /> Create draft</Btn>}>
      <Table
        views={["All", "Open", "Invoice sent", "Completed"]}
        search="Search drafts"
        cols={[
          { key: "id", label: "Draft" },
          { key: "customer", label: "Customer" },
          { key: "via", label: "Came in by" },
          { key: "when", label: "Created" },
          { key: "status", label: "Status" },
          { key: "total", label: "Total", right: true },
        ]}
        rows={DRAFTS.map((d) => ({
          id: d.id,
          views: [d.status],
          by: { id: d.id, customer: d.customer, via: d.via, when: d.at, total: d.total, status: d.status },
          cells: {
            id: <b className="font-semibold">#{d.id}</b>,
            customer: d.customer,
            via: <span className={T.muted}>{d.via}</span>,
            when: <span className={T.muted}>{d.when}</span>,
            status: <Status tone={d.status === "Completed" ? "good" : d.status === "Open" ? "off" : "info"}>{d.status}</Status>,
            total: <b className="font-semibold tabular-nums">{pkr(d.total)}</b>,
          },
        }))}
      />
    </Page>
  );
}
