import { Plus } from "lucide-react";
import { Button, PageHeader, Pill, td, th } from "@/components/new-admin/ui";
import { DISCOUNTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Discounts" };

export default function DiscountsPage() {
  return (
    <>
      <PageHeader icon="discounts" tone="lavender" title="Discounts" sub="Codes for Eid, sales and regulars, with who can use them and how often." actions={<Button primary><Plus className="h-4 w-4" /> Create discount</Button>} />
      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-[#fafafa]"><tr><th className={th}>Code</th><th className={th}>What it gives</th><th className={th}>Who can use it</th><th className={th}>Used</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-[#0a0a0a]/[0.06]">
              {DISCOUNTS.map((d) => (
                <tr key={d.code}>
                  <td className={td}><span className="rounded-md bg-[#f0f0f0] px-2 py-1 font-mono text-[13px] font-semibold">{d.code}</span></td>
                  <td className={td}><span className="block font-medium">{d.kind}</span><span className="text-[12.5px] text-[#0a0a0a]/50">{d.ends}</span></td>
                  <td className={`${td} text-[#0a0a0a]/70`}>{d.who}</td>
                  <td className={td}>
                    <span className="block tabular-nums">{d.used}{d.limit ? ` of ${d.limit}` : " times"}</span>
                    {d.limit && <span className="mt-1 block h-1 w-24 overflow-hidden rounded-full bg-[#efeff4]"><span className="block h-full bg-[#6666ff]" style={{ width: `${(d.used / d.limit) * 100}%` }} /></span>}
                  </td>
                  <td className={td}>{d.status === "Active" ? <Pill tone="good">Active</Pill> : d.status === "Scheduled" ? <Pill tone="info">Scheduled</Pill> : <Pill tone="off">Used up</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
