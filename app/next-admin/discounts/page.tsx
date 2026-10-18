import Link from "next/link";
import { Plus } from "lucide-react";
import { Btn, Page, Status, T } from "@/components/next-admin/ui";
import { Toggle } from "@/components/next-admin/bits";
import { Table } from "@/components/next-admin/table";
import { A } from "@/components/next-admin/nav";
import { DISCOUNTS } from "@/lib/new-admin/sample";

export const metadata = { title: "Discounts" };

export default function DiscountsPage() {
  return (
    <Page title="Discounts" sub="Codes for Eid, sales and regulars, with who can use them and how often." actions={<Btn kind="primary" href={`${A}/discounts/new`}><Plus /> Create discount</Btn>}>
      <Table
        minWidth={760}
        views={["All", "Active", "Scheduled", "Used up"]}
        search="Search codes"
        cols={[
          { key: "code", label: "Code" },
          { key: "kind", label: "What it gives" },
          { key: "who", label: "Who can use it" },
          { key: "used", label: "Used" },
          { key: "status", label: "Status" },
          { key: "on", label: "On", sort: false, className: "w-14" },
        ]}
        rows={DISCOUNTS.map((d) => ({
          id: d.code,
          views: [d.status],
          by: { code: d.code, kind: d.kind, who: d.who, used: d.used, status: d.status },
          cells: {
            code: <Link href={`${A}/discounts/new?code=${d.code}`} className="rounded-[4px] bg-[#f4f4f5] px-1.5 py-0.5 font-mono text-[12.5px] font-semibold hover:bg-[#e4e4e7]">{d.code}</Link>,
            kind: <>{d.kind} <span className={T.muted}>· {d.ends}</span></>,
            who: <span className={T.muted}>{d.who}</span>,
            used: (
              <span className="inline-flex items-center gap-2 tabular-nums">
                {d.used}{d.limit ? ` of ${d.limit}` : ""}
                {d.limit && <span className="h-1 w-14 overflow-hidden rounded-full bg-[#f0f0f2]"><span className="block h-full bg-[#5b5bf0]" style={{ width: `${(d.used / d.limit) * 100}%` }} /></span>}
              </span>
            ),
            status: <Status tone={d.status === "Active" ? "good" : d.status === "Scheduled" ? "info" : "off"}>{d.status}</Status>,
            on: <Toggle on={d.status === "Active"} label={`${d.code} switched on`} />,
          },
        }))}
      />
    </Page>
  );
}
