"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, PackageCheck, Search, Trash2, X } from "lucide-react";
import { completeDraftOrder, deleteDraftOrder, saveDraftOrder, sendDraftOrder, type DraftInput } from "@/app/admin/orders/drafts/actions";
import { useEditor } from "@/components/admin/use-editor";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useMoney } from "@/components/ui/currency";
import { FieldLabel } from "@/components/merchant/form-shell";
import { StatePill } from "@/components/admin/kit";
import { PageHeader, buttonClass } from "@/components/ui/primitives";
import { paymentLabel } from "@/lib/order-status-style";
import { DRAFT_CHANNELS, DRAFT_PAYMENTS, draftLabel, draftTotals, type CatalogueItem, type DraftStatus } from "@/lib/draft-orders";

/**
 * Building an order by hand (new admin, 15 October): who it is for, what is
 * in it at what price, where it goes and how it is paid. Then send the
 * summary to the customer to confirm, and make it an order.
 *
 * Every action saves first, so what is sent or ordered is what is on screen.
 */
type Draft = Omit<DraftInput, "id">;

const field = "h-10 w-full rounded-[10px] bg-[#f5f5f5] px-3 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:bg-white focus:ring-2 focus:ring-[#0a0a0a]";
const box = "rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]";

export function DraftOrderEditor({
  id,
  number,
  status,
  initial,
  catalogue,
  cities,
}: {
  id?: string;
  number?: number;
  status: DraftStatus;
  initial: Draft;
  catalogue: CatalogueItem[];
  cities: string[];
}) {
  const router = useRouter();
  const money = useMoney();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [draft, setDraft] = useState<Draft>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [busy, start] = useTransition();
  const [query, setQuery] = useState("");
  const dirty = JSON.stringify(draft) !== saved || !id;

  const byVariant = useMemo(() => new Map(catalogue.map((c) => [c.variantId, c])), [catalogue]);
  const totals = draftTotals(draft);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalogue.filter((c) => `${c.title} ${c.option} ${c.sku}`.toLowerCase().includes(q)).slice(0, 8);
  }, [catalogue, query]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setLine = (i: number, patch: Partial<Draft["lines"][number]>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  function add(c: CatalogueItem) {
    setDraft((d) => {
      const at = d.lines.findIndex((l) => l.variantId === c.variantId);
      if (at >= 0) return { ...d, lines: d.lines.map((l, j) => (j === at ? { ...l, quantity: l.quantity + 1 } : l)) };
      return { ...d, lines: [...d.lines, { variantId: c.variantId, quantity: 1, price: c.price }] };
    });
    setQuery("");
  }

  /** Save, and give back the draft's id (new on the first save). */
  async function persist(): Promise<string | null> {
    const result = await saveDraftOrder({ ...draft, id });
    if (!result.ok) {
      toast.error(result.error, { blocking: true });
      return null;
    }
    setSaved(JSON.stringify(draft));
    return result.id;
  }

  function save() {
    start(async () => {
      const savedId = await persist();
      if (!savedId) return;
      toast.success("Draft saved.");
      if (!id) router.replace(`/admin/orders/drafts/${savedId}`);
      else router.refresh();
    });
  }

  function send() {
    // Opened now, while the click still counts as the merchant's, or the
    // browser treats the WhatsApp tab as a popup and blocks it.
    const tab = draft.customerPhone.replace(/\D/g, "").length >= 10 ? window.open("about:blank", "_blank") : null;
    start(async () => {
      const savedId = await persist();
      if (!savedId) return tab?.close();
      const result = await sendDraftOrder(savedId);
      if (!result.ok) {
        tab?.close();
        toast.error(result.error, { blocking: true });
        return;
      }
      if (result.whatsappUrl && tab) tab.location.href = result.whatsappUrl;
      else tab?.close();
      toast.success(result.whatsappUrl ? (result.emailed ? "WhatsApp opened, and emailed too." : "WhatsApp opened with the summary.") : "Emailed to the customer.");
      if (!id) router.replace(`/admin/orders/drafts/${savedId}`);
      else router.refresh();
    });
  }

  async function complete() {
    const ok = await confirm({
      title: "Make this an order?",
      description: `It becomes an ordinary order, confirmed, for ${money(totals.total)}, and the stock is taken. ${draft.customerEmail ? "The customer is emailed their confirmation." : ""}`,
      confirmLabel: "Make it an order",
    });
    if (!ok) return;
    start(async () => {
      const savedId = await persist();
      if (!savedId) return;
      const result = await completeDraftOrder(savedId);
      if (!result.ok) {
        toast.error(result.error, { blocking: true });
        return;
      }
      toast.success(`Order #${result.orderId} made.`);
      router.push(`/admin/orders/${result.orderId}`);
    });
  }

  async function remove() {
    if (!id) return router.push("/admin/orders/drafts");
    const ok = await confirm({ title: "Delete this draft?", description: "It cannot be brought back.", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    start(async () => {
      const result = await deleteDraftOrder(id);
      if (!result.ok) return toast.error(result.error, { blocking: true });
      setSaved(JSON.stringify(draft));
      router.push("/admin/orders/drafts");
    });
  }

  useEditor({ dirty: dirty && !busy, saving: busy, onSave: save, onDiscard: () => setDraft(JSON.parse(saved) as Draft) });

  return (
    <div className="space-y-4">
      {dialog}
      <PageHeader
        title={number ? `#${draftLabel(number)}` : "New draft order"}
        crumbs={[{ label: "Draft orders", href: "/admin/orders/drafts" }]}
        meta={status === "SENT" ? <StatePill tone="info">Sent to confirm</StatePill> : <StatePill tone="off">Open</StatePill>}
        actions={
          <>
            <button type="button" onClick={remove} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-[13.5px] font-semibold text-[#a3330c] hover:bg-[#ffe9e2]">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button type="button" onClick={send} disabled={busy} className={buttonClass("secondary", "md")}>
              <MessageCircle className="h-4 w-4" /> {status === "SENT" ? "Send again" : "Send to customer"}
            </button>
            <button type="button" onClick={complete} disabled={busy} className={buttonClass("primary", "md")}>
              <PackageCheck className="h-4 w-4" /> Make it an order
            </button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <section className={box}>
            <h2 className="mb-3 text-[15px] font-semibold">What they are buying</h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0a0a0a]/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && matches[0]) {
                    e.preventDefault();
                    add(matches[0]);
                  }
                }}
                placeholder="Search products by name or SKU"
                aria-label="Search products to add"
                className={`${field} pl-9`}
              />
              {matches.length > 0 && (
                <ul role="listbox" className="absolute inset-x-0 top-11 z-20 max-h-80 overflow-y-auto rounded-xl bg-white p-1 shadow-[0_12px_32px_rgba(0,0,0,0.14)] ring-1 ring-[#0a0a0a]/10">
                  {matches.map((c) => (
                    <li key={c.variantId}>
                      <button type="button" onClick={() => add(c)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-[#f5f5f5]">
                        {c.image ? <Image src={c.image} alt="" width={32} height={32} className="h-8 w-8 rounded-md object-cover" /> : <span className="h-8 w-8 rounded-md bg-[#f0f0f0]" />}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium">{c.title}</span>
                          <span className="block text-[12px] text-[#0a0a0a]/50">{[c.option, c.sku].filter(Boolean).join(" · ")}</span>
                        </span>
                        <span className="text-right text-[13px]">
                          <span className="block font-semibold tabular-nums">{money(c.price)}</span>
                          {c.stock !== null && <span className={`block text-[12px] ${c.stock <= 0 ? "text-[#a3330c]" : "text-[#0a0a0a]/50"}`}>{c.stock <= 0 ? "Sold out" : `${c.stock} left`}</span>}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {draft.lines.length === 0 ? (
              <p className="py-8 text-center text-[13.5px] text-[#0a0a0a]/50">Search above to add what the customer asked for.</p>
            ) : (
              <ul className="mt-3 divide-y divide-[#0a0a0a]/[0.06]">
                {draft.lines.map((l, i) => {
                  const c = byVariant.get(l.variantId);
                  const short = c && c.stock !== null && c.stock < l.quantity;
                  return (
                    <li key={l.variantId} className="flex flex-wrap items-center gap-3 py-3">
                      {c?.image ? <Image src={c.image} alt="" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-[#f0f0f0]" />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium">{c?.title ?? "No longer in your catalogue"}</span>
                        <span className={`block text-[12.5px] ${short ? "text-[#a3330c]" : "text-[#0a0a0a]/50"}`}>
                          {[c?.option, short ? `only ${Math.max(0, c!.stock!)} left` : null].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        aria-label="Quantity"
                        value={l.quantity}
                        onChange={(e) => setLine(i, { quantity: Math.max(1, Math.min(999, Math.trunc(Number(e.target.value) || 1))) })}
                        className="h-9 w-16 rounded-[10px] bg-[#f5f5f5] px-2 text-center text-[14px] tabular-nums outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]"
                      />
                      <span className="text-[13px] text-[#0a0a0a]/45">×</span>
                      <input
                        type="number"
                        min={0}
                        aria-label="Price each"
                        value={l.price}
                        onChange={(e) => setLine(i, { price: Math.max(0, Math.trunc(Number(e.target.value) || 0)) })}
                        className="h-9 w-24 rounded-[10px] bg-[#f5f5f5] px-2 text-right text-[14px] tabular-nums outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]"
                      />
                      <b className="w-24 text-right text-[14px] font-semibold tabular-nums">{money(l.price * l.quantity)}</b>
                      <button type="button" aria-label="Remove" onClick={() => set("lines", draft.lines.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-lg text-[#0a0a0a]/45 hover:bg-[#f5f5f5] hover:text-[#0a0a0a]">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={box}>
            <h2 className="mb-3 text-[15px] font-semibold">What it comes to</h2>
            <dl className="space-y-2.5 text-[14px]">
              <div className="flex justify-between"><dt className="text-[#0a0a0a]/60">Subtotal</dt><dd className="tabular-nums">{money(totals.subtotal)}</dd></div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#0a0a0a]/60"><label htmlFor="d-discount">Discount</label></dt>
                <dd><input id="d-discount" type="number" min={0} value={draft.discountAmount} onChange={(e) => set("discountAmount", Math.max(0, Math.trunc(Number(e.target.value) || 0)))} className="h-9 w-28 rounded-[10px] bg-[#f5f5f5] px-2 text-right tabular-nums outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]" /></dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[#0a0a0a]/60"><label htmlFor="d-delivery">Delivery</label></dt>
                <dd><input id="d-delivery" type="number" min={0} value={draft.shippingFee} onChange={(e) => set("shippingFee", Math.max(0, Math.trunc(Number(e.target.value) || 0)))} className="h-9 w-28 rounded-[10px] bg-[#f5f5f5] px-2 text-right tabular-nums outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]" /></dd>
              </div>
              <div className="flex justify-between border-t border-[#0a0a0a]/[0.07] pt-2.5 text-[16px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(totals.total)}</dd></div>
            </dl>
          </section>
        </div>

        <div className="space-y-5">
          <section className={`${box} space-y-3`}>
            <h2 className="text-[15px] font-semibold">Customer</h2>
            <div><FieldLabel htmlFor="d-name">Name</FieldLabel><input id="d-name" value={draft.customerName} onChange={(e) => set("customerName", e.target.value)} maxLength={120} className={field} /></div>
            <div><FieldLabel htmlFor="d-phone">Phone</FieldLabel><input id="d-phone" inputMode="tel" value={draft.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} placeholder="0300 1234567" maxLength={30} className={field} /></div>
            <div><FieldLabel htmlFor="d-email">Email (optional)</FieldLabel><input id="d-email" type="email" value={draft.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} maxLength={200} className={field} /></div>
            <div>
              <FieldLabel htmlFor="d-channel">Came in by</FieldLabel>
              <select id="d-channel" value={draft.channel} onChange={(e) => set("channel", e.target.value)} className={field}>
                {DRAFT_CHANNELS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </section>

          <section className={`${box} space-y-3`}>
            <h2 className="text-[15px] font-semibold">Deliver to</h2>
            <div><FieldLabel htmlFor="d-line1">Address</FieldLabel><input id="d-line1" value={draft.shippingLine1} onChange={(e) => set("shippingLine1", e.target.value)} maxLength={200} className={field} /></div>
            <div><FieldLabel htmlFor="d-line2">Area or landmark (optional)</FieldLabel><input id="d-line2" value={draft.shippingLine2} onChange={(e) => set("shippingLine2", e.target.value)} maxLength={200} className={field} /></div>
            <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
              <div>
                <FieldLabel htmlFor="d-city">City</FieldLabel>
                <select id="d-city" value={draft.shippingCity} onChange={(e) => set("shippingCity", e.target.value)} className={field}>
                  <option value="">Choose…</option>
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><FieldLabel htmlFor="d-post">Postcode</FieldLabel><input id="d-post" value={draft.shippingPostalCode} onChange={(e) => set("shippingPostalCode", e.target.value)} maxLength={20} className={field} /></div>
            </div>
          </section>

          <section className={`${box} space-y-3`}>
            <h2 className="text-[15px] font-semibold">Payment and note</h2>
            <div>
              <FieldLabel htmlFor="d-pay">How they pay</FieldLabel>
              <select id="d-pay" value={draft.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} className={field}>
                {DRAFT_PAYMENTS.map((p) => <option key={p} value={p}>{paymentLabel(p)}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={draft.paid} onChange={(e) => set("paid", e.target.checked)} className="h-4 w-4 accent-[#6666ff]" />
              Already paid
            </label>
            <div>
              <FieldLabel htmlFor="d-notes">Note on the order (optional)</FieldLabel>
              <textarea id="d-notes" rows={3} value={draft.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} placeholder="Gift message or special instructions" className="w-full rounded-[10px] bg-[#f5f5f5] px-3 py-2 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:bg-white focus:ring-2 focus:ring-[#0a0a0a]" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
