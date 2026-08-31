"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { PasswordInput } from "@/components/ui/password-input";

export function RegisterForm({
  submitLabel = "Create Account",
  submittingLabel = "Creating account…",
  genericError = "Something went wrong",
}: {
  submitLabel?: string;
  submittingLabel?: string;
  genericError?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = form.get("name");
    const email = form.get("email");
    const password = form.get("password");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? genericError);
      setSubmitting(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/account/orders");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <input name="name" autoComplete="name" required placeholder="Full name" className="input" />
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
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Password (min. 8 characters)"
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
