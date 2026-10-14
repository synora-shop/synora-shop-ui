import Image from "next/image";
import { ArrowRight, Check, Lightbulb, PackageCheck, Sparkles, Wallet, AlertTriangle } from "lucide-react";
import { AreaChart, Card, StatStrip, pkr } from "@/components/new-admin/ui";
import { ORDERS_30, PRODUCTS, SALES_30, SESSIONS_30, SHOP } from "@/lib/new-admin/sample";

export const metadata = { title: "Home" };

/**
 * Home (preview): what happened, what needs you, and what to do next, in
 * that order. Live visitors top right; the four numbers that matter; Synora's
 * assistant; today's to-do as chips; sales and orders over time; the setup
 * list; and, last, what's new and a tip.
 */
const SETUP = [
  { done: true, label: "Add your first product" },
  { done: true, label: "Choose a theme" },
  { done: true, label: "Turn on cash on delivery" },
  { done: true, label: "Connect JazzCash or Easypaisa" },
  { done: false, label: "Set delivery rates for your cities" },
  { done: false, label: "Connect your own domain" },
];

export default function NewAdminHome() {
  const sum = (a: number[]) => a.reduce((t, n) => t + n, 0);
  const done = SETUP.filter((s) => s.done).length;
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[#0a0a0a]/50">Wednesday, 15 October</p>
          <h1 className="text-[26px] font-semibold tracking-[-0.025em]">Good afternoon, {SHOP.owner.split(" ")[0]}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">Last 30 days</span>
          <span className="inline-flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2fb37c] opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2fb37c]" />
            </span>
            12 on your store now
          </span>
        </div>
      </div>

      <StatStrip
        stats={[
          { label: "Sessions", value: sum(SESSIONS_30).toLocaleString("en-PK"), delta: "+38% on last month", spark: SESSIONS_30 },
          { label: "Total sales", value: pkr(sum(SALES_30)), delta: "+42%", spark: SALES_30 },
          { label: "Orders", value: String(sum(ORDERS_30)), delta: "+31%", spark: ORDERS_30 },
          { label: "Conversion", value: "2.1%", delta: "−0.2 points", down: true, spark: [2.4, 2.3, 2.3, 2.2, 2.2, 2.1, 2.1] },
        ]}
      />

      {/* The assistant. */}
      <section className="rounded-2xl bg-white p-4 ring-1 ring-[#0a0a0a]/[0.07] sm:p-5">
        <div className="flex items-center gap-3 rounded-xl bg-[#f5f5f5] px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-[#6666ff]" />
          <span className="flex-1 text-[15px] text-[#0a0a0a]/45">Ask Synora about your store…</span>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0a0a0a] text-white">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Which suit sold most this week?", "Write an Eid sale announcement", "Why were Tuesday's sales low?", "Which cities order the most?"].map((q) => (
            <span key={q} className="rounded-full bg-white px-3 py-1.5 text-[13px] text-[#0a0a0a]/70 ring-1 ring-[#0a0a0a]/10">
              {q}
            </span>
          ))}
        </div>
      </section>

      {/* What needs you today. */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: PackageCheck, text: "4 orders to fulfil", href: "/new-admin/orders" },
          { icon: Wallet, text: "2 cash orders to confirm", href: "/new-admin/orders" },
          { icon: AlertTriangle, text: "3 products running low", href: "/new-admin/products/inventory" },
        ].map(({ icon: Icon, text, href }) => (
          <a key={text} href={href} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/10 hover:ring-[#0a0a0a]/25">
            <Icon className="h-4 w-4 text-[#6666ff]" /> {text} <ArrowRight className="h-3.5 w-3.5 text-[#0a0a0a]/35" />
          </a>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card title="Sales over time" action={<span className="text-[12.5px] font-medium text-[#0a0a0a]/50">Daily, last 30 days</span>}>
          <p className="text-[24px] font-semibold tracking-[-0.02em]">{pkr(sum(SALES_30))}</p>
          <div className="mt-3">
            <AreaChart points={SALES_30} label="Sales per day over the last 30 days, rising" />
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] text-[#0a0a0a]/40">
            <span>16 Sep</span>
            <span>1 Oct</span>
            <span>Today</span>
          </div>
        </Card>

        <Card title="Get your store ready" action={<span className="text-[12.5px] font-semibold text-[#0a0a0a]/50">{done} of {SETUP.length}</span>}>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#efeff4]">
            <div className="h-full rounded-full bg-[#6666ff]" style={{ width: `${(done / SETUP.length) * 100}%` }} />
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {SETUP.map((s) => (
              <li key={s.label} className="flex items-center gap-2.5 text-[13.5px]">
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${s.done ? "bg-[#ddf5e9] text-[#11643f]" : "border border-[#0a0a0a]/20"}`}>
                  {s.done && <Check className="h-3 w-3" />}
                </span>
                <span className={s.done ? "text-[#0a0a0a]/45 line-through" : "font-semibold"}>{s.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Orders over time">
          <p className="text-[20px] font-semibold">{sum(ORDERS_30)} orders</p>
          <div className="mt-3 flex h-24 items-end gap-[3px]">
            {ORDERS_30.map((n, i) => (
              <span key={i} className="flex-1 rounded-t-[3px] bg-[#6666ff]/80" style={{ height: `${(n / 16) * 100}%` }} />
            ))}
          </div>
        </Card>
        <Card title="Top products">
          <ul className="flex flex-col gap-3">
            {PRODUCTS.slice(0, 4).map((p, i) => (
              <li key={p.slug} className="flex items-center gap-3">
                <Image src={p.image} alt="" width={36} height={36} className="h-9 w-9 rounded-lg bg-[#f0f0f0] object-cover" />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{p.name}</span>
                <span className="text-[13px] font-semibold text-[#0a0a0a]/60">{[34, 27, 19, 12][i]} sold</span>
              </li>
            ))}
          </ul>
        </Card>
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl bg-[#0a0a0a] p-5 text-white">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#b8efd6]">New in Synora</p>
            <p className="mt-2 text-[16px] font-semibold leading-snug">Discount codes can now give free delivery.</p>
            <a href="/new-admin/discounts" className="mt-3 inline-flex items-center gap-1 text-[13.5px] font-semibold text-white/80 hover:text-white">
              Create one <ArrowRight className="h-4 w-4" />
            </a>
          </section>
          <section className="flex gap-3 rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
            <Lightbulb className="h-5 w-5 shrink-0 text-[#d99a1e]" />
            <p className="text-[13.5px] leading-relaxed text-[#0a0a0a]/70">
              <b className="font-semibold text-[#0a0a0a]">Tip:</b> calling cash-on-delivery customers before dispatch cuts returns. Mark them confirmed from the order.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
