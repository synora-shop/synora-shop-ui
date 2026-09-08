"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, Lock, ShieldCheck } from "lucide-react";
import { Button, FieldError } from "@/components/ui/primitives";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  connectGateway,
  disconnectGateway,
  setGatewayActive,
  setGatewayMode,
} from "@/app/admin/payments/gateway-actions";
import { GATEWAY_PROVIDERS } from "@/lib/payments/providers";

/**
 * One gateway, and everything a merchant may do to it.
 *
 * The four things it has to keep apart, because merchants conflate them and
 * the consequences differ:
 *
 *   Connected — there are keys here.
 *   Switched on — customers are offered it. Reversible, keeps the keys.
 *   Live — real money. Locked until a test payment has actually worked.
 *   Disconnected — the keys are erased. Not reversible.
 *
 * The screen never shows a stored key, and there is no action that reads one
 * back. Replacing keys proves the new ones against the provider before the old
 * ones are touched, so a mistyped key changes nothing.
 */

export type GatewayCardState = {
  provider: string;
  label: string;
  blurb: string;
  signupUrl: string;
  connected: boolean;
  isActive: boolean;
  mode: "SANDBOX" | "LIVE";
  canGoLive: boolean;
  connectedAt: string | null;
  credentialsUpdatedAt: string | null;
  sandboxVerifiedAt: string | null;
  lastError: string | null;
  blockedReason: string | null;
  /** False when the platform has no key to encrypt credentials with. */
  storageReady: boolean;
};

