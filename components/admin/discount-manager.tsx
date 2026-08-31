"use client";

import { useState, useTransition } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import {
  createDiscount,
  deleteDiscount,
  setDiscountActive,
  type DiscountInput,
} from "@/app/admin/discounts/actions";
import { codeProblem, describeDiscount, type DiscountType } from "@/lib/discounts";
import { formatPKR } from "@/lib/utils";
import { Badge, Button, Card, EmptyState } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

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

const STATE_LABEL: Record<DiscountRow["state"], { text: string; tone: "good" | "warn" | "neutral" | "bad" }> = {
  active: { text: "active", tone: "good" },
  scheduled: { text: "starts later", tone: "warn" },
  expired: { text: "expired", tone: "neutral" },
  "used-up": { text: "fully claimed", tone: "neutral" },
  off: { text: "off", tone: "neutral" },
};

const TYPES: { value: DiscountType; label: string; hint: string }[] = [
  { value: "PERCENTAGE", label: "Percentage off", hint: "e.g. 10 for 10%" },
  { value: "FIXED_AMOUNT", label: "Amount off", hint: "in rupees" },
  { value: "FREE_SHIPPING", label: "Free delivery", hint: "waives the shipping fee" },
];

export function DiscountManager({ discounts }: { discounts: DiscountRow[] }) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<DiscountType>("PERCENTAGE");
  const [code, setCode] = useState("");

  // Live feedback from the same function the server enforces, so the form
  // never accepts something that is about to be refused.
  const codeIssue = code.trim() ? codeProblem(code) : null;

  const run = (
    action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error, { blocking: true });
    });
  };

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
        setCode("");
        setCreating(false);
      }
      return result;
    });
  }

  return (
    <div className="space-y-6">
      {dialog}

      <Card className="p-4">
        {creating ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Code</span>
                <input
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  autoFocus
                  required
                  placeholder="SAVE10"
                  aria-invalid={codeIssue ? true : undefined}
                  className="input font-mono uppercase"
                />
                <span className="mt-1.5 block text-xs leading-snug text-ink-soft">
                  {codeIssue ? (
                    <span className="text-rose">{codeIssue}</span>
                  ) : (
                    "What the customer types at checkout."
                  )}
                </span>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Type</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as DiscountType)}
                  className="input"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Free delivery has no amount, so the field goes away rather than
                sitting there disabled and inviting a number that is ignored. */}
            {type !== "FREE_SHIPPING" && (
              <label className="block max-w-xs">
                <span className="mb-1.5 block text-sm font-medium text-ink">
                  {type === "PERCENTAGE" ? "Percentage off" : "Amount off (Rs)"}
                </span>
                <input
                  name="value"
                  type="number"
                  min={1}
                  max={type === "PERCENTAGE" ? 100 : undefined}
                  required
                  className="input"
                />
                <span className="mt-1.5 block text-xs text-ink-soft">
                  {TYPES.find((t) => t.value === type)?.hint}
                </span>
              </label>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Minimum spend</span>
                <input name="minSubtotal" type="number" min={0} placeholder="Any" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Total uses</span>
                <input name="usageLimit" type="number" min={1} placeholder="Unlimited" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Uses per customer</span>
                <input
                  name="perCustomerLimit"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  className="input"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Starts</span>
                <input name="startsAt" type="datetime-local" className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-ink">Ends</span>
                <input name="endsAt" type="datetime-local" className="input" />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" variant="primary" disabled={pending || !!codeIssue}>
                {pending ? "Creating…" : "Create discount"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Create a discount code</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                A percentage, an amount, or free delivery, with limits and dates if you want them.
              </p>
            </div>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              New discount
            </Button>
          </div>
        )}
      </Card>

      {discounts.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No discount codes yet"
          description="Create one and customers can enter it at checkout."
        />
      ) : (
        <Card className="divide-y divide-border">
          {discounts.map((discount) => {
            const state = STATE_LABEL[discount.state];
            return (
              <div key={discount.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <span className="font-mono text-ink">{discount.code}</span>
                    <Badge tone="brand">{describeDiscount(discount.type, discount.value)}</Badge>
                    <Badge tone={state.tone}>{state.text}</Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {discount.minSubtotal !== null &&
                      `Orders over ${formatPKR(discount.minSubtotal)} · `}
                    used {discount.usageCount}
                    {discount.usageLimit !== null ? ` of ${discount.usageLimit}` : " times"}
                    {discount.perCustomerLimit !== null &&
                      ` · ${discount.perCustomerLimit} per customer`}
                    {discount.endsAt &&
                      ` · ends ${new Date(discount.endsAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}`}
                  </p>
                </div>

                <div className="flex flex-shrink-0 items-center gap-3">
                  <ToggleSwitch
                    checked={discount.isActive}
                    onChange={(next) => run(() => setDiscountActive(discount.id, next))}
                    label={`${discount.code} enabled`}
                    hideLabel
                  />
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={pending}
                    aria-label={`Delete ${discount.code}`}
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
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
