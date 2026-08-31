"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordInput } from "@/components/ui/password-input";

export function LoginForm({
  submitLabel = "Sign In",
  submittingLabel = "Signing in…",
  invalidCredentialsError = "Invalid email or password.",
}: {
  submitLabel?: string;
  submittingLabel?: string;
  invalidCredentialsError?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError(invalidCredentialsError);
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/account/orders");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="Email"
        className="input"
      />
      <PasswordInput
        name="password"
        autoComplete="current-password"
        required
        placeholder="Password"
      />
      {error && <p className="text-sm text-rose">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