export function GatewayCard({ state }: { state: GatewayCardState }) {
  const router = useRouter();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const meta = GATEWAY_PROVIDERS.find((p) => p.value === state.provider);
  const [editing, setEditing] = useState(!state.connected);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function run(work: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setPending(true);
    setError(null);
    try {
      const result = await work();
      if (!result.ok) {
        setError(result.error ?? "That didn't work.");
        return false;
      }
      if (result.message) toast.success(result.message);
      router.refresh();
      return true;
    } finally {
      setPending(false);
    }
  }

  async function save() {
    const ok = await run(() =>
      connectGateway({
        provider: state.provider,
        merchantId: fields.merchantId ?? "",
        securedKey: fields.securedKey ?? "",
        storeId: fields.storeId,
      })
    );
    if (ok) {
      // Cleared from memory the moment it is accepted. Nothing is gained by a
      // form that keeps holding a secured key.
      setFields({});
      setEditing(false);
    }
  }

  async function goLive(next: boolean) {
    if (next) {
      const sure = await confirm({
        title: "Take real payments?",
        description: "From now on your customers' cards are actually charged, and the money settles into your own bank account. Your test payment has already gone through, so the connection works.",
        confirmLabel: "Go live",
      });
      if (!sure) return;
    }
    await run(() => setGatewayMode(state.provider, next));
  }

  async function remove() {
    const sure = await confirm({
      title: `Erase your ${state.label} keys?`,
      description: "This cannot be undone — you'd have to fetch them from your provider again. If you only want to stop taking card payments for now, switch it off instead: that keeps your keys.",
      confirmLabel: "Erase the keys",
      danger: true,
    });
    if (!sure) return;
    await run(() => disconnectGateway(state.provider));
  }

  return (
    <>
      {dialog}
      <div className="rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              {state.label}
              {state.connected && (
                <span
                  className={
                    state.mode === "LIVE"
                      ? "rounded-full bg-green/10 px-2 py-0.5 text-[11px] font-medium text-green"
                      : "rounded-full bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber"
                  }
                >
                  {state.mode === "LIVE" ? "Live" : "Test mode"}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-ink-soft">{state.blurb}</p>
          </div>

          {!state.connected && (
            <a
              href={state.signupUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="lift inline-flex items-center gap-1 text-xs font-medium text-brand-600"
            >
              Get an account <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>

        {!state.storageReady && (
          <p className="notice-in mt-2.5 flex items-start gap-1.5 text-xs leading-snug font-medium text-amber">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            This platform cannot store gateway keys safely yet, so there is
            nowhere for yours to go. Nothing you type here would be saved.
          </p>
        )}

        {/* Connected, not being edited: the state and what can be done to it. */}
        {state.connected && !editing && (
          <div className="notice-in mt-2.5 space-y-2.5">
            <p className="flex items-center gap-1.5 text-xs text-ink-soft">
              <Lock className="h-3.5 w-3.5 flex-shrink-0 text-green" aria-hidden />
              Your keys are saved and encrypted. They are never shown again, here
              or anywhere else.
            </p>

            <ToggleSwitch
              inline
              label="Offer this at checkout"
              description={
                state.mode === "SANDBOX"
                  ? "While it is in test mode only you can see it on your own storefront."
                  : "Customers can pay with it."
              }
              checked={state.isActive}
              disabled={pending}
              onChange={(next) => run(() => setGatewayActive(state.provider, next))}
            />

            {state.canGoLive ? (
              <ToggleSwitch
                inline
                label="Take real payments"
                description="Test mode charges nothing. Live charges your customers for real."
                checked={state.mode === "LIVE"}
                disabled={pending}
                onChange={goLive}
              />
            ) : (
              <p className="flex items-start gap-1.5 rounded-lg bg-panel p-2.5 text-xs leading-snug text-ink-soft">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-faint" aria-hidden />
                <span>
                  <span className="font-medium text-ink">One test payment unlocks going live.</span>{" "}
                  Switch it on above, open your own storefront while signed in
                  here, and buy something. Only you can see it. When that payment
                  goes through, this unlocks.
                </span>
              </p>
            )}

            {state.sandboxVerifiedAt && (
              <p className="flex items-center gap-1.5 text-xs text-green">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                A test payment has been through this connection.
              </p>
            )}

            {state.lastError && (
              <p className="flex items-start gap-1.5 text-xs leading-snug font-medium text-amber">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                Last time we spoke to {state.label}: {state.lastError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setEditing(true)} disabled={pending}>
                Replace keys
              </Button>
              <Button size="sm" variant="ghost" onClick={remove} disabled={pending}>
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* Entering keys, whether for the first time or to replace them. */}
        {editing && (
          <div className="notice-in mt-2.5 space-y-2.5">
            {state.connected && (
              <p className="text-xs leading-snug text-ink-soft">
                Your new keys are checked with {state.label} before anything is
                replaced. If they are wrong, nothing changes and your current
                connection keeps working.
              </p>
            )}

            {meta?.fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={`gw-${state.provider}-${field.name}`}
                  className="mb-1.5 block text-xs font-medium text-ink"
                >
                  {field.label}
                  {"optional" in field && field.optional && (
                    <span className="font-normal text-ink-faint"> — optional</span>
                  )}
                </label>
                <input
                  id={`gw-${state.provider}-${field.name}`}
                  className="input"
                  type={"secret" in field && field.secret ? "password" : "text"}
                  autoComplete="off"
                  spellCheck={false}
                  value={fields[field.name] ?? ""}
                  onChange={(e) =>
                    setFields((f) => ({ ...f, [field.name]: e.target.value }))
                  }
                />
                <p className="mt-1 text-xs leading-snug text-ink-faint">{field.hint}</p>
              </div>
            ))}

            {error && <FieldError>{error}</FieldError>}

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={save} disabled={pending || !state.storageReady}>
                {pending ? "Checking with " + state.label + "…" : state.connected ? "Replace keys" : "Connect"}
              </Button>
              {state.connected && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFields({});
                    setError(null);
                    setEditing(false);
                  }}
                  disabled={pending}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}

        {state.connected && !editing && state.blockedReason && (
          <p className="mt-2 text-xs leading-snug text-ink-faint">{state.blockedReason}</p>
        )}
      </div>
    </>
  );
}
