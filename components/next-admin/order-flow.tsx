"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, MessageCircle, Truck } from "lucide-react";
import { useToast } from "@/components/next-admin/bits";
import { btn } from "@/components/next-admin/ui";
import { A } from "@/components/next-admin/nav";
import { STAGES, type Stage } from "@/lib/new-admin/sample";

/**
 * Where an order is, and the one thing to do next, on one line (third
 * design): the five steps small on the left, the next step's button on the
 * right, and the courier's tracking number in between when it is asked for.
 */
const NEXT: Partial<Record<Stage, [Stage, string]>> = {
  Pending: ["Confirmed", "Confirm by phone"],
  Confirmed: ["Packed", "Mark packed"],
  Packed: ["Shipped", "Hand to courier"],
  Shipped: ["Delivered", "Mark delivered"],
};

export function OrderFlow({ start, id }: { start: Stage; id: number }) {
  const toast = useToast();
  const [stage, setStage] = useState<Stage>(start);
  const [tracking, setTracking] = useState("");
  const steps = STAGES.filter((s) => s !== "Cancelled");
  const at = steps.indexOf(stage as (typeof steps)[number]);
  const next = NEXT[stage];
  if (stage === "Cancelled") return <p className="rounded-[16px] border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-[13px] font-medium text-[#b91c1c]">This order was cancelled.</p>;
  return (
    <section className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-[#ebebeb] bg-white px-3 py-2">
      <ol className="flex min-w-0 flex-1 items-center gap-1.5">
        {steps.map((s, i) => (
          <li key={s} className="flex min-w-0 items-center gap-1.5">
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold ${i < at ? "bg-[#dcfce7] text-[#15803d]" : i === at ? "bg-[#6666ff] text-white" : "bg-[#f3f3f3] text-[#a3a3a3]"}`}>
              {i < at ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className={`hidden truncate text-[12.5px] sm:block ${i === at ? "font-semibold text-[#0a0a0a]" : "text-[#737373]"}`}>{s}</span>
            {i < steps.length - 1 && <span className={`mx-1 h-px w-4 shrink-0 lg:w-8 ${i < at ? "bg-[#86efac]" : "bg-[#ebebeb]"}`} />}
          </li>
        ))}
      </ol>
      {next && (
        <div className="flex flex-wrap items-center gap-2">
          {stage === "Pending" && <span className="hidden text-[12.5px] text-[#737373] xl:block">Call or WhatsApp to confirm a cash order before packing.</span>}
          {stage === "Packed" && (
            <label className="flex h-8 items-center gap-1.5 rounded-[10px] px-2 ring-1 ring-inset ring-[#dddddd]">
              <Truck className="h-3.5 w-3.5 text-[#a3a3a3]" />
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Leopards or TCS tracking number" className="w-52 bg-transparent text-[13px] outline-none" />
            </label>
          )}
          <button type="button" onClick={() => { const before = stage; setStage(next[0]); toast(`#${id} ${next[1].toLowerCase()}${tracking ? `, tracking ${tracking}` : ""}`, () => setStage(before)); }} className={btn("primary")}>
            {next[1]} <ChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}

/** Ready WhatsApp messages, so nobody types the same three every day. */
export function WhatsAppTemplates({ name, id, phone }: { name: string; id: number; phone: string }) {
  const toast = useToast();
  const first = name.split(" ")[0];
  const msgs = [
    ["Confirm", `Assalam o Alaikum ${first}, this is Zohra Lawn. Can you confirm your order #${id} for delivery? Reply YES and we will send it today.`],
    ["On its way", `${first}, your order #${id} is on its way with Leopards. Track it here: leopardscourier.com`],
    ["Thank you", `Thank you for shopping with Zohra Lawn, ${first}. We hope you love it.`],
  ];
  return (
    <div className="flex flex-col gap-1">
      {msgs.map(([label, text]) => (
        <button key={label} type="button" onClick={() => toast(`WhatsApp opened for ${phone}`)} title={text} className="flex h-8 items-center gap-2 rounded-[10px] px-2 text-left text-[12.5px] ring-1 ring-inset ring-[#ebebeb] hover:bg-[#f0fdf4]">
          <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
          <b className="font-medium">{label}</b>
          <span className="min-w-0 flex-1 truncate text-[#a3a3a3]">{text}</span>
        </button>
      ))}
    </div>
  );
}

/** Newer and older order, by button or by K and J. */
export function OrderPager({ prev, next }: { prev?: number; next?: number }) {
  const router = useRouter();
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === "j" && next) router.push(`${A}/orders/${next}`);
      if (e.key === "k" && prev) router.push(`${A}/orders/${prev}`);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [prev, next, router]);
  return (
    <span className="flex">
      <button type="button" aria-label="Newer order (K)" title="Newer order (K)" disabled={!prev} onClick={() => prev && router.push(`${A}/orders/${prev}`)} className={`${btn()} rounded-r-none px-2`}><ChevronLeft /></button>
      <button type="button" aria-label="Older order (J)" title="Older order (J)" disabled={!next} onClick={() => next && router.push(`${A}/orders/${next}`)} className={`${btn()} -ml-px rounded-l-none px-2`}><ChevronRight /></button>
    </span>
  );
}
