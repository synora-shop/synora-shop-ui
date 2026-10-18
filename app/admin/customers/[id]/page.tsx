import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { shopSession } from "@/lib/auth-guard";
import { getCustomer } from "@/lib/data/customers";

import { formatRelativeTime } from "@/lib/format-relative-time";
import { statusLabel } from "@/lib/order-status-style";
import { Figures, Panel, STAGE_TONE, StatePill } from "@/components/admin/kit";
import { PageHeader } from "@/components/ui/primitives";
import { PageCrumb } from "@/components/admin/page-crumb";
import { CustomerNote, CustomerOffers, CustomerTags } from "@/components/admin/customer-extras";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function CustomerPage(props: PageProps<"/admin/customers/[id]">) {
  // Prices in the store's own currency rather than in rupees, which every
  // screen printed regardless of what Settings said.
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/customers");

  const { id } = await props.params;
  const customer = await getCustomer(id);
  // getCustomer reads through the scoped client, so another shop's customer id
  // simply isn't found rather than being refused — which is the same answer.
  if (!customer) notFound();

  const counted = customer.orders.filter((o) => o.orderStatus !== "CANCELLED");
  const totalSpent = counted.reduce((sum, o) => sum + o.total, 0);

  const digits = (customer.phone ?? "").replace(/\D/g, "").replace(/^0/, "92");

  return (
    <div className="space-y-4">
      <PageCrumb label={customer.name} />
      <PageHeader
        title={customer.name}
        meta={customer.hasAccount ? <StatePill tone="good">Has an account</StatePill> : <StatePill tone="off">Guest</StatePill>}
        description={`First seen ${formatRelativeTime(customer.createdAt)}`}
      />

      {/* What they are worth, at a glance. */}
      <Figures
        items={[
          { label: "Spent", value: money(totalSpent) },
          { label: "Orders", value: String(counted.length) },
          { label: "Average order", value: counted.length > 0 ? money(Math.round(totalSpent / counted.length)) : "None" },
        ]}
      />

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="space-y-4">
        <Panel
          title={`Orders · ${customer.orders.length}`}
          pad={false}
          action={<Link href={`/admin/orders/drafts/new?customer=${customer.id}`} className="text-[13px] font-semibold text-[#4b4bea] hover:underline">Create order</Link>}
        >
          {customer.orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-[14px] text-[#0a0a0a]/55">{customer.hasAccount ? "They have an account but haven\u2019t ordered yet." : "No orders yet."}</p>
          ) : (
            <ul className="mt-2 divide-y divide-[#0a0a0a]/[0.06]">
              {customer.orders.map((order) => (
                <li key={order.id}>
                  <Link href={`/admin/orders/${order.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-[#fafafa]">
                    <span className="w-20 font-mono text-[13.5px] font-semibold text-[#0a0a0a]">#{order.id}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-[#0a0a0a]/55">{order.items.map((i) => `${i.title} ×${i.quantity}`).join(", ")}</span>
                    <StatePill tone={STAGE_TONE[order.orderStatus] ?? "off"}>{statusLabel(order.orderStatus)}</StatePill>
                    <span className="w-24 text-right">
                      <span className="block text-[14px] font-semibold tabular-nums text-[#0a0a0a]">{money(order.total)}</span>
                      <span className="block text-[11.5px] text-[#0a0a0a]/45">{formatRelativeTime(order.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <CustomerNote id={customer.id} initial={customer.note} />
        </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Reach them">
            <div className="flex flex-col gap-2 text-[13.5px]">
              {/* Mailing a customer is the most common next action after
                  looking one up, so it is a link rather than text to copy. */}
              <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-2 break-all hover:underline"><Mail className="h-4 w-4 shrink-0 text-[#0a0a0a]/40" /> {customer.email}</a>
              {customer.phone && <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-2 hover:underline"><Phone className="h-4 w-4 shrink-0 text-[#0a0a0a]/40" /> {customer.phone}</a>}
            </div>
            {customer.phone && digits.length >= 10 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={`tel:${customer.phone}`} className="inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]"><Phone className="h-4 w-4" /> Call</a>
                <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#0a0a0a] py-2 text-[13px] font-semibold text-white hover:bg-[#262626]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
              </div>
            )}
          </Panel>
          <Panel title="Offers">
            <CustomerOffers id={customer.id} initial={customer.acceptsMarketing} />
          </Panel>
          <Panel title="Tags">
            <CustomerTags id={customer.id} initial={customer.tags} />
          </Panel>
          {customer.addresses.length > 0 && (
            <Panel title="Saved addresses">
              <ul className="space-y-3 text-[13.5px]">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0a0a0a]/40" />
                    <span className="leading-snug text-[#0a0a0a]/70">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}, {address.province}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
