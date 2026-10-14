import { Plus } from "lucide-react";
import { Button, PageHeader, Pill, pkr } from "@/components/new-admin/ui";
import { DataTable } from "@/components/new-admin/sort";

export const metadata = { title: "Draft orders" };

/** Orders the merchant builds by hand: a phone order, a WhatsApp order. */
const DRAFTS = [
  { id: "D14", customer: "Saima Butt", via: "WhatsApp", total: 17800, when: "Today, 1:10 pm", at: 3, status: "Invoice sent" },
  { id: "D13", customer: "Kiran Aslam", via: "Phone", total: 8900, when: "Yesterday", at: 2, status: "Open" },
  { id: "D12", customer: "Mahnoor Zia", via: "Instagram DM", total: 24400, when: "12 Oct", at: 1, status: "Completed" },
];

export default function DraftsPage() {
  return (
    <>
      <PageHeader icon="orders" tone="iris" title="Draft orders" sub="Orders you build yourself, for a customer who messaged or called." actions={<Button primary><Plus className="h-4 w-4" /> Create draft</Button>} />
      <DataTable
        cols={[
          { key: "id", label: "Draft" },
          { key: "customer", label: "Customer" },
          { key: "via", label: "Came in by" },
          { key: "when", label: "Created", numeric: true },
          { key: "total", label: "Total", align: "right", numeric: true },
          { key: "status", label: "Status" },
        ]}
        rows={DRAFTS.map((d) => ({
          id: d.id,
          by: { id: d.id, customer: d.customer, via: d.via, when: d.at, total: d.total, status: d.status },
          cells: {
            id: <b className="font-semibold">#{d.id}</b>,
            customer: d.customer,
            via: <span className="text-[#0a0a0a]/60">{d.via}</span>,
            when: <span className="text-[#0a0a0a]/60">{d.when}</span>,
            total: <b className="font-semibold">{pkr(d.total)}</b>,
            status: d.status === "Completed" ? <Pill tone="good">Completed</Pill> : d.status === "Open" ? <Pill tone="off">Open</Pill> : <Pill tone="info">Invoice sent</Pill>,
          },
        }))}
      />
    </>
  );
}
