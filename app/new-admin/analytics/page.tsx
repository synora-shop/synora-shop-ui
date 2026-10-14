import { AreaChart, Card, PageHeader, StatStrip, pkr } from "@/components/new-admin/ui";
import { ORDERS_30, SALES_30, SESSIONS_30 } from "@/lib/new-admin/sample";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  const cities: [string, number][] = [["Lahore", 38], ["Karachi", 27], ["Islamabad", 14], ["Faisalabad", 8], ["Multan", 6], ["Others", 7]];
  const pay: [string, number, string][] = [["Cash on delivery", 52, "#0a0a0a"], ["JazzCash", 21, "#6666ff"], ["Easypaisa", 15, "#b7b9ff"], ["Card", 12, "#c8e7ff"]];
  return (
    <>
      <PageHeader icon="analytics" tone="iris" title="Analytics" sub="How your store is doing, last 30 days." />
      <StatStrip stats={[{ label: "Total sales", value: pkr(sum(SALES_30)), delta: "+42%", spark: SALES_30 }, { label: "Orders", value: String(sum(ORDERS_30)), delta: "+31%", spark: ORDERS_30 }, { label: "Average order", value: pkr(Math.round(sum(SALES_30) / sum(ORDERS_30))) }, { label: "Sessions", value: sum(SESSIONS_30).toLocaleString("en-PK"), spark: SESSIONS_30 }]} />
      <Card title="Sessions over time"><AreaChart points={SESSIONS_30} label="Sessions per day, rising" /></Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Where orders come from">
          <ul className="flex flex-col gap-3">
            {cities.map(([c, n]) => (
              <li key={c} className="grid grid-cols-[6rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-[13.5px]">
                <span>{c}</span>
                <span className="h-2 overflow-hidden rounded-full bg-[#efeff4]"><span className="block h-full rounded-full bg-[#6666ff]" style={{ width: `${(n / 38) * 100}%` }} /></span>
                <span className="text-right font-semibold tabular-nums">{n}%</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="How people pay">
          <div className="flex h-3 overflow-hidden rounded-full">{pay.map(([l, n, c]) => <span key={l} style={{ width: `${n}%`, background: c }} />)}</div>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {pay.map(([l, n, c]) => (
              <li key={l} className="flex items-center gap-2 text-[13.5px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}<b className="ml-auto font-semibold">{n}%</b></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
