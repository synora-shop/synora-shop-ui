"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Plus, RefreshCw, Tag, Trash2, X } from "lucide-react";
import {
  createDiscount,
  deleteDiscount,
  setDiscountActive,
  type DiscountInput,
} from "@/app/admin/discounts/actions";
import { codeProblem, describeDiscount, type DiscountType } from "@/lib/discounts";
import { EmptyState } from "@/components/ui/primitives";
import { StatePill, type PillTone } from "@/components/admin/kit";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useCurrency, useCurrencySymbol, useMoney } from "@/components/ui/currency";
import { cn } from "@/lib/utils";

/**
 * Discount codes (new admin, 15 October).
 *
 * Creating one opens the editor in place: choose what it gives, name the code
 * (or have one made up), set its limits and dates, and the black card beside
 * it says back, in plain words, exactly what a customer will get. Every code
 * is still priced on the server by createDiscount; this only gathers it.
 *
 * The list under it sorts by any column, both ways, and each code can be
 * switched off for an afternoon without being deleted.
 */
export type DiscountRow = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minSubtotal: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usageCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  state: "active" | "scheduled" | "expired" | "used-up" | "off";
};

const STATE: Record<DiscountRow["state"], { text: string; tone: PillTone }> = {
  active: { text: "Active", tone: "good" },
  scheduled: { text: "Starts later", tone: "info" },
  expired: { text: "Expired", tone: "off" },
  "used-up": { text: "Fully claimed", tone: "off" },
  off: { text: "Off", tone: "off" },
};

const TYPES: { value: DiscountType; label: string; hint: string }[] = [
  { value: "PERCENTAGE", label: "Percentage off", hint: "A share of the order, e.g. 10%" },
  { value: "FIXED_AMOUNT", label: "Amount off", hint: "A set amount off the order" },
  { value: "FREE_SHIPPING", label: "Free delivery", hint: "Waives the delivery charge" },
];

type SortKey = "code" | "gives" | "used" | "state";
const field = "h-10 w-full rounded-[10px] bg-white px-3.5 text-[14px] text-[#0a0a0a] outline-none ring-1 ring-[#0a0a0a]/15 focus:ring-2 focus:ring-[#0a0a0a]";

