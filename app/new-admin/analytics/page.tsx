import { AreaChart, Card, PageHeader, StatStrip, pkr } from "@/components/new-admin/ui";
import { ORDERS_30, SALES_30, SESSIONS_30 } from "@/lib/new-admin/sample";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  const cities: [string, number][] = [["Lahore", 38], ["Karachi", 27], ["Islamabad", 14], ["Faisalabad", 8], ["Multan", 6], ["Others", 7]];
  const pay: [string, number, string][] = [["Cash on delivery", 52, "#0a0a0a"], ["JazzCash", 21, "#6666ff"], ["Easypaisa", 15, "#b7b9ff"], ["Card", 12, "#c8e7ff"]];
  return (
    <>
      <PageHeader icon="analytics" tone="iris" title="Analytics" sub="Only the figures you would act on." />
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex rounded-[10px] bg-white p-0.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">{["Today", "7 days", "30 days", "This year"].map((p) => <span key={p} className={`rounded-lg px-3 py-1.5 ${p === "30 days" ? "bg-[#0a0a0a] text-white" : "text-[#0a0a0a]/55"}`}>{p}</span>)}</span>
        <span className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10"><span className="h-4 w-7 rounded-full bg-[#0a0a0a] p-0.5"><span className="block h-3 w-3 translate-x-3 rounded-full bg-white" /></span> Compare with the 30 days before</span>
        <span className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10"><span className="h-2 w-2 animate-pulse rounded-full bg-[#2fb37c] motion-reduce:animate-none" /> Live · 12 on the store</span>
        <span className="ml-auto inline-flex items-center rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">Export</span>
      </div>
      <StatStrip stats={[{ label: "Total sales", value: pkr(sum(SALES_30)), delta: "+42%", spark: SALES_30 }, { label: "Orders", value: String(sum(ORDERS_30)), delta: "+31%", spark: ORDERS_30 }, { label: "Average order", value: pkr(Math.round(sum(SALES_30) / sum(ORDERS_30))) }, { label: "Sessions", value: sum(SESSIONS_30).toLocaleString("en-PK"), spark: SESSIONS_30 }]} />
      <section className="rounded-2xl bg-[#0a0a0a] p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b7b9ff]">Sessions over time</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">{sum(SESSIONS_30).toLocaleString("en-PK")} <span className="text-[14px] font-semibold text-[#b8efd6]">+38%</span></p>
          </div>
          <p className="flex items-center gap-4 text-[12.5px] text-white/55"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#b7b9ff]" /> These 30 days</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t border-dashed border-white/40" /> The 30 before</span></p>
        </div>
        <div className="mt-4"><AreaChart dark points={SESSIONS_30} compare={SESSIONS_30.map((n, i) => Math.round(n * 0.7 + ((i * 37) % 11) * 4))} label="Sessions per day, rising, above the 30 days before" /></div>
        <div className="mt-2 flex justify-between text-[11.5px] text-white/35"><span>16 Sep</span><span>1 Oct</span><span>Today</span></div>
      </section>
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
