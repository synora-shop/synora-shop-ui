"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Mail, MessageCircle, Phone, Send, Trash2 } from "lucide-react";
import { deleteEnquiry, saveEnquiryNotes, sendEnquiryQuote, updateEnquiryStatus } from "@/app/enquiry/actions";
import { StatePill, type PillTone } from "@/components/admin/kit";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useMoney } from "@/components/ui/currency";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { CustomField } from "@/lib/product-kind";
import { cn } from "@/lib/utils";
import { FieldLabel } from "@/components/merchant/form-shell";

/**
 * Enquiries (new admin, 15 October): bulk and made-to-order requests, as an
 * inbox. A row says who, how many of what, when, and where it stands; open it
 * and the request is on the left with a box to quote a price per piece, and
 * on the right the ways to reply and the stage to move it to.
 *
 * Quoting saves the price, marks it Quoted, and emails the customer (or
 * opens WhatsApp with the quote written, when there is no email). The team's
 * private notes are kept as they were.
 */
export type EnquiryRow = {
  id: string;
  productTitle: string;
  productSlug: string | null;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  quantity: number | null;
  message: string;
  notes: string | null;
  status: string;
  createdAt: string;
  quotedPrice: number | null;
  quotedAt: string | null;
  details: Record<string, string>;
  fields: CustomField[];
};

const STATUSES = ["NEW", "IN_PROGRESS", "QUOTED", "WON", "LOST"] as const;
const STATUS_META: Record<string, { label: string; tone: PillTone }> = {
  NEW: { label: "New", tone: "wait" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  QUOTED: { label: "Quoted", tone: "info" },
  WON: { label: "Won", tone: "good" },
  LOST: { label: "Lost", tone: "off" },
};

function waNumber(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.length < 10) return null;
  return d.startsWith("92") ? d : d.startsWith("0") ? `92${d.slice(1)}` : d;
}

