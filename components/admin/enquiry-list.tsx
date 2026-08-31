"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Mail, Phone, Trash2 } from "lucide-react";
import {
  deleteEnquiry,
  saveEnquiryNotes,
  updateEnquiryStatus,
} from "@/app/enquiry/actions";
import { Badge, Button } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { CustomField } from "@/lib/product-kind";
import { cn } from "@/lib/utils";

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
  details: Record<string, string>;
  fields: CustomField[];
};

const STATUSES = ["NEW", "IN_PROGRESS", "QUOTED", "WON", "LOST"] as const;

const STATUS_META: Record<string, { label: string; tone: "neutral" | "brand" | "good" | "warn" | "bad" }> = {
  NEW: { label: "New", tone: "warn" },
  IN_PROGRESS: { label: "In progress", tone: "brand" },
  QUOTED: { label: "Quoted", tone: "brand" },
  WON: { label: "Won", tone: "good" },
  LOST: { label: "Lost", tone: "neutral" },
};

/**
 * The enquiry inbox.
 *
 * Rows expand in place rather than opening a detail page: an enquiry is short,
 * and the job is triage — read it, reply, set a status — which is faster in one
 * list than through a round trip per item.
 */
export function EnquiryList({ enquiries }: { enquiries: EnquiryRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { confirm, dialog } = useConfirm();
  const toast = useToast();
  const router = useRouter();

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      try {
        await updateEnquiryStatus(id, status);
        toast.success(`Marked ${STATUS_META[status].label.toLowerCase()}.`);
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
    <div className="space-y-2">
      {dialog}
      {enquiries.map((row) => {
        const open = openId === row.id;
        const meta = STATUS_META[row.status] ?? STATUS_META.NEW;
        return (
          <div key={row.id} className="overflow-hidden rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : row.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-subtle"
            >
              <ChevronDown
                className={cn("h-4 w-4 flex-shrink-0 text-ink-faint transition-transform", open && "rotate-180")}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{row.name}</span>
                  {row.company && <span className="text-xs text-ink-soft">{row.company}</span>}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-soft">
                  {row.productTitle}
                  {row.quantity ? ` · ${row.quantity} units` : ""}
                </span>
              </span>
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <span className="hidden flex-shrink-0 font-mono text-[11px] tabular-nums text-ink-faint sm:block">
                {formatRelativeTime(new Date(row.createdAt))}
              </span>
            </button>

            {open && (
              <div className="border-t border-border px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {/* mailto/tel rather than a reply box: the seller's own mail
                      client keeps the thread, and we never store a reply we
                      can't prove was delivered. */}
                  <a
                    href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${row.productTitle}`)}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-subtle"
                  >
                    <Mail className="h-3.5 w-3.5" /> {row.email}
                  </a>
                  <a
                    href={`tel:${row.phone}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-subtle"
                  >
                    <Phone className="h-3.5 w-3.5" /> {row.phone}
                  </a>
                  {row.productSlug && (
                    <Link
                      href={`/product/${row.productSlug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-subtle"
                    >
                      View product
                    </Link>
                  )}
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{row.message}</p>

                {Object.keys(row.details).length > 0 && (
                  <dl className="mt-4 grid gap-x-6 gap-y-1.5 rounded-lg bg-subtle p-3 sm:grid-cols-2">
                    {Object.entries(row.details).map(([key, value]) => (
                      <div key={key} className="flex items-baseline justify-between gap-3">
                        <dt className="text-xs text-ink-soft">
                          {row.fields.find((f) => f.id === key)?.label ?? key}
                        </dt>
                        <dd className="font-mono text-xs tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <NotesBox id={row.id} initial={row.notes ?? ""} />

                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={pending || row.status === s}
                      onClick={() => setStatus(row.id, s)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-100",
                        row.status === s
                          ? "bg-brand-600 text-white"
                          : "border border-border text-ink-soft hover:bg-subtle"
                      )}
                    >
                      {STATUS_META[s].label}
                    </button>
                  ))}
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-auto"
                    disabled={pending}
                    onClick={() => remove(row)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Private notes, saved on blur so there's no button to forget to press. */
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

  return (
    <div className="mt-4">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        Private notes
      </label>
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={persist}
        placeholder="Quoted 480/unit, waiting on fabric confirmation…"
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-300"
      />
      <p className="mt-1 text-[11px] text-ink-faint">
        Only you can see this. Saves when you click away.
      </p>
    </div>
  );
}
