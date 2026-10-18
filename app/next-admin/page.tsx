import Link from "next/link";
import { AlertTriangle, ArrowRight, Check, Lightbulb, MessageSquare, PackageCheck, Sparkles, Wallet } from "lucide-react";
import { Btn, LineChart, Metrics, Page, Panel, Thumb, link, pkr } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";
import { ORDERS_30, PRODUCTS, SALES_30, SESSIONS_30, SHOP } from "@/lib/new-admin/sample";

export const metadata = { title: "Home" };

/**
 * Home (third design): the store in one line, the four numbers, what needs
 * you as a short list with counts, sales over time beside the setup list,
 * and below, orders, best sellers and one note from Synora.
 */
const SETUP = [
  { done: true, label: "Add your first product" },
  { done: true, label: "Choose a theme" },
  { done: true, label: "Turn on cash on delivery" },
  { done: true, label: "Connect JazzCash or Easypaisa" },
  { done: false, label: "Set delivery rates for your cities", href: `${A}/settings/shipping` },
  { done: false, label: "Connect your own domain", href: `${A}/settings/domains` },
];
const TODO = [
  { icon: PackageCheck, n: 4, text: "orders to fulfil", href: `${A}/orders`, bg: "bg-[#6666ff] text-white", sub: "text-white/75" },
  { icon: Wallet, n: 2, text: "cash orders to confirm", href: `${A}/orders`, bg: "bg-[#b7b9ff] text-[#0a0a0a]", sub: "text-[#0a0a0a]/65" },
  { icon: MessageSquare, n: 2, text: "enquiries to answer", href: `${A}/orders/enquiries`, bg: "bg-[#c8e7ff] text-[#0a0a0a]", sub: "text-[#0a0a0a]/65" },
  { icon: AlertTriangle, n: 3, text: "products running low", href: `${A}/products/inventory`, bg: "bg-[#b8efd6] text-[#0a0a0a]", sub: "text-[#0a0a0a]/65" },
];