export function EnquiryList({ enquiries }: { enquiries: EnquiryRow[] }) {
  const [openId, setOpenId] = useState<string | null>(enquiries.find((e) => e.status === "NEW")?.id ?? null);
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const router = useRouter();
  const money = useMoney();

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      try {
        await updateEnquiryStatus(id, status);
        toast.success(`Moved to ${STATUS_META[status].label.toLowerCase()}.`);
        router.refresh();
      } catch {
        toast.error("Couldn't update that enquiry.");
      }
    });
  }

  async function remove(row: EnquiryRow) {
    const ok = await confirm({
      title: `Delete ${row.name}’s enquiry?`,
      description: `${row.name}'s enquiry about ${row.productTitle} will be gone for good. There's no bin for enquiries.`,
      confirmLabel: "Delete enquiry",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteEnquiry(row.id);
        toast.success("Enquiry deleted.");
        router.refresh();
      } catch {
        toast.error("Couldn't delete that enquiry.");
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      {dialog}
      <ul className="divide-y divide-[#0a0a0a]/[0.06]">
        {enquiries.map((row) => {
          const open = openId === row.id;
          const meta = STATUS_META[row.status] ?? STATUS_META.NEW;
          const wa = waNumber(row.phone);
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : row.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#fafafa]"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-[#0a0a0a]">
                    {row.name}
                    {row.company && row.company !== row.name && <span className="text-[13px] font-normal text-[#0a0a0a]/50">{row.company}</span>}
                    {row.status === "NEW" && <span className="h-2 w-2 rounded-full bg-[#6666ff]" aria-label="New" />}
                  </span>
                  <span className="block truncate text-[13.5px] text-[#0a0a0a]/55">
                    {row.quantity ? `${row.quantity} × ` : ""}
                    {row.productTitle}
                  </span>
                </span>
                <span className="hidden text-[13px] text-[#0a0a0a]/50 sm:inline">{formatRelativeTime(new Date(row.createdAt))}</span>
                <StatePill tone={meta.tone}>{meta.label}</StatePill>
                <ChevronDown className={cn("h-4 w-4 text-[#0a0a0a]/40 transition-transform", open && "rotate-180")} />
              </button>

              {open && (
                <div className="grid gap-5 bg-[#fafafa] px-5 pb-5 pt-1 lg:grid-cols-[minmax(0,1fr)_17rem]">
                  <div className="flex flex-col gap-3">
                    <p className="whitespace-pre-wrap rounded-2xl bg-white px-4 py-3 text-[14.5px] leading-relaxed ring-1 ring-[#0a0a0a]/[0.07]">&ldquo;{row.message}&rdquo;</p>
                    {Object.keys(row.details).length > 0 && (
                      <dl className="grid gap-x-6 gap-y-1.5 rounded-2xl bg-white px-4 py-3 ring-1 ring-[#0a0a0a]/[0.07] sm:grid-cols-2">
                        {Object.entries(row.details).map(([key, value]) => (
                          <div key={key} className="flex items-baseline justify-between gap-3">
                            <dt className="text-[12.5px] text-[#0a0a0a]/55">{row.fields.find((f) => f.id === key)?.label ?? key}</dt>
                            <dd className="text-[13px] font-medium tabular-nums">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <QuoteBox row={row} money={money} />
                    <NotesBox id={row.id} initial={row.notes ?? ""} />
                  </div>

                  <aside className="flex flex-col gap-4">
                    <div>
                      <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">Reply</p>
                      <div className="flex flex-col gap-1.5">
                        {wa && (
                          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[14px] font-medium ring-1 ring-[#0a0a0a]/10 hover:ring-[#1f9d68]/40">
                            <MessageCircle className="h-4 w-4 text-[#1f9d68]" /> {row.phone}
                          </a>
                        )}
                        {/* mailto/tel rather than a reply box: the seller's own
                            mail keeps the thread, and we never store a reply we
                            can't prove was delivered. */}
                        <a href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${row.productTitle}`)}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[13.5px] ring-1 ring-[#0a0a0a]/10 hover:bg-[#f5f5f5]">
                          <Mail className="h-4 w-4 shrink-0 text-[#0a0a0a]/45" /> <span className="truncate">{row.email}</span>
                        </a>
                        <a href={`tel:${row.phone}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[13.5px] ring-1 ring-[#0a0a0a]/10 hover:bg-[#f5f5f5]">
                          <Phone className="h-4 w-4 text-[#0a0a0a]/45" /> Call
                        </a>
                        {row.productSlug && (
                          <Link href={`/product/${row.productSlug}`} target="_blank" className="flex items-center gap-2 px-1 py-1 text-[13px] font-semibold text-[#0a0a0a]/60 hover:text-[#0a0a0a]">
                            <ExternalLink className="h-3.5 w-3.5" /> View product
                          </Link>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#0a0a0a]/45">Move to</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={pending || row.status === s}
                            onClick={() => setStatus(row.id, s)}
                            className={cn(
                              "rounded-full px-3 py-1 text-[13px] font-semibold transition-colors disabled:opacity-100",
                              row.status === s ? "bg-[#ecebff] text-[#4b4bea] ring-1 ring-inset ring-[#6666ff]/25" : "bg-white ring-1 ring-[#0a0a0a]/15 hover:ring-[#0a0a0a]/40"
                            )}
                          >
                            {STATUS_META[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="button" disabled={pending} onClick={() => remove(row)} className="inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-[#a3330c] hover:underline">
                      <Trash2 className="h-4 w-4" /> Delete enquiry
                    </button>
                  </aside>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function QuoteBox({ row, money }: { row: EnquiryRow; money: (n: number) => string }) {
  const [price, setPrice] = useState(row.quotedPrice ? String(row.quotedPrice) : "");
  const [sending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const n = Number(price.replace(/[^\d]/g, ""));

  function send() {
    if (!n) return;
    start(async () => {
      const result = await sendEnquiryQuote(row.id, n);
      if (!result.ok) {
        toast.error(result.error, { blocking: true });
        return;
      }
      if (result.sent === "whatsapp" && result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener");
        toast.success("Quote saved. WhatsApp opened with it written out.");
      } else {
        toast.success(`Quote emailed to ${row.name}.`);
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-white p-2 ring-1 ring-[#0a0a0a]/[0.07]">
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Price per piece, e.g. 6,400"
          aria-label="Price per piece"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] outline-none"
        />
        <button type="button" onClick={send} disabled={sending || !n} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0a0a0a] px-4 text-[14px] font-semibold text-white disabled:opacity-40">
          <Send className="h-4 w-4" /> {sending ? "Sending…" : row.quotedPrice ? "Send again" : "Send quote"}
        </button>
      </div>
      {(n > 0 && row.quantity) || row.quotedAt ? (
        <p className="px-3 pb-1 pt-1.5 text-[12.5px] text-[#0a0a0a]/55">
          {n > 0 && row.quantity ? `${row.quantity} pieces come to ${money(n * row.quantity)}. ` : ""}
          {row.quotedAt && row.quotedPrice ? `Quoted ${money(row.quotedPrice)} a piece ${formatRelativeTime(new Date(row.quotedAt))}.` : ""}
        </p>
      ) : null}
    </div>
  );
}

function NotesBox({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const toast = useToast();

  async function persist() {
    if (notes === saved) return;
    try {
      await saveEnquiryNotes(id, notes);
      setSaved(notes);
    } catch {
      toast.error("Couldn't save those notes.");
    }
  }

  const notesId = useId();

  return (
    <div>
      <FieldLabel htmlFor={notesId}>Private notes</FieldLabel>
      <textarea
        id={notesId}
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={persist}
        placeholder="Waiting on fabric confirmation…"
        className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-[14px] outline-none ring-1 ring-[#0a0a0a]/10 focus:ring-2 focus:ring-[#0a0a0a]"
      />
      <p className="mt-1 text-[11.5px] text-[#0a0a0a]/45">Only your team sees this. Saves when you click away.</p>
    </div>
  );
}
