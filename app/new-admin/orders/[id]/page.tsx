import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, MessageCircle, NotebookText, Package, Phone, Printer } from "lucide-react";
import { Button, Card, Pill, pkr } from "@/components/new-admin/ui";
import { ORDERS, ORDER_DETAIL, PRODUCTS } from "@/lib/new-admin/sample";

/**
 * One order (preview): what to send, what was paid or is to collect, who it
 * is for and how to reach them, and what has happened so far. The customer's
 * note sits at the top of the side, in colour, because it is the one thing a
 * packer must not miss.
 */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = ORDERS.find((x) => String(x.id) === id);
  if (!o) notFound();
  const detail = o.id === ORDER_DETAIL.id ? ORDER_DETAIL : null;
  const lines = (detail?.lines ?? PRODUCTS.slice(o.id % 5, (o.id % 5) + o.items).map((p) => ({ slug: p.slug, qty: 1, size: "M", price: p.price }))).map((l) => ({ ...l, p: PRODUCTS.find((p) => p.slug === l.slug)! }));
  const subtotal = lines.reduce((t, l) => t + l.price * l.qty, 0);
  const cod = o.payment === "Cash on delivery";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/new-admin/orders" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0a0a0a]/55 hover:text-[#0a0a0a]">
            <ArrowLeft className="h-4 w-4" /> Orders
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="text-[24px] font-semibold tracking-[-0.02em]">#{o.id}</h1>
            {o.paid ? <Pill tone="good">Paid</Pill> : <Pill tone="wait">{cod ? "Collect on delivery" : "Awaiting payment"}</Pill>}
            {o.fulfilled === "Fulfilled" ? <Pill tone="off">Fulfilled</Pill> : o.fulfilled === "Returned" ? <Pill tone="bad">Returned</Pill> : <Pill tone="info">Unfulfilled</Pill>}
          </div>
          <p className="mt-1 text-[13.5px] text-[#0a0a0a]/55">{detail?.when ?? o.when} · from the online store</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button><Printer className="h-4 w-4" /> Print slip</Button>
          {cod && !o.paid && <Button>Mark as confirmed</Button>}
          <Button primary><Package className="h-4 w-4" /> Fulfil items</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title={o.fulfilled === "Fulfilled" ? "Sent" : "To send"} action={<span className="text-[12.5px] font-semibold text-[#0a0a0a]/50">{lines.length} item{lines.length > 1 ? "s" : ""}</span>}>
            <ul className="divide-y divide-[#0a0a0a]/[0.06]">
              {lines.map((l) => (
                <li key={l.slug} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <Image src={l.p.image} alt="" width={56} height={56} className="h-14 w-14 rounded-lg bg-[#f0f0f0] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium">{l.p.name}</p>
                    <p className="text-[13px] text-[#0a0a0a]/55">Size {l.size} · SKU {l.slug.toUpperCase().replace("-", "")}-{l.size}</p>
                  </div>
                  <p className="text-[13.5px] text-[#0a0a0a]/60">{pkr(l.price)} × {l.qty}</p>
                  <p className="w-24 text-right text-[14.5px] font-semibold tabular-nums">{pkr(l.price * l.qty)}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title={cod && !o.paid ? "To collect on delivery" : "Payment"}>
            <dl className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between"><dt className="text-[#0a0a0a]/60">Subtotal</dt><dd className="tabular-nums">{pkr(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#0a0a0a]/60">Delivery</dt><dd>{subtotal >= 10000 ? "Free (over 10,000)" : pkr(200)}</dd></div>
              <div className="mt-1 flex justify-between border-t border-[#0a0a0a]/[0.08] pt-3 text-[15.5px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{pkr(o.total)}</dd></div>
              <div className="flex justify-between text-[13.5px]"><dt className="text-[#0a0a0a]/60">Paid by</dt><dd>{o.payment}</dd></div>
            </dl>
          </Card>

          <Card title="Timeline">
            <div className="mb-4 flex items-center gap-2 rounded-[10px] bg-[#f5f5f5] px-3.5 py-2.5 text-[14px] text-[#0a0a0a]/40">Leave a note for your team…</div>
            <ol className="relative ml-1.5 flex flex-col gap-4 border-l border-[#0a0a0a]/10 pl-5">
              {(detail?.timeline ?? [{ at: o.when, text: `Order placed by ${o.customer}.` }, { at: o.when, text: "Confirmation email sent." }]).map((e, i) => (
                <li key={i} className="relative text-[14px]">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[#0a0a0a]" />
                  <p>{e.text}</p>
                  <p className="text-[12.5px] text-[#0a0a0a]/45">{e.at}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {(detail?.note || o.note) && (
            <section className="rounded-2xl bg-[#fff6dc] p-5 ring-1 ring-[#e8c46a]/50">
              <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#7a4b00]"><NotebookText className="h-4 w-4" /> Customer note</p>
              <p className="mt-2 text-[14.5px] leading-relaxed">{detail?.note ?? "Please call before delivery."}</p>
            </section>
          )}
          <Card title="Customer">
            <p className="text-[15px] font-semibold">{o.customer}</p>
            <p className="text-[13px] text-[#0a0a0a]/55">{detail?.customer.orders ?? 1} orders · {o.city}</p>
            <div className="mt-4 flex flex-col gap-1.5 text-[13.5px]">
              <p className="flex items-center justify-between gap-2">{detail?.customer.email ?? "customer@example.com"} <Copy className="h-3.5 w-3.5 text-[#0a0a0a]/35" /></p>
              <p>{detail?.customer.phone ?? "0300 0000000"}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12"><Phone className="h-4 w-4" /> Call</span>
              <span className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[#b8efd6] py-2 text-[13px] font-semibold"><MessageCircle className="h-4 w-4" /> WhatsApp</span>
            </div>
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">Deliver to</p>
            <p className="mt-1 text-[13.5px] leading-relaxed">{detail?.customer.address ?? `${o.city}, Pakistan`}</p>
          </Card>
          <Card title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {["Gift", "Repeat customer"].map((t) => <span key={t} className="rounded-md bg-[#f0f0f0] px-2 py-1 text-[12.5px] font-medium">{t}</span>)}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
