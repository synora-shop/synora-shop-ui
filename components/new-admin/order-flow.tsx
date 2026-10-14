"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, MessageCircle, Truck } from "lucide-react";
import { useToast } from "@/components/new-admin/shell";
import { STAGES, type Stage } from "@/lib/new-admin/sample";

/**
 * Where an order is, and the one thing to do next (preview). The five steps
 * of a Pakistani cash-on-delivery order as a stepper; the button names the
 * next step in words ("Confirm by phone", "Mark packed", "Hand to courier"),
 * and handing over asks for the tracking number there and then.
 */
const NEXT: Partial<Record<Stage, [Stage, string]>> = {
  Pending: ["Confirmed", "Confirm by phone"],
  Confirmed: ["Packed", "Mark packed"],
  Packed: ["Shipped", "Hand to courier"],
  Shipped: ["Delivered", "Mark delivered"],
};

export function OrderFlow({ start }: { start: Stage }) {
  const toast = useToast();
  const [stage, setStage] = useState<Stage>(start);
  const [tracking, setTracking] = useState("");
  const steps = STAGES.filter((s) => s !== "Cancelled");
  const at = steps.indexOf(stage as (typeof steps)[number]);
  const next = NEXT[stage];
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
      {stage === "Cancelled" ? (
        <p className="text-[14.5px] font-semibold text-[#a3330c]">This order was cancelled.</p>
      ) : (
        <ol className="flex items-center gap-2">
          {steps.map((s, i) => (
            <li key={s} className="flex min-w-0 flex-1 items-center gap-2">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${i < at ? "bg-[#0a0a0a] text-white" : i === at ? "bg-[#6666ff] text-white ring-4 ring-[#6666ff]/20" : "bg-[#f0f0f0] text-[#0a0a0a]/40"}`}>
                {i < at ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={`hidden truncate text-[13px] font-semibold sm:block ${i === at ? "" : "text-[#0a0a0a]/45"}`}>{s}</span>
              {i < steps.length - 1 && <span className={`h-0.5 min-w-3 flex-1 rounded-full ${i < at ? "bg-[#0a0a0a]" : "bg-[#0a0a0a]/10"}`} />}
            </li>
          ))}
        </ol>
      )}
      {next && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#0a0a0a]/[0.06] pt-4">
          {stage === "Packed" && (
            <label className="flex flex-1 items-center gap-2 rounded-[10px] bg-[#f5f5f5] px-3">
              <Truck className="h-4 w-4 text-[#0a0a0a]/45" />
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Leopards or TCS tracking number" className="h-10 min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
            </label>
          )}
          <span className="mr-auto text-[13px] text-[#0a0a0a]/55">{stage === "Pending" ? "Call or WhatsApp the customer to confirm a cash order before you pack it." : "Next step"}</span>
          <button
            type="button"
            onClick={() => {
              const before = stage;
              setStage(next[0]);
              toast(`#1048 ${next[1].toLowerCase()}${tracking ? `, tracking ${tracking}` : ""}`, () => setStage(before));
            }}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-[#0a0a0a] px-4 text-[13.5px] font-semibold text-white hover:bg-[#262626]"
          >
            {next[1]} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  );
}

/** Ready messages, so a merchant does not type the same three every day. */
export function WhatsAppTemplates({ name, id, phone }: { name: string; id: number; phone: string }) {
  const first = name.split(" ")[0];
  const msgs = [
    ["Confirm", `Assalam o Alaikum ${first}, this is Zohra Lawn. Can you confirm your order #${id} for delivery? Reply YES and we will send it today.`],
    ["On its way", `${first}, your order #${id} is on its way with Leopards. Track it here: leopardscourier.com`],
    ["Thank you", `Thank you for shopping with Zohra Lawn, ${first}. We hope you love it.`],
  ];
  const toast = useToast();
  return (
    <div className="flex flex-col gap-1.5">
      {msgs.map(([label, text]) => (
        <button key={label} type="button" onClick={() => toast(`WhatsApp opened for ${phone}`)} title={text} className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[13px] ring-1 ring-[#0a0a0a]/10 hover:bg-[#effcf6]">
          <MessageCircle className="h-4 w-4 shrink-0 text-[#1f9d68]" />
          <span className="min-w-0 flex-1"><b className="font-semibold">{label}</b> <span className="text-[#0a0a0a]/50">· {text.slice(0, 38)}…</span></span>
        </button>
      ))}
    </div>
  );
}

/** Previous and next order, by button or by J and K. */
export function OrderPager({ prev, next }: { prev?: number; next?: number }) {
  const router = useRouter();
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "j" && next) router.push(`/new-admin/orders/${next}`);
      if (e.key === "k" && prev) router.push(`/new-admin/orders/${prev}`);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [prev, next, router]);
  const b = "grid h-9 w-9 place-items-center rounded-[10px] ring-1 ring-[#0a0a0a]/12 hover:bg-white disabled:opacity-30";
  return (
    <span className="flex gap-1">
      <button type="button" aria-label="Newer order (K)" title="Newer order (K)" disabled={!prev} onClick={() => prev && router.push(`/new-admin/orders/${prev}`)} className={b}><ChevronLeft className="h-4 w-4" /></button>
      <button type="button" aria-label="Older order (J)" title="Older order (J)" disabled={!next} onClick={() => next && router.push(`/new-admin/orders/${next}`)} className={b}><ChevronRight className="h-4 w-4" /></button>
    </span>
  );
}
