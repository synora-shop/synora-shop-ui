import { analytics } from "@/lib/analytics/queries";
import { funnel, percentChange, readRange, type SearchParams } from "@/lib/analytics";
import { getStoreSettings } from "@/lib/data/settings";
import { paymentLabel, statusLabel } from "@/lib/order-status-style";
import { AnalyticsBar } from "@/components/admin/analytics-bar";
import { RankedBars, StageBar } from "@/components/admin/charts";
import { PageHeader } from "@/components/ui/primitives";
import { AreaChart, Figures, Panel, shortDay } from "@/components/admin/kit";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

/**
 * Analytics (new admin, 15 October), drawn as the design draws it: the
 * window and its controls; sales, orders, average order and visitors; the
 * visitors chart in black with the window before as a dashed line; where
 * orders come from; and how people pay.
 *
 * Below that, what this screen already showed and the design did not draw:
 * profit, new customers and stock to fix; best sellers, the most visited pages
 * and where visitors arrive from; and where this window's orders stand. Kept,
 * in the same look, because each is a real figure a merchant acts on.
 */
const PAY_COLOUR: Record<string, string> = {
  COD: "#0a0a0a", JAZZCASH: "#6666ff", EASYPAISA: "#b7b9ff", PAYFAST: "#8cc8f5", BANK_TRANSFER: "#b8efd6",
};

export default async function AnalyticsPage(props: PageProps<"/admin/analytics">) {
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const sp = (await props.searchParams) as SearchParams;
  const range = readRange(sp);
  const comparing = sp.compare === "1";

  const [data, settings] = await Promise.all([analytics(range.days), getStoreSettings()]);
  const { current, previous } = data;

  const delta = (now: number, before: number) => {
    const pct = percentChange(now, before);
    return pct === null ? { delta: null, down: false } : { delta: `${pct >= 0 ? "+" : ""}${Math.round(pct)}%`, down: pct < 0 };
  };
  const span = range.days === 1 ? "24 hours" : range.days === 365 ? "12 months" : `${range.days} days`;
  const people = delta(data.totalPeople, data.previousTotalPeople);

  const stages = funnel(data.stages).map((s) => ({ stage: s.stage, count: s.count, label: statusLabel(s.stage) }));
  const totalPaid = data.payments.reduce((n, p) => n + p.value, 0);
  const topCity = Math.max(1, ...data.cities.map((c) => c.value));

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="Only the figures you would act on." />
      <AnalyticsBar searchParams={sp} range={range.value} comparing={comparing} />

      <Figures
        items={[
          { label: "Total sales", value: money(current.revenue), ...delta(current.revenue, previous.revenue), spark: data.revenueSeries.map((p) => p.value) },
          { label: "Orders", value: String(current.orders), ...delta(current.orders, previous.orders), spark: data.orderSeries.map((p) => p.value), href: "/admin/orders" },
          { label: "Average order", value: money(current.averageOrder), ...delta(current.averageOrder, previous.averageOrder) },
          { label: "Visitors", value: data.totalPeople.toLocaleString("en-PK"), ...people, spark: data.peopleSeries.map((p) => p.value) },
        ]}
      />

      {/* The one chart the page leads with, in black. */}
      <section className="rounded-2xl bg-[#0a0a0a] p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b7b9ff]">Visitors over time</p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">
              {data.totalPeople.toLocaleString("en-PK")}{" "}
              {people.delta && <span className={`text-[14px] font-semibold ${people.down ? "text-[#ffb4a1]" : "text-[#b8efd6]"}`}>{people.delta}</span>}
            </p>
          </div>
          <p className="flex items-center gap-4 text-[12.5px] text-white/55">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#b7b9ff]" /> These {span}</span>
            {comparing && <span className="flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-white/40" /> The {span} before</span>}
          </p>
        </div>
        <div className="mt-4">
          <AreaChart
            dark
            points={data.peopleSeries.map((p) => p.value)}
            compare={comparing ? data.previousPeopleSeries.map((p) => p.value) : undefined}
            label={`Visitors per day over the last ${span}`}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11.5px] text-white/35">
          <span>{shortDay(data.peopleSeries[0]?.day)}</span>
          <span>Today</span>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Where orders come from">
          {data.cities.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-[#0a0a0a]/50">No orders in this period.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.cities.map((c) => (
                <li key={c.label} className="grid grid-cols-[7rem_minmax(0,1fr)_2.75rem] items-center gap-3 text-[13.5px]">
                  <span className="truncate">{c.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#efeff4]"><span className="block h-full rounded-full bg-[#6666ff]" style={{ width: `${(c.value / topCity) * 100}%` }} /></span>
                  <span className="text-right font-semibold tabular-nums">{Math.round((c.value / Math.max(1, data.orderCount)) * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="How people pay">
          {totalPaid === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-[#0a0a0a]/50">No orders in this period.</p>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full">
                {data.payments.map((p) => <span key={p.method} style={{ width: `${(p.value / totalPaid) * 100}%`, background: PAY_COLOUR[p.method] ?? "#c8c8d0" }} />)}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3">
                {data.payments.map((p) => (
                  <li key={p.method} className="flex items-center gap-2 text-[13.5px]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: PAY_COLOUR[p.method] ?? "#c8c8d0" }} />
                    {paymentLabel(p.method)}
                    <b className="ml-auto font-semibold tabular-nums">{Math.round((p.value / totalPaid) * 100)}%</b>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <p className="pt-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]/45">More</p>
      <Figures
        items={[
          { label: "Profit", value: money(current.profit), ...delta(current.profit, previous.profit) },
          { label: "New customers", value: String(current.customers), ...delta(current.customers, previous.customers), href: "/admin/customers" },
          { label: "Out of stock", value: String(data.stock.out), href: "/admin/products/inventory?view=out" },
          { label: `Low stock (under ${settings.lowStockThreshold})`, value: String(data.stock.low), href: "/admin/products/inventory?view=low" },
        ]}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Best sellers">
          <RankedBars rows={data.topProducts} format="currency" empty="No sales in this period." />
        </Panel>
        <Panel title="Most visited">
          <RankedBars rows={data.topPages} empty="No visits in this period." />
        </Panel>
        <Panel title="Arriving from">
          <RankedBars rows={data.topReferrers} empty="No visits in this period." />
        </Panel>
      </div>
      <Panel title="Where this window's orders stand" action={data.cancelled > 0 ? <span className="text-[12.5px] text-[#0a0a0a]/55"><b className="font-semibold text-rose">{data.cancelled}</b> cancelled</span> : undefined}>
        <StageBar stages={stages} />
      </Panel>
    </div>
  );
}