export default function Home() {
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  const done = SETUP.filter((s) => s.done).length;
  return (
    <Page
      title="Home"
      sub="Wednesday, 15 October"
      meta={<span className="inline-flex items-center gap-1.5 rounded-[10px] bg-white px-2 py-1 text-[12px] text-[#3a3a3a] ring-1 ring-inset ring-[#ebebeb]"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60 motion-reduce:hidden" /><span className="relative h-1.5 w-1.5 rounded-full bg-[#16a34a]" /></span>12 on your store now</span>}
      actions={<><Btn href="#">View store</Btn><Btn kind="primary" href={`${A}/online-store`}>Customise</Btn></>}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[16px] border border-[#ebebeb] bg-white px-3.5 py-2.5 text-[13px]">
        <span className="font-semibold">{SHOP.name}</span>
        <span className="inline-flex items-center gap-1.5 text-[#15803d]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" /> Open</span>
        <span className="text-[#737373]">zohralawn.pk</span>
        <span className="text-[#737373]">Loom (Eid edit) is live</span>
        <span className="ml-auto text-[#737373]">Last 30 days</span>
      </div>

      <Metrics
        items={[
          { label: "Sessions", value: sum(SESSIONS_30).toLocaleString("en-PK"), delta: "+38%", spark: SESSIONS_30, href: `${A}/analytics` },
          { label: "Total sales", value: pkr(sum(SALES_30)), delta: "+42%", spark: SALES_30, href: `${A}/analytics` },
          { label: "Orders", value: String(sum(ORDERS_30)), delta: "+31%", spark: ORDERS_30, href: `${A}/orders` },
          { label: "Conversion", value: "2.1%", delta: "−0.2 pts", down: true, spark: [2.4, 2.3, 2.3, 2.2, 2.2, 2.1, 2.1] },
        ]}
      />

      {/* What needs you today, in the section colours. */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TODO.map(({ icon: Icon, n, text, href, bg, sub }) => (
          <Link key={text} href={href} className={`group flex h-12 items-center gap-3 rounded-[14px] px-4 transition-transform hover:-translate-y-px ${bg}`}>
            <span className="text-[20px] font-semibold tabular-nums leading-none">{n}</span>
            <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${sub}`}>{text}</span>
            <Icon className="h-4 w-4 opacity-60" />
          </Link>
        ))}
      </div>

      <label className="flex h-10 items-center gap-2.5 rounded-[16px] border border-[#ebebeb] bg-white px-3 focus-within:border-[#6666ff]">
        <Sparkles className="h-4 w-4 shrink-0 text-[#6666ff]" />
        <input placeholder="Ask Synora about your store, e.g. which suit sold most this week?" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#a3a3a3]" />
        <span className="hidden gap-1.5 md:flex">
          {["Write an Eid sale announcement", "Why were Tuesday's sales low?"].map((q) => <span key={q} className="rounded-[6px] bg-[#f3f3f3] px-2 py-0.5 text-[12px] text-[#555555]">{q}</span>)}
        </span>
        <ArrowRight className="h-4 w-4 text-[#a3a3a3]" />
      </label>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Panel title="Sales over time" action={<span className="text-[#737373]">Daily, last 30 days</span>}>
          <p className="text-[20px] font-semibold tabular-nums tracking-[-0.01em]">{pkr(sum(SALES_30))} <span className="text-[12.5px] font-medium text-[#15803d]">+42%</span></p>
          <div className="mt-2"><LineChart points={SALES_30} label="Sales per day over the last 30 days, rising" height={190} /></div>
          <div className="mt-1.5 flex justify-between text-[11.5px] text-[#a3a3a3]"><span>16 Sep</span><span>1 Oct</span><span>Today</span></div>
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Get your store ready" action={<span className="tabular-nums text-[#737373]">{done} of {SETUP.length}</span>} flush>
            <div className="mx-4 mt-3 h-1 overflow-hidden rounded-full bg-[#f1f1f1]"><div className="h-full rounded-full bg-[#6666ff]" style={{ width: `${(done / SETUP.length) * 100}%` }} /></div>
            <ul className="px-4 py-2">
              {SETUP.map((s) => (
                <li key={s.label} className="flex h-7 items-center gap-2 text-[13px]">
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${s.done ? "bg-[#dcfce7] text-[#15803d]" : "border border-[#a3a3a3]"}`}>{s.done && <Check className="h-2.5 w-2.5" />}</span>
                  {s.href ? <Link href={s.href} className={link}>{s.label}</Link> : <span className="text-[#a3a3a3] line-through">{s.label}</span>}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-3">
        <Panel title="Orders over time" action={<span className="tabular-nums text-[#737373]">{sum(ORDERS_30)} orders</span>}>
          <div className="flex h-24 items-end gap-[3px]">
            {ORDERS_30.map((n, i) => <span key={i} className="flex-1 rounded-t-[2px] bg-[#6666ff]/70" style={{ height: `${(n / 16) * 100}%` }} />)}
          </div>
        </Panel>
        <Panel title="Best sellers" action={<span className="text-[#737373]">This month</span>} flush>
          <ul className="divide-y divide-[#f1f1f1]">
            {PRODUCTS.slice(0, 4).map((p, i) => (
              <li key={p.slug}>
                <Link href={`${A}/products/${p.slug}`} className="flex h-10 items-center gap-2.5 px-4 hover:bg-[#fafafa]">
                  <Thumb src={p.image} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span>
                  <span className="text-[12.5px] tabular-nums text-[#737373]">{[34, 27, 19, 12][i]} sold</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="From Synora">
          <p className="text-[13px] font-medium">Discount codes can now give free delivery.</p>
          <Link href={`${A}/discounts/new`} className={`mt-1 inline-block text-[13px] ${link}`}>Create one</Link>
          <p className="mt-3 flex gap-2 border-t border-[#f1f1f1] pt-3 text-[12.5px] leading-relaxed text-[#555555]">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
            Calling cash-on-delivery customers before dispatch cuts returns. Mark them confirmed from the order.
          </p>
        </Panel>
      </div>
    </Page>
  );
}
