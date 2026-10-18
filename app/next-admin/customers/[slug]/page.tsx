import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Metrics, Page, Panel, Status, Tag, btn, pkr } from "@/components/next-admin/ui";
import { Toggle } from "@/components/next-admin/bits";
import { STAGE_TONE } from "@/components/next-admin/stage";
import { A } from "@/components/next-admin/nav";
import { CUSTOMERS, ORDERS, slugOf } from "@/lib/new-admin/sample";

/** One customer (third design): what they are worth, every order, how to reach them, and the team's note. */
export function generateStaticParams() {
  return CUSTOMERS.map((c) => ({ slug: slugOf(c.name) }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: CUSTOMERS.find((x) => slugOf(x.name) === slug)?.name ?? "Customer" };
}

export default async function CustomerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = CUSTOMERS.find((x) => slugOf(x.name) === slug);
  if (!c) notFound();
  const own = ORDERS.filter((o) => o.customer === c.name);
  const orders = own.length ? own : ORDERS.slice(5, 5 + Math.min(c.orders, 3)).map((o) => ({ ...o, customer: c.name }));
  return (
    <Page
      title={c.name}
      crumbs={[{ label: "Customers", href: `${A}/customers` }]}
      meta={c.account ? <Status tone="good">Has an account</Status> : <Status tone="off">Guest</Status>}
      sub={`${c.city} · customer since ${c.since}`}
      actions={<><a href="tel:03001234567" className={btn()}><Phone /> Call</a><a href="#" className={btn("primary")}><MessageCircle /> WhatsApp</a></>}
    >
      <Metrics items={[{ label: "Spent", value: pkr(c.spent) }, { label: "Orders", value: String(c.orders) }, { label: "Average order", value: pkr(Math.round(c.spent / c.orders)) }, { label: "Last order", value: orders[0]?.when.split(",")[0] ?? "None" }]} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title="Orders" flush>
            <ul className="divide-y divide-[#f1f1f1]">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`${A}/orders/${o.id}`} className="flex h-10 items-center gap-3 px-4 text-[13px] hover:bg-[#fafafa]">
                    <span className="w-14 font-semibold">#{o.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[#737373]">{o.when} · {o.items} item{o.items > 1 ? "s" : ""} · {o.payment}</span>
                    <Status tone={STAGE_TONE[o.stage]}>{o.stage}</Status>
                    <span className="w-20 text-right font-semibold tabular-nums">{pkr(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Team note" action={<span className="text-[#737373]">Only your team sees this</span>}>
            <textarea defaultValue="Prefers delivery after 5 pm. Always orders size M." rows={2} className="w-full rounded-[10px] px-2.5 py-2 text-[13px] outline-none ring-1 ring-inset ring-[#dddddd] focus:ring-[#6666ff]" />
          </Panel>
        </div>
        <div className="flex flex-col gap-3">
          <Panel title="Reach them">
            <p className="flex items-center gap-2 text-[13px]"><Mail className="h-3.5 w-3.5 text-[#a3a3a3]" /> {c.email}</p>
            <p className="mt-1 flex items-center gap-2 text-[13px]"><Phone className="h-3.5 w-3.5 text-[#a3a3a3]" /> 0300 1234567</p>
            <p className="mt-3 text-[12px] font-medium text-[#737373]">Address</p>
            <p className="text-[13px] leading-relaxed">House 14, Street 3, {c.city}, Pakistan</p>
          </Panel>
          <Panel>
            <div className="flex items-center justify-between gap-3 text-[13px]"><span>Agreed to news by email</span><Toggle on={c.account} label="Email offers" /></div>
          </Panel>
          <Panel title="Tags">
            <div className="flex flex-wrap gap-1">{(c.orders > 2 ? ["Regular", c.city] : [c.city]).map((t) => <Tag key={t}>{t}</Tag>)}<button type="button" className="rounded-[6px] border border-dashed border-[#dddddd] px-1.5 py-0.5 text-[12px] text-[#737373]">Add tag</button></div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
