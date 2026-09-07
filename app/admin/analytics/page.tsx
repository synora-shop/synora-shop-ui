import { analytics } from "@/lib/analytics/queries";
import { funnel, percentChange, readRange, type SearchParams } from "@/lib/analytics";
import { getStoreSettings } from "@/lib/data/settings";

import { statusLabel } from "@/lib/order-status-style";
import { AnalyticsBar } from "@/components/admin/analytics-bar";
import { MetricTile, RankedBars, StageBar, TrendChart } from "@/components/admin/charts";
import { Card, GroupLabel, PageHeader, SectionDivider } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

/**
 * How the shop is doing.
 *
 * Only figures a merchant would act on. Every one answers a question they
 * actually ask — is money coming in, is it more than last month, what is
 * selling, where are people arriving from, what is stuck, and is anyone here
 * right now. Nothing is here because it was easy to count.
 *
 * Revenue and orders are two charts, never one. They are different measures on
 * different scales, and putting them on a shared axis would invent a
 * relationship between them that the data does not contain.
 */
export default async function AnalyticsPage(props: PageProps<"/admin/analytics">) {
  // Prices in the store's own currency rather than in rupees, which every
  // screen printed regardless of what Settings said.
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const sp = (await props.searchParams) as SearchParams;
  const range = readRange(sp);
  const comparing = sp.compare === "1";

  const [data, settings] = await Promise.all([analytics(range.days), getStoreSettings()]);
  const { current, previous } = data;

  // Only computed when asked for. A change figure nobody switched on is a
  // number competing for attention with the one they came to read.
  const change = (now: number, before: number) => (comparing ? percentChange(now, before) : undefined);

  const stages = funnel(data.stages).map((s) => ({
    stage: s.stage,
    count: s.count,
    label: statusLabel(s.stage),
  }));

  return (
    <div className="space-y-2.5">
      <PageHeader
        title="Analytics"
        description={`${range.label.toLowerCase()}, in ${data.timeZone.replace("_", " ")}.`}
      />

      <AnalyticsBar searchParams={sp} range={range.value} comparing={comparing} />

      <SectionDivider title="How the shop is doing" />

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricTile
          label="Revenue" value={money(current.revenue)}
          change={change(current.revenue, previous.revenue)}
          spark={data.revenueSeries}
        />
        <MetricTile
          label="Profit" value={money(current.profit)}
          change={change(current.profit, previous.profit)}
          hint="Never shown to customers"
        />
        <MetricTile
          label="Orders" value={String(current.orders)}
          change={change(current.orders, previous.orders)}
          spark={data.orderSeries}
          href="/admin/orders"
        />
        <MetricTile
          label="Avg order" value={money(current.averageOrder)}
          change={change(current.averageOrder, previous.averageOrder)}
        />
        <MetricTile
          label="New customers" value={String(current.customers)}
          change={change(current.customers, previous.customers)}
          href="/admin/customers"
        />
        <MetricTile
          label="Visitors now" value={String(data.liveVisitors)}
          hint="In the last five minutes"
          spark={data.peopleSeries}
        />
      </div>

      {/* Stock is not a measure of how the shop is doing — it is a thing to go
          and fix — so it sits apart from the figures and links straight at the
          screen that fixes it. */}
      {(data.stock.out > 0 || data.stock.low > 0) && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <MetricTile
            label="Out of stock" value={String(data.stock.out)}
            goodWhen="down" href="/admin/products" hint="Cannot be bought right now"
          />
          <MetricTile
            label={`Low stock (under ${settings.lowStockThreshold})`} value={String(data.stock.low)}
            goodWhen="down" href="/admin/products" hint="Worth restocking"
          />
        </div>
      )}

      <SectionDivider title="Over time" description="Revenue and orders are two charts on two scales, never one." />

      <div className="grid gap-2.5 lg:grid-cols-2">
        <Card className="p-4">
          <GroupLabel>Revenue</GroupLabel>
          <p className="mb-2 font-mono text-lg font-semibold tabular-nums">{money(current.revenue)}</p>
          <TrendChart points={data.revenueSeries} label="Revenue per day" format="currency" />
        </Card>
        <Card className="p-4">
          <GroupLabel>Orders</GroupLabel>
          <p className="mb-2 font-mono text-lg font-semibold tabular-nums">{current.orders}</p>
          <TrendChart points={data.orderSeries} label="Orders per day" />
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <GroupLabel>Visitors</GroupLabel>
          <p className="text-xs text-ink-soft">
            <span className="font-mono font-semibold tabular-nums text-ink">{data.totalPeople.toLocaleString("en-PK")}</span> people
            {" · "}
            <span className="font-mono tabular-nums">{data.totalVisits.toLocaleString("en-PK")}</span> page views
          </p>
        </div>
        <TrendChart points={data.visitSeries} label="Page views per day" height={130} width={1400} />
      </Card>

      <SectionDivider title="What and who" />

      <div className="grid gap-2.5 lg:grid-cols-3">
        <Card className="p-4">
          <GroupLabel className="mb-3">Best sellers</GroupLabel>
          <RankedBars rows={data.topProducts} format="currency" empty="No sales in this period." />
        </Card>
        <Card className="p-4">
          <GroupLabel className="mb-3">Most visited</GroupLabel>
          <RankedBars rows={data.topPages} empty="No visits in this period." />
        </Card>
        <Card className="p-4">
          <GroupLabel className="mb-3">Arriving from</GroupLabel>
          <RankedBars rows={data.topReferrers} empty="No visits in this period." />
        </Card>
      </div>

      <SectionDivider title="Fulfilment" />

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="sr-only">Where the orders are</h2>
          {/* Cancelled is not a stage an order passes through, so it is reported
              beside the sequence rather than as its final step. */}
          {data.cancelled > 0 && (
            <p className="text-xs text-ink-soft">
              <span className="font-mono tabular-nums text-rose">{data.cancelled}</span> cancelled
            </p>
          )}
        </div>
        <StageBar stages={stages} />
      </Card>
    </div>
  );
}