export function DiscountManager({ discounts }: { discounts: DiscountRow[] }) {
  const money = useMoney();
  const currency = useCurrency();
  const symbol = useCurrencySymbol();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<DiscountType>("PERCENTAGE");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [minSubtotal, setMinSubtotal] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perCustomer, setPerCustomer] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean } | null>(null);
  const codeIssue = code.trim() ? codeProblem(code) : null;

  const run = (action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error, { blocking: true });
    });
  };

  function reset() {
    setCode("");
    setValue("");
    setMinSubtotal("");
    setUsageLimit("");
    setPerCustomer("");
    setEndsAt("");
    setType("PERCENTAGE");
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (codeIssue) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const number = (key: string): number | null => {
      const raw = String(data.get(key) ?? "").trim();
      return raw === "" ? null : Number(raw);
    };
    const input: DiscountInput = {
      code: String(data.get("code") ?? ""),
      type,
      value: Number(String(data.get("value") ?? "0")) || 0,
      minSubtotal: number("minSubtotal"),
      usageLimit: number("usageLimit"),
      perCustomerLimit: number("perCustomerLimit"),
      startsAt: (String(data.get("startsAt") ?? "") || null) as string | null,
      endsAt: (String(data.get("endsAt") ?? "") || null) as string | null,
    };
    run(async () => {
      const result = await createDiscount(input);
      if (result.ok) {
        form.reset();
        reset();
        setCreating(false);
      }
      return result;
    });
  }

  const n = (s: string) => (s.trim() === "" ? null : Number(s));
  const gives = describeDiscount(type, Number(value) || 0, currency);

  const order: Record<DiscountRow["state"], number> = { active: 0, scheduled: 1, off: 2, "used-up": 3, expired: 4 };
  const rows = sort
    ? [...discounts].sort((a, b) => {
        const by =
          sort.key === "code" ? a.code.localeCompare(b.code)
          : sort.key === "gives" ? describeDiscount(a.type, a.value, currency).localeCompare(describeDiscount(b.type, b.value, currency))
          : sort.key === "used" ? a.usageCount - b.usageCount
          : order[a.state] - order[b.state];
        return sort.desc ? -by : by;
      })
    : discounts;

  const head = (k: SortKey, label: string, right = false) => {
    const on = sort?.key === k;
    const Arrow = !on ? ChevronsUpDown : sort.desc ? ArrowDown : ArrowUp;
    return (
      <div key={k} role="columnheader" aria-sort={on ? (sort.desc ? "descending" : "ascending") : "none"} className={right ? "text-right" : ""}>
        <button
          type="button"
          onClick={() => setSort(on ? { key: k, desc: !sort.desc } : { key: k, desc: false })}
          className={cn(
            "group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] transition-colors",
            right ? "-mr-2 flex-row-reverse" : "-ml-2",
            on ? "bg-white/[0.12] text-white" : "text-white/55 hover:bg-white/[0.07] hover:text-white"
          )}
        >
          {label}
          <Arrow className={cn("h-3.5 w-3.5", on ? "text-[#b7b9ff]" : "opacity-0 group-hover:opacity-60")} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {dialog}

      {creating ? (
        <form onSubmit={handleCreate} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-4">
            <section className="rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
              <p className="mb-3 text-[14.5px] font-semibold text-[#0a0a0a]">What it gives</p>
              <div role="radiogroup" aria-label="What it gives" className="grid gap-2 sm:grid-cols-3">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={type === t.value}
                    onClick={() => setType(t.value)}
                    className={cn("rounded-xl px-4 py-3 text-left", type === t.value ? "bg-[#0a0a0a] text-white" : "ring-1 ring-[#0a0a0a]/12 hover:ring-[#0a0a0a]/30")}
                  >
                    <span className="block text-[14px] font-semibold">{t.label}</span>
                    <span className={cn("block text-[12.5px]", type === t.value ? "text-white/60" : "text-[#0a0a0a]/55")}>{t.hint}</span>
                  </button>
                ))}
              </div>
              {/* Free delivery has no amount, so the field goes away rather than
                  sitting there disabled and inviting a number that is ignored. */}
              {type !== "FREE_SHIPPING" && (
                <label className="mt-4 block max-w-xs">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">{type === "PERCENTAGE" ? "Percentage off" : `Amount off (${symbol})`}</span>
                  <input name="value" type="number" min={1} max={type === "PERCENTAGE" ? 100 : undefined} required value={value} onChange={(e) => setValue(e.target.value)} className={field} />
                </label>
              )}
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
              <label className="block">
                <span className="mb-1.5 block text-[14.5px] font-semibold text-[#0a0a0a]">The code</span>
                <span className="flex gap-2">
                  <input
                    name="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    autoFocus
                    required
                    placeholder="EID25"
                    aria-invalid={codeIssue ? true : undefined}
                    className={cn(field, "font-mono font-semibold uppercase tracking-[0.06em]")}
                  />
                  <button
                    type="button"
                    onClick={() => setCode(`SAVE${Math.random().toString(36).slice(2, 6).toUpperCase()}`)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-semibold ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]"
                  >
                    <RefreshCw className="h-4 w-4" /> Make one up
                  </button>
                </span>
                <span className="mt-1.5 block text-[12.5px] leading-snug text-[#0a0a0a]/50">
                  {codeIssue ? <span className="text-rose">{codeIssue}</span> : "What the customer types at checkout."}
                </span>
              </label>
            </section>

            <section className="rounded-2xl bg-white p-5 ring-1 ring-[#0a0a0a]/[0.07]">
              <p className="mb-3 text-[14.5px] font-semibold text-[#0a0a0a]">Limits</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Smallest order</span>
                  <input name="minSubtotal" type="number" min={0} placeholder="Any" value={minSubtotal} onChange={(e) => setMinSubtotal(e.target.value)} className={field} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Uses in all</span>
                  <input name="usageLimit" type="number" min={1} placeholder="Unlimited" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} className={field} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Uses per customer</span>
                  <input name="perCustomerLimit" type="number" min={1} placeholder="Unlimited" value={perCustomer} onChange={(e) => setPerCustomer(e.target.value)} className={field} />
                </label>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Starts</span>
                  <input name="startsAt" type="datetime-local" className={field} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-[#0a0a0a]">Ends</span>
                  <input name="endsAt" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={field} />
                </label>
              </div>
            </section>
          </div>

          {/* Said back in plain words, as it is filled in. */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl bg-[#0a0a0a] p-5 text-white">
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#b7b9ff]">What customers get</p>
              <p className="mt-3 inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-[16px] font-bold tracking-[0.08em] text-[#0a0a0a]">{code || "CODE"}</p>
              <ul className="mt-4 flex flex-col gap-2 text-[14px] text-white/80">
                <li className="font-semibold text-white">{gives}</li>
                <li>{n(minSubtotal) ? `On orders of ${money(Number(minSubtotal))} or more` : "On any order"}</li>
                <li>{n(usageLimit) ? `Up to ${usageLimit} uses` : "No limit on uses"}{n(perCustomer) ? `, ${perCustomer} per customer` : ""}</li>
                <li>{endsAt ? `Until ${new Date(endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No end date"}</li>
              </ul>
              <button type="submit" disabled={pending || !!codeIssue} className="mt-5 w-full rounded-[10px] bg-white py-2.5 text-[14px] font-semibold text-[#0a0a0a] disabled:opacity-50">
                {pending ? "Creating…" : "Create discount"}
              </button>
              <button type="button" onClick={() => { reset(); setCreating(false); }} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 py-1.5 text-[13px] font-semibold text-white/60 hover:text-white">
                <X className="h-4 w-4" /> Cancel
              </button>
            </section>
          </aside>
        </form>
      ) : (
        <div className="flex justify-end">
          <button type="button" onClick={() => setCreating(true)} className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white hover:bg-[#262626]">
            <Plus className="h-4 w-4" /> Create discount
          </button>
        </div>
      )}

      {discounts.length === 0 ? (
        <EmptyState icon={Tag} title="No discount codes yet" description="Create one and customers can enter it at checkout." />
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
          <div role="row" className={cn("hidden items-center gap-4 bg-[#0a0a0a] px-4 py-1.5 lg:grid", GRID)}>
            {head("code", "Code")}
            {head("gives", "What it gives")}
            {head("used", "Used")}
            {head("state", "Status")}
            <span />
          </div>
          <div className="divide-y divide-[#0a0a0a]/[0.06]">
            {rows.map((discount) => {
              const state = STATE[discount.state];
              return (
                <div key={discount.id} className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 lg:grid", GRID)}>
                  <span><span className="rounded-md bg-[#0a0a0a] px-2 py-1 font-mono text-[13px] font-semibold text-white">{discount.code}</span></span>
                  <span className="min-w-0 basis-full lg:basis-auto">
                    <span className="block text-[14px] font-medium text-[#0a0a0a]">{describeDiscount(discount.type, discount.value, currency)}</span>
                    <span className="block text-[12.5px] text-[#0a0a0a]/50">
                      {[
                        discount.minSubtotal !== null && `Orders over ${money(discount.minSubtotal)}`,
                        discount.perCustomerLimit !== null && `${discount.perCustomerLimit} per customer`,
                        discount.endsAt && `ends ${new Date(discount.endsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`,
                      ].filter(Boolean).join(" · ") || "Any order, no end date"}
                    </span>
                  </span>
                  <span>
                    <span className="block text-[13.5px] tabular-nums text-[#0a0a0a]">{discount.usageCount}{discount.usageLimit !== null ? ` of ${discount.usageLimit}` : " times"}</span>
                    {discount.usageLimit !== null && (
                      <span className="mt-1 block h-1 w-24 overflow-hidden rounded-full bg-[#efeff4]">
                        <span className="block h-full bg-[#6666ff]" style={{ width: `${Math.min(100, (discount.usageCount / discount.usageLimit) * 100)}%` }} />
                      </span>
                    )}
                  </span>
                  <span><StatePill tone={state.tone}>{state.text}</StatePill></span>
                  <span className="ml-auto flex items-center justify-end gap-2">
                    <ToggleSwitch checked={discount.isActive} onChange={(next) => run(() => setDiscountActive(discount.id, next))} label={`${discount.code} enabled`} hideLabel />
                    <button
                      type="button"
                      disabled={pending}
                      aria-label={`Delete ${discount.code}`}
                      title="Delete"
                      onClick={async () => {
                        const ok = await confirm({
                          title: `Delete ${discount.code}?`,
                          description:
                            discount.usageCount > 0
                              ? `It has been used ${discount.usageCount} times. Those orders keep their discount, only the code stops working.`
                              : "The code stops working immediately.",
                          confirmLabel: "Delete",
                          danger: true,
                        });
                        if (ok) run(() => deleteDiscount(discount.id));
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg text-[#0a0a0a]/40 hover:bg-[#ffe9e2] hover:text-[#a3330c] disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

const GRID = "lg:grid-cols-[9rem_minmax(0,1.6fr)_8rem_8rem_5.5rem]";
