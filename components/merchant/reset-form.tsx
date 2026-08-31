"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword } from "@/app/merchant/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FormMessage, SubmitButton } from "./form-shell";
import { useCountdownRedirect } from "./use-countdown-redirect";

/** Long enough to read that it worked, short enough not to be a wait. */
const REDIRECT_SECONDS = 6;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const remaining = useCountdownRedirect("/merchant/login", REDIRECT_SECONDS, done !== null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    // Checked here rather than server-side: the server never sees the second
    // field, and a typo should not cost a round trip or spend the link.
    if (password !== confirm) {
      setError("Those two passwords don't match.");
      return;
    }

    setPending(true);
    const result = await resetPassword(token, password);

    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    setDone(result.message ?? "Password changed.");
  }

  if (done) {
    return (
      <div className="space-y-4">
        <FormMessage tone="success">{done}</FormMessage>
        <button
          type="button"
          onClick={() => router.push("/merchant/login")}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Sign in
        </button>
        <p className="text-center text-sm text-ink-soft" aria-live="polite">
          {remaining > 0
            ? `Taking you to sign in in ${remaining} second${remaining === 1 ? "" : "s"}…`
            : "Taking you to sign in…"}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="New password" hint="At least 10 characters.">
        <PasswordInput name="password" autoComplete="new-password" required minLength={10} autoFocus />
      </Field>

      <Field label="Confirm new password">
        <PasswordInput name="confirm" autoComplete="new-password" required minLength={10} />
      </Field>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <SubmitButton pending={pending} pendingLabel="Changing…">
        Change password
      </SubmitButton>
    </form>
  );
}
