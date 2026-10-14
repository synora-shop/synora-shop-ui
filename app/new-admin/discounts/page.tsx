import { Plus } from "lucide-react";
import { Button, PageHeader, Pill } from "@/components/new-admin/ui";
import { DataTable } from "@/components/new-admin/sort";
import { DISCOUNTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Discounts" };

export default function DiscountsPage() {
  return (
    <>
      <PageHeader icon="discounts" tone="lavender" title="Discounts" sub="Codes for Eid, sales and regulars, with who can use them and how often." actions={<Button primary><Plus className="h-4 w-4" /> Create discount</Button>} />
      <DataTable
        minWidth={720}
        cols={[
          { key: "code", label: "Code" },
          { key: "kind", label: "What it gives" },
          { key: "who", label: "Who can use it" },
          { key: "used", label: "Used", numeric: true },
          { key: "status", label: "Status" },
        ]}
        rows={DISCOUNTS.map((d) => ({
          id: d.code,
          by: { code: d.code, kind: d.kind, who: d.who, used: d.used, status: d.status },
          cells: {
            code: <span className="rounded-md bg-[#0a0a0a] px-2 py-1 font-mono text-[13px] font-semibold text-white">{d.code}</span>,
            kind: <><span className="block font-medium">{d.kind}</span><span className="text-[12.5px] text-[#0a0a0a]/50">{d.ends}</span></>,
            who: <span className="text-[#0a0a0a]/70">{d.who}</span>,
            used: (
              <>
                <span className="block tabular-nums">{d.used}{d.limit ? ` of ${d.limit}` : " times"}</span>
                {d.limit && <span className="mt-1 block h-1 w-24 overflow-hidden rounded-full bg-[#efeff4]"><span className="block h-full bg-[#6666ff]" style={{ width: `${(d.used / d.limit) * 100}%` }} /></span>}
              </>
            ),
            status: d.status === "Active" ? <Pill tone="good">Active</Pill> : d.status === "Scheduled" ? <Pill tone="info">Scheduled</Pill> : <Pill tone="off">Used up</Pill>,
          },
        }))}
      />
    </>
  );
}
