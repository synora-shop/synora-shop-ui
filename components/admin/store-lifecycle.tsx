"use client";

import { useState, useTransition } from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { closeStore, pauseStore, resumeStore } from "@/app/admin/settings/lifecycle-actions";
import { PasswordInput } from "@/components/ui/password-input";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { FormMessage } from "@/components/merchant/form-shell";

type Status = "TRIAL" | "ACTIVE" | "PAUSED" | "PAST_DUE" | "SUSPENDED" | "CLOSED";

const OPEN: Status[] = ["TRIAL", "ACTIVE", "PAST_DUE"];

export function StoreLifecycle({
  status,
  storeName,
  isOwner,
  retentionDays,
}: {
  status: Status;
  storeName: string;
  isOwner: boolean;
  retentionDays: number;
}) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const open = OPEN.includes(status);

  const run = (
    action: () => Promise<{ ok: true; message?: string } | { ok: false; error: string }>
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message ?? "Done.");
      else toast.error(result.error, { blocking: true });
    });
  };

  return (
    <div className="space-y-6">
      {dialog}

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              Your store is
              {open ? (
                <Badge tone="good">open</Badge>
              ) : status === "PAUSED" ? (
                <Badge tone="warn">paused</Badge>
              ) : status === "CLOSED" ? (
                <Badge tone="neutral">closed</Badge>
              ) : (
                <Badge tone="bad">suspended</Badge>
              )}
            </p>
            <p className="mt-0.5 max-w-prose text-xs leading-snug text-ink-soft">
              {open
                ? "Customers can browse and order."
                : status === "PAUSED"
                  ? "Visitors see a notice instead of your storefront. You can still work on it here."
                  : status === "CLOSED"
                    ? `Your storefront is dark. Everything is kept for ${retentionDays} days from when you closed it.`
                    : "Get in touch and we'll sort it out."}
            </p>
          </div>

          {status !== "SUSPENDED" &&
            (open ? (
              <Button
                disabled={pending}
                onClick={async () => {
                  const ok = await confirm({
                    title: "Pause your store?",
                    description:
                      "Visitors will see a notice instead of your storefront and won't be able to order. Nothing is deleted, and you can reopen whenever you like.",
                    confirmLabel: "Pause the store",
                  });
                  if (ok) run(pauseStore);
                }}
              >
                <PauseCircle className="h-4 w-4" />
                Pause store
              </Button>
            ) : (
              <Button variant="primary" disabled={pending} onClick={() => run(resumeStore)}>
                <PlayCircle className="h-4 w-4" />
                {status === "CLOSED" ? "Reopen store" : "Open store"}
              </Button>
            ))}
        </div>
      </Card>

      {/* Closing is owner-only and deliberately the last thing on the page. */}
      {isOwner && status !== "CLOSED" && status !== "SUSPENDED" && (
        <Card className="border-rose/30 p-4">
          <h2 className="text-sm font-medium text-ink">Close this store</h2>
          <p className="mt-1 max-w-prose text-xs leading-snug text-ink-soft">
            Your storefront goes dark and stops taking orders. Everything, products, orders,
            customers, is kept for {retentionDays} days, so you can reopen if you change your
            mind. After that it can be deleted for good.
          </p>

          {closing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCloseError(null);
                const data = new FormData(e.currentTarget);
                startTransition(async () => {
                  const result = await closeStore(
                    String(data.get("password") ?? ""),
                    String(data.get("confirmation") ?? "")
                  );
                  if (!result.ok) {
                    setCloseError(result.error);
                    return;
                  }
                  setClosing(false);
                  toast.success(result.message ?? "Store closed.");
                });
              }}
              className="mt-4 max-w-sm space-y-3"
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink">
                  Type <span className="font-mono">{storeName}</span> to confirm
                </span>
                <input name="confirmation" required autoFocus className="input" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-ink">Your password</span>
                <PasswordInput name="password" autoComplete="current-password" required />
              </label>

              {closeError && <FormMessage tone="error">{closeError}</FormMessage>}

              <div className="flex items-center gap-2">
                <Button type="submit" variant="danger" disabled={pending}>
                  {pending ? "Closing…" : "Close this store"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setClosing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button className="mt-4" variant="danger" onClick={() => setClosing(true)}>
              Close this store
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
