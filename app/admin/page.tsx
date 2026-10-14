import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, FilePen, Home as HomeIcon, MessageSquare, PackageCheck } from "lucide-react";
import { analytics } from "@/lib/analytics/queries";
import { getStoreSettings } from "@/lib/data/settings";
import { canonicalUrl, db, requireShop } from "@/lib/data/shop";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { formatMoney } from "@/lib/money";
import { ActionLink, AreaChart, Figures, Panel, changeText } from "@/components/admin/kit";

export const dynamic = "force-dynamic";

/**
 * Home (new admin, 15 October): what happened, what needs you, and what to do
 * next, in that order, all of it read from the shop's own records.
 *
 * The store first, in black, with its state and the way to its storefront.
 * Then the last 30 days' four figures against the 30 before; the work waiting
 * on the merchant as coloured tiles, each landing where it is done; sales over
 * time; what is left to set up; and what sold.
 *
 * The store's name, logos and address used to be this screen. They are
 * Settings › Store details now (/admin/store), still the one place a logo is
 * set.
 */
export default async function AdminHomePage() {
  const shop = await requireShop();
  const scoped = await db();

  const [settings, data, url, pending, enquiries, drafts, products, gateways, domain] = await Promise.all([
    getStoreSettings(),
    analytics(30),
    canonicalUrl(shop.id),
    scoped.order.count({ where: { orderStatus: "PENDING", deletedAt: null } }),
    scoped.enquiry.count({ where: { status: "NEW" } }),
    scoped.product.count({ where: { status: "DRAFT", deletedAt: null } }),
    scoped.product.count({ where: { deletedAt: null } }),
    scoped.paymentGateway.count({ where: { secret: { not: null } } }),
    scoped.domain.findFirst({ where: { isPlatform: false, status: { in: ["VERIFIED", "ACTIVE"] } }, select: { hostname: true } }),
  ]);

  const { currency, timeZone } = resolveStoreDefaults(settings);
  const money = (n: number) => formatMoney(n, currency);
  const { current, previous } = data;
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date());
  const live = !settings.maintenanceMode && shop.status !== "PAUSED" && shop.status !== "CLOSED";
  const lowStock = data.stock.low + data.stock.out;

  const setup = [
    { done: products > 0, label: "Add your first product", href: "/admin/products/new" },
    { done: Boolean(settings.logoUrl), label: "Upload your logo", href: "/admin/store" },
    { done: Boolean(settings.contactEmail), label: "Say how customers reach you", href: "/admin/store" },
    { done: gateways > 0, label: "Connect JazzCash, Easypaisa or cards", href: "/admin/payments" },
    { done: Boolean(domain), label: "Connect your own domain", href: "/admin/domains" },
  ];
  const doneCount = setup.filter((s) => s.done).length;

  const needs = [
    { n: pending, text: pending === 1 ? "order to fulfil" : "orders to fulfil", href: "/admin/orders", icon: PackageCheck, cls: "bg-[#6666ff] text-white", sub: "text-white/75" },
    { n: enquiries, text: enquiries === 1 ? "enquiry to answer" : "enquiries to answer", href: "/admin/enquiries", icon: MessageSquare, cls: "bg-[#b7b9ff] text-[#0a0a0a]", sub: "text-[#0a0a0a]/60" },
    { n: drafts, text: drafts === 1 ? "product still a draft" : "products still drafts", href: "/admin/drafts", icon: FilePen, cls: "bg-[#c8e7ff] text-[#0a0a0a]", sub: "text-[#0a0a0a]/60" },
    { n: lowStock, text: "sizes low or sold out", href: "/admin/products", icon: AlertTriangle, cls: "bg-[#b8efd6] text-[#0a0a0a]", sub: "text-[#0a0a0a]/60" },
  ];

  const revenue = changeText(current.revenue, previous.revenue);
  const orders = changeText(current.orders, previous.orders);
  const avg = changeText(current.averageOrder, previous.averageOrder);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#0a0a0a]/50">{today}</p>
          <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-[#0a0a0a]">{greeting}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">
          <span className="relative flex h-2 w-2">
            {data.liveVisitors > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2fb37c] opacity-60 motion-reduce:hidden" />}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${data.liveVisitors > 0 ? "bg-[#2fb37c]" : "bg-[#0a0a0a]/25"}`} />
          </span>
          {data.liveVisitors} on your store now
        </span>
      </div>

      {/* The store itself. */}
      <section className="flex flex-col gap-4 rounded-2xl bg-[#0a0a0a] p-4 text-white sm:flex-row sm:items-center sm:p-5">
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#b8efd6] text-[13px] font-bold tracking-[0.1em] text-[#0a0a0a]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {settings.logoCompactUrl ? <img src={settings.logoCompactUrl} alt="" className="h-full w-full object-contain" /> : initials(settings.storeName || shop.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold">
            {settings.storeName || shop.name}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${live ? "bg-[#b8efd6]/15 text-[#b8efd6]" : "bg-[#f2a33a]/15 text-[#f2c27a]"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {live ? "Open" : "Not open to customers"}
            </span>
          </p>
          <p className="truncate text-[13.5px] text-white/55">{url.replace(/^https?:\/\//, "")}</p>
        </div>
        <div className="flex gap-2">
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-[10px] px-3.5 text-[13.5px] font-semibold ring-1 ring-white/20 hover:bg-white/10">View store</a>
          <Link href="/admin/customize" className="inline-flex h-9 items-center rounded-[10px] bg-white px-3.5 text-[13.5px] font-semibold text-[#0a0a0a]">Customise</Link>
        </div>
      </section>

      <Figures
        items={[
          { label: "Visitors, 30 days", value: data.totalPeople.toLocaleString("en-PK"), delta: `${data.totalVisits.toLocaleString("en-PK")} page views`, spark: data.peopleSeries.map((p) => p.value), href: "/admin/analytics" },
          { label: "Sales", value: money(current.revenue), delta: revenue.delta, down: revenue.down, spark: data.revenueSeries.map((p) => p.value), href: "/admin/analytics" },
          { label: "Orders", value: String(current.orders), delta: orders.delta, down: orders.down, spark: data.orderSeries.map((p) => p.value), href: "/admin/orders" },
          { label: "Average order", value: money(current.averageOrder), delta: avg.delta, down: avg.down },
        ]}
      />

      <div>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#0a0a0a]/45">Needs you</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {needs.map(({ n, text, href, icon: Icon, cls, sub }) => (
            <Link key={href} href={href} className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${n > 0 ? cls : "bg-white text-[#0a0a0a] ring-1 ring-[#0a0a0a]/[0.07]"}`}>
              <span className="text-[26px] font-semibold tabular-nums leading-none">{n}</span>
              <span className={`min-w-0 flex-1 text-[13.5px] font-semibold leading-tight ${n > 0 ? sub : "text-[#0a0a0a]/50"}`}>{text}</span>
              <Icon className="h-4 w-4 opacity-60" />
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="Sales over time" action={<span className="text-[12.5px] font-medium text-[#0a0a0a]/50">Daily, last 30 days</span>}>
          <p className="text-[24px] font-semibold tracking-[-0.02em] text-[#0a0a0a]">{money(current.revenue)}</p>
          <div className="mt-3">
            <AreaChart points={data.revenueSeries.map((p) => p.value)} label="Sales per day over the last 30 days" />
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] text-[#0a0a0a]/40">
            <span>{data.revenueSeries[0]?.day}</span>
            <span>Today</span>
          </div>
        </Panel>

        {doneCount < setup.length ? (
          <Panel title="Get your store ready" action={<span className="text-[12.5px] font-semibold text-[#0a0a0a]/50">{doneCount} of {setup.length}</span>}>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#efeff4]">
              <div className="h-full rounded-full bg-[#6666ff]" style={{ width: `${(doneCount / setup.length) * 100}%` }} />
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {setup.map((s) => (
                <li key={s.label}>
                  <Link href={s.href} className="flex items-center gap-2.5 text-[13.5px]">
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${s.done ? "bg-[#ddf5e9] text-[#11643f]" : "border border-[#0a0a0a]/20"}`}>{s.done && <Check className="h-3 w-3" />}</span>
                    <span className={s.done ? "text-[#0a0a0a]/45 line-through" : "font-semibold text-[#0a0a0a] hover:underline"}>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ) : (
          <Panel title="Best sellers, 30 days">
            <TopProducts rows={data.topProducts} money={money} />
          </Panel>
        )}
      </div>

      {doneCount < setup.length && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Best sellers, 30 days">
            <TopProducts rows={data.topProducts} money={money} />
          </Panel>
          <section className="flex flex-col justify-between rounded-2xl bg-[#0a0a0a] p-5 text-white">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#b8efd6]">Tip</p>
              <p className="mt-2 text-[16px] font-semibold leading-snug">Calling cash-on-delivery customers before you dispatch cuts returns.</p>
            </div>
            <Link href="/admin/orders" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-white/80 hover:text-white">
              Go to orders <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <ActionLink href="/admin/analytics">Full analytics</ActionLink>
        <ActionLink href="/admin/store"><HomeIcon className="h-4 w-4" /> Store details</ActionLink>
      </div>
    </>
  );
}

function TopProducts({ rows, money }: { rows: { label: string; value: number }[]; money: (n: number) => string }) {
  if (rows.length === 0) return <p className="py-6 text-center text-[13.5px] text-[#0a0a0a]/50">Nothing sold in the last 30 days yet.</p>;
  const top = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.label} className="text-[13.5px]">
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate font-medium text-[#0a0a0a]">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-[#0a0a0a]/70">{money(r.value)}</span>
          </span>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#efeff4]"><span className="block h-full rounded-full bg-[#6666ff]" style={{ width: `${(r.value / top) * 100}%` }} /></span>
        </li>
      ))}
    </ul>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
