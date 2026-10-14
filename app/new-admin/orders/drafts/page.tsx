import { Plus } from "lucide-react";
import { Button, PageHeader, Pill, pkr, td, th } from "@/components/new-admin/ui";

export const metadata = { title: "Draft orders" };

/** Orders the merchant builds by hand: a phone order, a WhatsApp order. */
const DRAFTS = [
  { id: "D14", customer: "Saima Butt", via: "WhatsApp", total: 17800, when: "Today, 1:10 pm", status: "Invoice sent" },
  { id: "D13", customer: "Kiran Aslam", via: "Phone", total: 8900, when: "Yesterday", status: "Open" },
  { id: "D12", customer: "Mahnoor Zia", via: "Instagram DM", total: 24400, when: "12 Oct", status: "Completed" },
];

export default function DraftsPage() {
  return (
    <>
      <PageHeader icon="orders" title="Draft orders" sub="Orders you build yourself, for a customer who messaged or called." actions={<Button primary><Plus className="h-4 w-4" /> Create draft</Button>} />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">
        <table className="w-full">
          <thead className="bg-[#fafafc]">
            <tr><th className={th}>Draft</th><th className={th}>Customer</th><th className={th}>Came in by</th><th className={th}>Created</th><th className={`${th} text-right`}>Total</th><th className={th}>Status</th></tr>
          </thead>
          <tbody className="divide-y divide-[#0d0d50]/[0.06]">
            {DRAFTS.map((d) => (
              <tr key={d.id}>
                <td className={`${td} font-semibold`}>#{d.id}</td>
                <td className={td}>{d.customer}</td>
                <td className={`${td} text-[#0d0d50]/60`}>{d.via}</td>
                <td className={`${td} text-[#0d0d50]/60`}>{d.when}</td>
                <td className={`${td} text-right font-semibold`}>{pkr(d.total)}</td>
                <td className={td}>{d.status === "Completed" ? <Pill tone="good">Completed</Pill> : d.status === "Open" ? <Pill tone="off">Open</Pill> : <Pill tone="info">Invoice sent</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
