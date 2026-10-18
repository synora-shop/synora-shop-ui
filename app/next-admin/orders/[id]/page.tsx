import { notFound } from "next/navigation";
import { Copy, NotebookText, Phone, Printer } from "lucide-react";
import { OrderFlow, OrderPager, WhatsAppTemplates } from "@/components/next-admin/order-flow";
import { STAGE_TONE, payState } from "@/components/next-admin/stage";
import { Page, Panel, Status, Tag, Thumb, btn, pkr } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { A } from "@/components/next-admin/nav";
import { ORDERS, ORDER_DETAIL, PRODUCTS } from "@/lib/new-admin/sample";

/**
 * One order (third design): the next step on one line, what to send and the
 * money beside who it is for. The customer's note leads the side column in
 * amber, because a packer must not miss it.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Order #${(await params).id}` };
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idx = ORDERS.findIndex((x) => String(x.id) === id);
  const o = ORDERS[idx];
  if (!o) notFound();
  const detail = o.id === ORDER_DETAIL.id ? ORDER_DETAIL : null;
  const lines = (detail?.lines ?? PRODUCTS.slice(o.id % 5, (o.id % 5) + o.items).map((p) => ({ slug: p.slug, qty: 1, size: "M", price: p.price }))).map((l) => ({ ...l, p: PRODUCTS.find((p) => p.slug === l.slug)! }));
  const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0);
  const cod = o.payment === "Cash on delivery";
  const pay = payState(o);
  const phone = detail?.customer.phone ?? "0300 0000000";

  return (
    <Page
      title={`#${o.id}`}
      crumbs={[{ label: "Orders", href: `${A}/orders` }]}
      meta={<><Status tone={pay.tone}>{pay.label}</Status><Status tone={STAGE_TONE[o.stage]}>{o.stage}</Status></>}
      sub={`${detail?.when ?? o.when} · online store`}
      actions={<><Act msg="Packing slip ready to print"><Printer /> Print slip</Act><Act msg="Cancelling asks for a reason first" kind="danger">Cancel order</Act><OrderPager prev={ORDERS[idx - 1]?.id} next={ORDERS[idx + 1]?.id} /></>}
    >
      <OrderFlow start={o.stage} id={o.id} />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Panel title={o.stage === "Delivered" || o.stage === "Shipped" ? "Sent" : "To send"} action={<span className="text-[#71717a]">{lines.length} item{lines.length > 1 ? "s" : ""}</span>} flush>
            <ul className="divide-y divide-[#f0f0f2]">
              {lines.map((l) => (
                <li key={l.slug} className="flex h-14 items-center gap-3 px-4">
                  <Thumb src={l.p.image} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{l.p.name}</p>
                    <p className="text-[12px] text-[#71717a]">Size {l.size} · <span className="font-mono">{l.slug.toUpperCase().replace("-", "")}-{l.size}</span></p>
                  </div>
                  <p className="text-[12.5px] tabular-nums text-[#71717a]">{pkr(l.price)} × {l.qty}</p>
                  <p className="w-20 text-right text-[13px] font-semibold tabular-nums">{pkr(l.price * l.qty)}</p>
                </li>
              ))}
            </ul>
            <dl className="border-t border-[#e4e4e7] bg-[#fafafa] px-4 py-2.5 text-[13px]">
              <div className="flex h-6 justify-between"><dt className="text-[#71717a]">Subtotal</dt><dd className="tabular-nums">{pkr(subtotal)}</dd></div>
              <div className="flex h-6 justify-between"><dt className="text-[#71717a]">Delivery</dt><dd>{subtotal >= 10000 ? "Free, over 10,000" : pkr(200)}</dd></div>
              <div className="flex h-7 items-center justify-between font-semibold"><dt>Total · {o.payment}</dt><dd className="tabular-nums">{pkr(o.total)}</dd></div>
            </dl>
            {!o.paid && o.stage !== "Cancelled" && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#fde68a] bg-[#fffbeb] px-4 py-2">
                <span className="text-[12.5px] text-[#92400e]">{cod ? "When the courier hands you the cash:" : "If they paid you another way:"}</span>
                <Act msg={cod ? "Cash marked received" : "Marked as paid"} small>{cod ? "Mark cash received" : "Mark as paid"}</Act>
              </div>
            )}
          </Panel>

          <Panel title="Timeline">
            <input placeholder="Leave a note for your team…" className="h-8 w-full rounded-[6px] px-2.5 text-[13px] outline-none ring-1 ring-inset ring-[#d4d4d8] focus:ring-[#5b5bf0]" />
            <ol className="mt-3 flex flex-col gap-2.5 border-l border-[#e4e4e7] pl-4">
              {(detail?.timeline ?? [{ at: o.when, text: `Order placed by ${o.customer}.` }, { at: o.when, text: "Confirmation email sent." }]).map((e, i) => (
                <li key={i} className="relative text-[13px]">
                  <span className="absolute -left-[19.5px] top-[7px] h-1.5 w-1.5 rounded-full bg-[#a1a1aa]" />
                  {e.text} <span className="text-[12px] text-[#a1a1aa]">{e.at}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="flex flex-col gap-3">
          {(detail?.note || o.note) && (
            <section className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#92400e]"><NotebookText className="h-3.5 w-3.5" /> Customer note</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[#422006]">{detail?.note ?? "Please call before delivery."}</p>
            </section>
          )}
          <Panel title="Customer" action={<span className="text-[#71717a]">{detail?.customer.orders ?? 1} orders</span>}>
            <p className="text-[13px] font-semibold">{o.customer} <span className="font-normal text-[#71717a]">· {o.city}</span></p>
            <p className="mt-1.5 flex items-center justify-between gap-2 text-[12.5px] text-[#3f3f46]">{detail?.customer.email ?? "customer@example.com"} <Copy className="h-3.5 w-3.5 text-[#a1a1aa]" /></p>
            <p className="text-[12.5px] text-[#3f3f46]">{phone}</p>
            <p className="mt-3 text-[12px] font-medium text-[#71717a]">Deliver to</p>
            <p className="text-[12.5px] leading-relaxed">{detail?.customer.address ?? `${o.city}, Pakistan`}</p>
            <div className="mt-3 flex flex-col gap-1">
              <a href={`tel:${phone}`} className={`${btn()} w-full`}><Phone /> Call {o.customer.split(" ")[0]}</a>
              <WhatsAppTemplates name={o.customer} id={o.id} phone={phone} />
            </div>
          </Panel>
          <Panel title="Tags">
            <div className="flex flex-wrap gap-1">{["Gift", "Repeat customer"].map((t) => <Tag key={t}>{t}</Tag>)}<button type="button" className="rounded-[4px] px-1.5 py-0.5 text-[12px] text-[#71717a] border border-dashed border-[#d4d4d8]">Add</button></div>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
