import { LineChart, Metrics, Page, Panel, pkr } from "@/components/next-admin/ui";
import { AnalyticsBar } from "@/components/next-admin/analytics-bar";
import { ORDERS_30, SALES_30, SESSIONS_30 } from "@/lib/new-admin/sample";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  const cities: [string, number][] = [["Lahore", 38], ["Karachi", 27], ["Islamabad", 14], ["Faisalabad", 8], ["Multan", 6], ["Others", 7]];
  const pay: [string, number, string][] = [["Cash on delivery", 52, "#3a3a3a"], ["JazzCash", 21, "#6666ff"], ["Easypaisa", 15, "#b7b9ff"], ["Card", 12, "#8cc8f5"]];
  return (
    <Page title="Analytics" sub="Only the figures you would act on.">
      <AnalyticsBar />
      <Metrics items={[{ label: "Total sales", value: pkr(sum(SALES_30)), delta: "+42%", spark: SALES_30 }, { label: "Orders", value: String(sum(ORDERS_30)), delta: "+31%", spark: ORDERS_30 }, { label: "Average order", value: pkr(Math.round(sum(SALES_30) / sum(ORDERS_30))), delta: "+8%" }, { label: "Sessions", value: sum(SESSIONS_30).toLocaleString("en-PK"), delta: "+38%", spark: SESSIONS_30 }]} />
      <Panel title="Sessions over time" action={<span className="flex items-center gap-3 text-[#737373]"><span className="flex items-center gap-1.5"><span className="h-0.5 w-3.5 rounded-[6px] bg-[#6666ff]" /> These 30 days</span><span className="flex items-center gap-1.5"><span className="w-3.5 border-t border-dashed border-[#a3a3a3]" /> The 30 before</span></span>}>
        <p className="text-[20px] font-semibold tabular-nums">{sum(SESSIONS_30).toLocaleString("en-PK")} <span className="text-[12.5px] font-medium text-[#15803d]">+38%</span></p>
        <div className="mt-2"><LineChart points={SESSIONS_30} compare={SESSIONS_30.map((n, i) => Math.round(n * 0.7 + ((i * 37) % 11) * 4))} label="Sessions per day, rising, above the 30 days before" height={180} /></div>
        <div className="mt-1.5 flex justify-between text-[11.5px] text-[#a3a3a3]"><span>16 Sep</span><span>1 Oct</span><span>Today</span></div>
      </Panel>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Where orders come from">
          <ul className="flex flex-col gap-2">
            {cities.map(([c, n]) => (
              <li key={c} className="grid grid-cols-[6rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-[13px]">
                <span>{c}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-[#f1f1f1]"><span className="block h-full rounded-full bg-[#6666ff]" style={{ width: `${(n / 38) * 100}%` }} /></span>
                <span className="text-right font-medium tabular-nums">{n}%</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="How people pay">
          <div className="flex h-2 gap-px overflow-hidden rounded-full">{pay.map(([l, n, c]) => <span key={l} style={{ width: `${n}%`, background: c }} />)}</div>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2">
            {pay.map(([l, n, c]) => <li key={l} className="flex items-center gap-2 text-[13px]"><span className="h-2 w-2 rounded-[3px]" style={{ background: c }} />{l}<b className="ml-auto font-medium tabular-nums">{n}%</b></li>)}
          </ul>
        </Panel>
      </div>
    </Page>
  );
}
