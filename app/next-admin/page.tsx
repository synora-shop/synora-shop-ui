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
  { icon: PackageCheck, n: 4, text: "Orders to fulfil", href: `${A}/orders` },
  { icon: Wallet, n: 2, text: "Cash orders to confirm by phone", href: `${A}/orders` },
  { icon: MessageSquare, n: 2, text: "Enquiries to answer", href: `${A}/orders/enquiries` },
  { icon: AlertTriangle, n: 3, text: "Products running low", href: `${A}/products/inventory` },
];

export default function Home() {
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  const done = SETUP.filter((s) => s.done).length;
  return (
    <Page
      title="Home"
      sub="Wednesday, 15 October"
      meta={<span className="inline-flex items-center gap-1.5 rounded-[6px] bg-white px-2 py-1 text-[12px] text-[#3f3f46] ring-1 ring-inset ring-[#e4e4e7]"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-60 motion-reduce:hidden" /><span className="relative h-1.5 w-1.5 rounded-full bg-[#16a34a]" /></span>12 on your store now</span>}
      actions={<><Btn href="#">View store</Btn><Btn kind="primary" href={`${A}/online-store`}>Customise</Btn></>}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[8px] border border-[#e4e4e7] bg-white px-3.5 py-2.5 text-[13px]">
        <span className="font-semibold">{SHOP.name}</span>
        <span className="inline-flex items-center gap-1.5 text-[#15803d]"><span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" /> Open</span>
        <span className="text-[#71717a]">zohralawn.pk</span>
        <span className="text-[#71717a]">Loom (Eid edit) is live</span>
        <span className="ml-auto text-[#71717a]">Last 30 days</span>
      </div>

      <Metrics
        items={[
          { label: "Sessions", value: sum(SESSIONS_30).toLocaleString("en-PK"), delta: "+38%", spark: SESSIONS_30, href: `${A}/analytics` },
          { label: "Total sales", value: pkr(sum(SALES_30)), delta: "+42%", spark: SALES_30, href: `${A}/analytics` },
          { label: "Orders", value: String(sum(ORDERS_30)), delta: "+31%", spark: ORDERS_30, href: `${A}/orders` },
          { label: "Conversion", value: "2.1%", delta: "−0.2 pts", down: true, spark: [2.4, 2.3, 2.3, 2.2, 2.2, 2.1, 2.1] },
        ]}
      />

      <label className="flex h-10 items-center gap-2.5 rounded-[8px] border border-[#e4e4e7] bg-white px-3 focus-within:border-[#5b5bf0]">
        <Sparkles className="h-4 w-4 shrink-0 text-[#5b5bf0]" />
        <input placeholder="Ask Synora about your store, e.g. which suit sold most this week?" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#a1a1aa]" />
        <span className="hidden gap-1.5 md:flex">
          {["Write an Eid sale announcement", "Why were Tuesday's sales low?"].map((q) => <span key={q} className="rounded-[4px] bg-[#f4f4f5] px-2 py-0.5 text-[12px] text-[#52525b]">{q}</span>)}
        </span>
        <ArrowRight className="h-4 w-4 text-[#a1a1aa]" />
      </label>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <Panel title="Sales over time" action={<span className="text-[#71717a]">Daily, last 30 days</span>}>
          <p className="text-[20px] font-semibold tabular-nums tracking-[-0.01em]">{pkr(sum(SALES_30))} <span className="text-[12.5px] font-medium text-[#15803d]">+42%</span></p>
          <div className="mt-2"><LineChart points={SALES_30} label="Sales per day over the last 30 days, rising" height={236} /></div>
          <div className="mt-1.5 flex justify-between text-[11.5px] text-[#a1a1aa]"><span>16 Sep</span><span>1 Oct</span><span>Today</span></div>
        </Panel>
        <div className="flex flex-col gap-3">
          <Panel title="Needs you" flush>
            <ul className="divide-y divide-[#f0f0f2]">
              {TODO.map(({ icon: Icon, n, text, href }) => (
                <li key={text}>
                  <Link href={href} className="flex h-10 items-center gap-2.5 px-4 text-[13px] hover:bg-[#fafafa]">
                    <Icon className="h-4 w-4 text-[#71717a]" />
                    <span className="flex-1 truncate">{text}</span>
                    <span className="min-w-6 rounded-[4px] bg-[#eef0ff] px-1.5 text-center text-[12px] font-semibold tabular-nums text-[#3730a3]">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Get your store ready" action={<span className="tabular-nums text-[#71717a]">{done} of {SETUP.length}</span>} flush>
            <div className="mx-4 mt-3 h-1 overflow-hidden rounded-full bg-[#f0f0f2]"><div className="h-full rounded-full bg-[#5b5bf0]" style={{ width: `${(done / SETUP.length) * 100}%` }} /></div>
            <ul className="px-4 py-2">
              {SETUP.map((s) => (
                <li key={s.label} className="flex h-7 items-center gap-2 text-[13px]">
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${s.done ? "bg-[#dcfce7] text-[#15803d]" : "border border-[#a1a1aa]"}`}>{s.done && <Check className="h-2.5 w-2.5" />}</span>
                  {s.href ? <Link href={s.href} className={link}>{s.label}</Link> : <span className="text-[#a1a1aa] line-through">{s.label}</span>}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid items-start gap-3 lg:grid-cols-3">
        <Panel title="Orders over time" action={<span className="tabular-nums text-[#71717a]">{sum(ORDERS_30)} orders</span>}>
          <div className="flex h-24 items-end gap-[3px]">
            {ORDERS_30.map((n, i) => <span key={i} className="flex-1 rounded-t-[2px] bg-[#5b5bf0]/70" style={{ height: `${(n / 16) * 100}%` }} />)}
          </div>
        </Panel>
        <Panel title="Best sellers" action={<span className="text-[#71717a]">This month</span>} flush>
          <ul className="divide-y divide-[#f0f0f2]">
            {PRODUCTS.slice(0, 4).map((p, i) => (
              <li key={p.slug}>
                <Link href={`${A}/products/${p.slug}`} className="flex h-10 items-center gap-2.5 px-4 hover:bg-[#fafafa]">
                  <Thumb src={p.image} size={24} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{p.name}</span>
                  <span className="text-[12.5px] tabular-nums text-[#71717a]">{[34, 27, 19, 12][i]} sold</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="From Synora">
          <p className="text-[13px] font-medium">Discount codes can now give free delivery.</p>
          <Link href={`${A}/discounts/new`} className={`mt-1 inline-block text-[13px] ${link}`}>Create one</Link>
          <p className="mt-3 flex gap-2 border-t border-[#f0f0f2] pt-3 text-[12.5px] leading-relaxed text-[#52525b]">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#d97706]" />
            Calling cash-on-delivery customers before dispatch cuts returns. Mark them confirmed from the order.
          </p>
        </Panel>
      </div>
    </Page>
  );
}
