"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/app/merchant/actions";
import { Field, FormMessage, SubmitButton } from "./form-shell";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const result = await requestPasswordReset(String(form.get("email") ?? ""));

    // The only failure path that reaches here is the rate limit. Everything
    // else answers the same way whether or not the address has an account.
    if (result.ok) setMessage(result.message ?? "Check your email.");
    else setError(result.error);
    setPending(false);
  }

  if (message) {
    return <FormMessage tone="success">{message}</FormMessage>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className="input" autoFocus />
      </Field>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <SubmitButton pending={pending} pendingLabel="Sending…">
        Email me a reset link
      </SubmitButton>
    </form>
  );
}
