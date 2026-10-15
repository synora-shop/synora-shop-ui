"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Send, ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { remindCheckout } from "@/app/admin/orders/abandoned/actions";

/**
 * The abandoned checkouts table (new admin, 15 October): who, what was in the
 * cart, when, the total, and Remind. Remind emails them when there is an
 * address, or opens WhatsApp with the message written when there is only a
 * phone number.
 */
export type AbandonedRow = {
  id: string;
  who: string;
  contact: string;
  cart: string;
  when: string;
  total: string;
  reminded: string | null;
  channel: "email" | "whatsapp";
};

const GRID = "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_8rem_7rem_8.5rem] lg:items-center";

export function AbandonedList({ rows }: { rows: AbandonedRow[] }) {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const [done, setDone] = useState<Record<string, true>>({});

  function remind(row: AbandonedRow) {
    setBusy(row.id);
    start(async () => {
      const result = await remindCheckout(row.id);
      setBusy(null);
      if (!result.ok) {
        toast.error(result.error, { blocking: true });
        return;
      }
      setDone((d) => ({ ...d, [row.id]: true }));
      if (result.sent === "whatsapp" && result.whatsappUrl) {
        window.open(result.whatsappUrl, "_blank", "noopener");
        toast.success(`WhatsApp opened with a reminder for ${row.who}.`);
      } else {
        toast.success(`Reminder emailed to ${row.who}.`);
      }
    });
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Nobody has left a checkout"
        description="When someone gives their email or phone at checkout and stops, they appear here half an hour later, ready to remind."
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
      <div role="row" className={`hidden gap-4 bg-[#0a0a0a] px-5 py-2.5 ${GRID}`}>
        {["Who", "In the cart", "When"].map((h) => (
          <span key={h} role="columnheader" className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white/55">{h}</span>
        ))}
        <span role="columnheader" className="text-right text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white/55">Total</span>
        <span />
      </div>
      <ul className="divide-y divide-[#0a0a0a]/[0.06]">
        {rows.map((r) => {
          const reminded = done[r.id] ? "just now" : r.reminded;
          return (
            <li key={r.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 ${GRID}`}>
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-medium text-[#0a0a0a]">{r.who}</span>
                <span className="block truncate text-[12.5px] text-[#0a0a0a]/50">{r.contact}</span>
              </span>
              <span className="min-w-0 basis-full truncate text-[14px] text-[#0a0a0a]/70 lg:basis-auto">{r.cart}</span>
              <span className="text-[13.5px] text-[#0a0a0a]/60">{r.when}</span>
              <span className="text-[14px] font-semibold tabular-nums text-[#0a0a0a] lg:text-right">{r.total}</span>
              <span className="ml-auto flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => remind(r)}
                  disabled={busy === r.id}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-[#262626] disabled:opacity-50"
                >
                  {r.channel === "whatsapp" ? <MessageCircle className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                  {busy === r.id ? "Sending…" : "Remind"}
                </button>
                {reminded && <span className="text-[11.5px] text-[#0a0a0a]/45">Reminded {reminded}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
