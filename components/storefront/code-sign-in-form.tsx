"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { requestCustomerCode, signInWithCode } from "@/app/(storefront)/account/sign-in-actions";
import { FieldError } from "@/components/ui/primitives";

/**
 * A customer's sign-in on the platform's own storefront pages: an email, then
 * the code sent to it. No password — a first sign-in makes the account. The
 * same two actions a theme's own sign-in uses.
 */
export function CodeSignInForm({
  labels,
}: {
  labels: { text: string; sendCode: string; codeSent: string; code: string; signIn: string; differentEmail: string };
}) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Only an address on this shop — never somewhere else a link chose.
  const next = searchParams.get("callbackUrl");
  const after = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account/orders";

  if (step === "email") {
    return (
      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const r = await requestCustomerCode(email);
          setBusy(false);
          if (!r.ok) return setError(r.error);
          setStep("code");
        }}
      >
        <p className="text-sm text-ink-soft">{labels.text}</p>
        <input type="email" required autoComplete="email" aria-label="Email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        {error && <FieldError>{error}</FieldError>}
        <button type="submit" disabled={busy} className="w-full rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50">
          {labels.sendCode}
        </button>
      </form>
    );
  }

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await signInWithCode(email, String(new FormData(e.currentTarget).get("code") ?? ""));
        if (!r.ok) {
          setBusy(false);
          return setError(r.error);
        }
        // A full load, so every server-drawn page sees the new session.
        window.location.assign(after);
      }}
    >
      <p className="text-sm text-ink-soft">{labels.codeSent.replace("{email}", email)}</p>
      <input name="code" required inputMode="numeric" autoComplete="one-time-code" aria-label={labels.code} placeholder={labels.code} maxLength={7} className="input" />
      {error && <FieldError>{error}</FieldError>}
      <button type="submit" disabled={busy} className="w-full rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50">
        {labels.signIn}
      </button>
      <button type="button" onClick={() => setStep("email")} className="text-sm text-ink-soft underline">
        {labels.differentEmail}
      </button>
    </form>
  );
}
