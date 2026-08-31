"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FormMessage, SubmitButton } from "./form-shell";

/**
 * Merchant sign-in.
 *
 * Distinct from the storefront's login form, which authenticates a *shopper*
 * against one shop's Customer table. This one signs in a platform user and
 * carries their shop memberships, so it is the door to the admin panel.
 */
export function MerchantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (result?.error) {
      // One message for a wrong password and for an address with no account:
      // saying which is a free way to find out who has one.
      setError("That email and password don't match an account.");
      setPending(false);
      return;
    }

    // Only same-origin paths: an open redirect here would let a phishing link
    // borrow the sign-in page and bounce the merchant somewhere else afterwards.
    const requested = searchParams.get("callbackUrl");
    const destination = requested?.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/merchant/stores";

    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className="input" autoFocus />
      </Field>

      <Field label="Password">
        <PasswordInput name="password" autoComplete="current-password" required />
      </Field>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <SubmitButton pending={pending} pendingLabel="Signing in…">
        Sign in
      </SubmitButton>

      <p className="text-center text-sm">
        <a href="/merchant/forgot" className="text-ink-soft hover:text-ink underline-scribble">
          Forgotten your password?
        </a>
      </p>

      {/* Always shown, not only after a failure. An unconfirmed account is
          refused exactly like a wrong password — saying which would confirm
          that an address is registered — so the way out has to be visible to
          everyone rather than revealed to the person it applies to. */}
      <p className="text-center text-sm text-ink-soft">
        Just signed up?{" "}
        <a href="/merchant/verify" className="font-medium text-brand-600 underline-scribble">
          Confirm your email
        </a>{" "}
        before signing in.
      </p>
    </form>
  );
}
