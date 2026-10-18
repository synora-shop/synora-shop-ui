import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Mail, MessageCircle, NotebookText, Phone, Printer, Truck, User } from "lucide-react";
import { PageCrumb } from "@/components/admin/page-crumb";
import { Thumb } from "@/components/admin/product-elements";
import { DeleteOrderButton } from "@/components/admin/delete-order-button";
import { Panel, STAGE_TONE, StatePill, paymentState } from "@/components/admin/kit";
import { PageHeader } from "@/components/ui/primitives";
import { db } from "@/lib/data/shop";
import { getCurrency, getStoreSettings } from "@/lib/data/settings";
import { paymentLabel, statusLabel } from "@/lib/order-status-style";
import { formatMoney } from "@/lib/money";
import { addOrderNote, updateOrderStatus, updatePaymentStatus } from "../actions";

export const dynamic = "force-dynamic";

/**
 * One order (new admin, 15 October).
 *
 * What it needs next comes first: the five stages as a tracker, and one
 * button that moves it to the next one. Then what was ordered and what it came
 * to (and, for the merchant only, the profit); who it is going to, with a
 * call, an email and a ready WhatsApp message; and the payment, with one
 * press to mark it paid. Every change goes through the same two actions the
 * old screen used, updateOrderStatus and updatePaymentStatus, so nothing about
 * what a change does has moved. Any stage, Cancelled included, can still be
 * chosen directly.
 */
const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "AWAITING_VERIFICATION", "CONFIRMED", "FAILED"];
const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
const NEXT: Record<string, { to: string; label: string; hint: string }> = {
  PENDING: { to: "CONFIRMED", label: "Confirm the order", hint: "Call or WhatsApp the customer to confirm, especially a cash order, before you pack it." },
  CONFIRMED: { to: "PACKED", label: "Mark packed", hint: "Pack it with its packing slip." },
  PACKED: { to: "SHIPPED", label: "Mark shipped", hint: "Hand it to your courier." },
  SHIPPED: { to: "DELIVERED", label: "Mark delivered", hint: "Once the customer has it." },
};

const field = "h-10 w-full rounded-[10px] bg-[#f5f5f5] px-3 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]";

