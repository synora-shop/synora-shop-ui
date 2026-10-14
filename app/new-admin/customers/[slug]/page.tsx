import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { Card, Pill, pkr } from "@/components/new-admin/ui";
import { Toggle } from "@/components/new-admin/bits";
import { STAGE_TONE } from "@/components/new-admin/orders-board";
import { CUSTOMERS, ORDERS, slugOf } from "@/lib/new-admin/sample";

/**
 * One customer (preview): who they are and what they are worth at a glance,
 * every order they placed, how to reach them, and the private note your team
 * keeps. Shopify's customer page, with WhatsApp where it matters.
 */
export function generateStaticParams() {
  return CUSTOMERS.map((c) => ({ slug: slugOf(c.name) }));
}

export default async function CustomerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CUSTOMERS.find((x) => slugOf(x.name) === slug);
  if (!c) notFound();
  const orders = ORDERS.filter((o) => o.customer === c.name);
  const initials = c.name.split(" ").map((w) => w[0]).join("");
  return (
    <>
      <Link href="/new-admin/customers" className="-mb-2 inline-flex items-center gap-1.5 self-start text-[13.5px] font-semibold text-[#0a0a0a]/55 hover:text-[#0a0a0a]"><ArrowLeft className="h-4 w-4" /> Customers</Link>
      <section className="flex flex-col gap-5 rounded-2xl bg-[#0a0a0a] p-5 text-white sm:flex-row sm:items-center sm:p-6">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#c8e7ff] text-[20px] font-semibold text-[#0a0a0a]">{initials}</span>
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-[22px] font-semibold tracking-[-0.02em]">{c.name} {c.account ? <span className="rounded-full bg-[#b8efd6]/15 px-2 py-0.5 text-[11.5px] font-semibold text-[#b8efd6]">Has an account</span> : <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11.5px] font-semibold text-white/60">Guest</span>}</h1>
          <p className="text-[13.5px] text-white/55">{c.city} · customer since {c.since}</p>
        </div>
        <dl className="grid grid-cols-3 gap-6 text-right">
          <div><dt className="text-[12px] text-white/50">Spent</dt><dd className="text-[18px] font-semibold">{pkr(c.spent)}</dd></div>
          <div><dt className="text-[12px] text-white/50">Orders</dt><dd className="text-[18px] font-semibold">{c.orders}</dd></div>
          <div><dt className="text-[12px] text-white/50">Average</dt><dd className="text-[18px] font-semibold">{pkr(Math.round(c.spent / c.orders))}</dd></div>
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-5">
          <Card title="Orders" pad={false}>
            <ul className="divide-y divide-[#0a0a0a]/[0.06]">
              {(orders.length ? orders : ORDERS.slice(5, 5 + Math.min(c.orders, 3)).map((o) => ({ ...o, customer: c.name }))).map((o) => (
                <li key={o.id}>
                  <Link href={`/new-admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafafa]">
                    <span className="w-16 font-semibold">#{o.id}</span>
                    <span className="min-w-0 flex-1 text-[13.5px] text-[#0a0a0a]/55">{o.when} · {o.items} item{o.items > 1 ? "s" : ""} · {o.payment}</span>
                    <Pill tone={STAGE_TONE[o.stage]}>{o.stage}</Pill>
                    <span className="w-24 text-right font-semibold tabular-nums">{pkr(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Team note">
            <div className="rounded-[10px] bg-[#f5f5f5] px-3.5 py-3 text-[14px] text-[#0a0a0a]/70">Prefers delivery after 5 pm. Always orders size M.</div>
            <p className="mt-2 text-[12.5px] text-[#0a0a0a]/45">Only your team sees this.</p>
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card title="Reach them">
            <div className="flex flex-col gap-2 text-[13.5px]">
              <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#0a0a0a]/40" /> {c.email}</span>
              <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#0a0a0a]/40" /> 0300 1234567</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12"><Phone className="h-4 w-4" /> Call</span>
              <span className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#0a0a0a] py-2 text-[13px] font-semibold text-white"><MessageCircle className="h-4 w-4" /> WhatsApp</span>
            </div>
          </Card>
          <Card title="Address">
            <p className="text-[13.5px] leading-relaxed">House 14, Street 3<br />{c.city}, Pakistan</p>
          </Card>
          <Card title="Offers">
            <div className="flex items-center justify-between gap-3 text-[13.5px]"><span>Agreed to news by email</span><Toggle on={c.account} label="Email offers" /></div>
          </Card>
          <Card title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {(c.orders > 2 ? ["Regular", c.city] : [c.city]).map((t) => <span key={t} className="rounded-md bg-[#f0f0f0] px-2 py-1 text-[12.5px] font-medium">{t}</span>)}
              <span className="rounded-md px-2 py-1 text-[12.5px] text-[#0a0a0a]/45 ring-1 ring-dashed ring-[#0a0a0a]/20">Add tag</span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