export default async function AdminOrderDetailPage(props: PageProps<"/admin/orders/[id]">) {
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const { id } = await props.params;
  const scoped = await db();
  const [order, settings] = await Promise.all([
    scoped.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: { select: { id: true, images: true } } } },
        events: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    }),
    getStoreSettings(),
  ]);
  if (!order || order.deletedAt) notFound();

  // The orders either side of this one, newest first as the list shows them.
  const [newer, older] = await Promise.all([
    scoped.order.findFirst({ where: { deletedAt: null, createdAt: { gt: order.createdAt } }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    scoped.order.findFirst({ where: { deletedAt: null, createdAt: { lt: order.createdAt } }, orderBy: { createdAt: "desc" }, select: { id: true } }),
  ]);

  const orderProfit = order.items.reduce((sum, i) => sum + (i.price - i.costPrice) * i.quantity, 0);
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const placed = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: settings.timeZone }).format(order.createdAt);
  const cod = order.paymentMethod === "COD";
  const pay = paymentState(order.paymentMethod, order.paymentStatus);
  const cancelled = order.orderStatus === "CANCELLED";
  const at = STEPS.indexOf(order.orderStatus as (typeof STEPS)[number]);
  const next = NEXT[order.orderStatus];
  const first = order.customerName.split(" ")[0];
  const digits = order.customerPhone.replace(/\D/g, "").replace(/^0/, "92");
  const store = settings.storeName || "our store";
  const messages = [
    ["Confirm", `Assalam o Alaikum ${first}, this is ${store}. Can you confirm your order #${order.id} of ${money(order.total)}? Reply YES and we will send it today.`],
    ["On its way", `${first}, your order #${order.id} from ${store} is on its way${order.courier ? ` with ${order.courier}` : ""}${order.trackingNumber ? `. Tracking number: ${order.trackingNumber}` : ""}.`],
    ["Thank you", `Thank you for shopping with ${store}, ${first}. We hope you love it.`],
  ] as const;

  return (
    <div className="space-y-4">
      <PageCrumb label={`Order ${order.id}`} />
      <PageHeader
        title={<span className="font-mono">#{order.id}</span>}
        meta={<><StatePill tone={pay.tone}>{pay.label}</StatePill><StatePill tone={STAGE_TONE[order.orderStatus] ?? "off"}>{statusLabel(order.orderStatus)}</StatePill></>}
        description={`Placed ${placed} · ${itemCount} item${itemCount === 1 ? "" : "s"}`}
        actions={
          <>
          <a href={`/admin/slips?ids=${order.id}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3.5 text-[13.5px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">
            <Printer className="h-4 w-4" /> Print slip
          </a>
          <DeleteOrderButton id={order.id} />
          <span className="flex">
            <Link aria-disabled={!newer} href={newer ? `/admin/orders/${newer.id}` : "#"} title="Newer order" aria-label="Newer order" className={`grid h-9 w-9 place-items-center rounded-l-[10px] bg-white ring-1 ring-[#0a0a0a]/12 ${newer ? "hover:bg-[#f5f5f5]" : "pointer-events-none opacity-35"}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link aria-disabled={!older} href={older ? `/admin/orders/${older.id}` : "#"} title="Older order" aria-label="Older order" className={`-ml-px grid h-9 w-9 place-items-center rounded-r-[10px] bg-white ring-1 ring-[#0a0a0a]/12 ${older ? "hover:bg-[#f5f5f5]" : "pointer-events-none opacity-35"}`}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </span>
          </>
        }
      />

      {/* Where it is, and the one thing to do next. */}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
        {cancelled ? (
          <p className="text-[14px] text-[#0a0a0a]/60">This order was cancelled. Choose another stage below to bring it back.</p>
        ) : (
          <>
            <ol className="flex items-center">
              {STEPS.map((s, i) => (
                <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
                  <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${i < at ? "bg-[#ddf5e9] text-[#11643f]" : i === at ? "bg-[#6666ff] text-white ring-4 ring-[#6666ff]/15" : "bg-[#f0f0f0] text-[#0a0a0a]/45"}`}>
                    {i < at ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={`hidden text-[13px] sm:inline ${i === at ? "font-semibold text-[#0a0a0a]" : "text-[#0a0a0a]/50"}`}>{statusLabel(s)}</span>
                  {i < STEPS.length - 1 && <span className={`mx-2 h-px flex-1 ${i < at ? "bg-[#6fd6a8]" : "bg-[#0a0a0a]/12"}`} />}
                </li>
              ))}
            </ol>
            {next && (
              <form action={updateOrderStatus} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#0a0a0a]/[0.07] pt-4">
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="orderStatus" value={next.to} />
                {next.to === "SHIPPED" ? (
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <input name="courier" defaultValue={order.courier ?? ""} placeholder="Courier, e.g. TCS" aria-label="Courier" maxLength={60} className="h-10 w-40 rounded-[10px] bg-[#f5f5f5] px-3 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]" />
                    <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} placeholder="Tracking number" aria-label="Tracking number" maxLength={80} className="h-10 min-w-0 flex-1 rounded-[10px] bg-[#f5f5f5] px-3 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]" />
                    <label className="flex items-center gap-2 text-[13px] text-[#0a0a0a]/70">
                      <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-[#6666ff]" /> Email the customer
                    </label>
                  </div>
                ) : (
                  <p className="text-[13.5px] text-[#0a0a0a]/60">{next.hint}</p>
                )}
                <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-4 text-[13.5px] font-semibold text-white hover:bg-[#262626]">
                  {next.label} <ChevronRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </>
        )}
      </section>

      {(order.courier || order.trackingNumber) && (
        <p className="-mt-2 flex items-center gap-2 text-[13.5px] text-[#0a0a0a]/65">
          <Truck className="h-4 w-4" /> With {order.courier || "the courier"}
          {order.trackingNumber && <> · tracking <b className="font-mono font-semibold text-[#0a0a0a]">{order.trackingNumber}</b></>}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          <Panel title="What was ordered" action={<span className="text-[12.5px] text-[#0a0a0a]/50">{itemCount} item{itemCount === 1 ? "" : "s"}</span>}>
            <ul className="divide-y divide-[#0a0a0a]/[0.06]">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3">
                  <Thumb src={item.product?.images[0]} size="row" />
                  <div className="min-w-0 flex-1">
                    {item.product ? (
                      <Link href={`/admin/products/${item.product.id}`} className="block truncate text-[14.5px] font-medium text-[#0a0a0a] underline-offset-2 hover:underline">{item.title}</Link>
                    ) : (
                      <p className="truncate text-[14.5px] font-medium text-[#0a0a0a]">{item.title}</p>
                    )}
                    <p className="truncate text-[12.5px] text-[#0a0a0a]/50">{[item.size, item.color].filter(Boolean).join(" · ") || "No options"}</p>
                  </div>
                  <span className="text-[13px] tabular-nums text-[#0a0a0a]/55">{money(item.price)} × {item.quantity}</span>
                  <span className="w-24 text-right text-[14.5px] font-semibold tabular-nums text-[#0a0a0a]">{money(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-[#0a0a0a]/[0.08] pt-3 text-[14px]">
              <div className="flex justify-between"><dt className="text-[#0a0a0a]/60">Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-[#0a0a0a]/60">Discount{order.discountCode ? ` (${order.discountCode})` : ""}</dt><dd className="tabular-nums">−{money(order.discountAmount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-[#0a0a0a]/60">Delivery</dt><dd className="tabular-nums">{order.shippingFee === 0 ? "Free" : money(order.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-[#0a0a0a]/[0.08] pt-2.5 text-[15.5px] font-semibold"><dt>{cod && order.paymentStatus !== "CONFIRMED" ? "To collect on delivery" : "Total"}</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
            </dl>
          </Panel>

          <section className="rounded-[16px] bg-[#f5f5ff] p-4 ring-1 ring-[#6666ff]/20">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-[#4b4bea]">Only you see this</p>
            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <p className="text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-[#0a0a0a]">{money(orderProfit)} <span className="text-[13px] font-medium text-[#0a0a0a]/50">profit</span></p>
              <p className="text-[13px] font-medium text-[#0a0a0a]/60">{order.total > 0 ? `${((orderProfit / order.total) * 100).toFixed(0)}% margin` : ""}</p>
            </div>
            <p className="mt-0.5 text-[12px] text-[#0a0a0a]/45">From what each product cost when the order was placed, so it stays right if you change a price later.</p>
          </section>

          <Panel title="Timeline">
            <form action={addOrderNote} className="mb-4 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <input name="note" placeholder="Leave a note for your team…" aria-label="Note for your team" maxLength={1000} className="h-10 min-w-0 flex-1 rounded-[10px] bg-[#f5f5f5] px-3.5 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]" />
              <button type="submit" className="rounded-[10px] bg-[#0a0a0a] px-4 text-[13px] font-semibold text-white">Add</button>
            </form>
            <ol className="relative ml-1.5 flex flex-col gap-4 border-l border-[#0a0a0a]/10 pl-5">
              {[
                ...order.events.map((e) => ({ id: e.id, kind: e.kind, text: e.text, by: e.by, at: e.createdAt })),
                { id: "placed", kind: "placed", text: `Order placed by ${order.customerName}.`, by: "", at: order.createdAt },
              ].map((e) => (
                <li key={e.id} className="relative text-[14px]">
                  <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${e.kind === "note" ? "bg-[#6666ff]" : "bg-[#0a0a0a]"}`} />
                  <p className={e.kind === "note" ? "rounded-lg bg-[#f5f5ff] px-3 py-2" : ""}>{e.text}</p>
                  <p className="mt-0.5 text-[12.5px] text-[#0a0a0a]/45">
                    {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: settings.timeZone }).format(e.at)}
                    {e.by ? ` · ${e.by}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4">
          {order.notes && (
            <section className="rounded-2xl bg-[#fff6dc] p-5 ring-1 ring-[#e8c46a]/50">
              <p className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-[#7a4b00]"><NotebookText className="h-4 w-4" /> Note from the customer</p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-[#0a0a0a]">{order.notes}</p>
            </section>
          )}

          <Panel title="Customer">
            {order.customerId ? (
              <Link href={`/admin/customers/${order.customerId}`} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#0a0a0a] underline-offset-2 hover:underline">
                <User className="h-4 w-4 text-[#0a0a0a]/40" /> {order.customerName}
              </Link>
            ) : (
              <p className="text-[15px] font-semibold text-[#0a0a0a]">{order.customerName}</p>
            )}
            <div className="mt-3 flex flex-col gap-1.5 text-[13.5px]">
              <a href={`mailto:${order.customerEmail}`} className="inline-flex items-center gap-2 break-all hover:underline"><Mail className="h-4 w-4 shrink-0 text-[#0a0a0a]/40" /> {order.customerEmail}</a>
              <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-2 hover:underline"><Phone className="h-4 w-4 shrink-0 text-[#0a0a0a]/40" /> {order.customerPhone}</a>
            </div>
            {digits.length >= 10 && (
              <div className="mt-4 flex flex-col gap-1.5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">WhatsApp</p>
                {messages.map(([label, text]) => (
                  <a
                    key={label}
                    href={`https://wa.me/${digits}?text=${encodeURIComponent(text)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 ring-1 ring-[#0a0a0a]/10 hover:bg-[#f5fbf7] hover:ring-[#1f9d68]/40"
                  >
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#1f9d68]" />
                    <span className="min-w-0 text-[13px]"><b className="font-semibold">{label}</b> <span className="text-[#0a0a0a]/55">· {text.slice(0, 48)}…</span></span>
                  </a>
                ))}
              </div>
            )}
            <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">Deliver to</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#0a0a0a]">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
              <br />
              {order.shippingCity}, {order.shippingProvince} {order.shippingPostalCode}
            </p>
          </Panel>

          <Panel title="Payment" action={<StatePill tone={pay.tone}>{pay.label}</StatePill>}>
            <p className="text-[13.5px] text-[#0a0a0a]/60">By {paymentLabel(order.paymentMethod)}</p>
            {order.paymentStatus !== "CONFIRMED" && !cancelled && (
              <form action={updatePaymentStatus} className="mt-3">
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="paymentStatus" value="CONFIRMED" />
                <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0a0a0a] text-[13.5px] font-semibold text-white hover:bg-[#262626]">
                  <Check className="h-4 w-4" /> {cod ? "Mark cash received" : "Mark as paid"}
                </button>
              </form>
            )}
            <form action={updatePaymentStatus} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <label className="min-w-0 flex-1">
                <span className="sr-only">Payment status</span>
                <select name="paymentStatus" defaultValue={order.paymentStatus} className={field}>
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </label>
              <button type="submit" className="rounded-[10px] px-3.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">Save</button>
            </form>
          </Panel>

          <Panel title="Set the stage directly">
            <form action={updateOrderStatus} className="flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <label className="min-w-0 flex-1">
                <span className="sr-only">Order stage</span>
                <select name="orderStatus" defaultValue={order.orderStatus} className={field}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </label>
              <button type="submit" className="rounded-[10px] px-3.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">Save</button>
            </form>
            <p className="mt-2 text-[12.5px] text-[#0a0a0a]/50">For going back a stage, or cancelling.</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
