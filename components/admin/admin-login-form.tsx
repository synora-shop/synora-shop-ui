"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Two-stage admin login: (1) email+password against /api/admin/request-otp — a plain
 * fetch, NOT next-auth's signIn(), so a correct password alone never establishes a
 * session; (2) email+code against signIn("admin-otp", ...), which is the only provider
 * proxy.ts/admin/layout.tsx will ever see a valid ADMIN session come from.
 * Do not "simplify" stage 1 to call signIn("credentials", ...) directly — that provider
 * returns a full session on a correct password alone and would silently skip the OTP step.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function requestOtp(emailValue: string, password: string) {
    await fetch("/api/admin/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailValue, password }),
    });
    // Always treat as success client-side — the endpoint intentionally never reveals
    // whether the account/password was actually valid (see route.ts for why).
  }

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const emailValue = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    await requestOtp(emailValue, password);

    setEmail(emailValue);
    setStage("otp");
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setSubmitting(false);
  }

  async function handleOtpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const otp = String(form.get("otp") ?? "").trim();

    const result = await signIn("admin-otp", { email, otp, redirect: false });

    if (result?.error) {
      setError("Invalid or expired code. Check your email and try again.");
      setSubmitting(false);
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/admin");
    router.refresh();
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    // We don't have the password anymore at this point (deliberately not kept in state
    // longer than needed) — resend just re-triggers the cooldown-aware send for this
    // email if a request is still legitimately in flight server-side isn't possible
    // without the password, so instruct the user to go back and re-enter it instead.
    setStage("credentials");
  }

  if (stage === "otp") {
    return (
      <form onSubmit={handleOtpSubmit} className="mt-8 space-y-4">
        <p className="text-sm text-ink-soft">
          We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>. It expires in 10
          minutes.
        </p>
        <input
          name="otp"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          autoComplete="one-time-code"
          required
          placeholder="123456"
          className="input tracking-[0.5em]"
          autoFocus
        />
        {error && <p className="text-sm text-rose">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "Verifying…" : "Verify & sign in"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0}
          className="w-full text-center text-sm text-ink-soft underline-scribble disabled:opacity-50"
        >
          {cooldown > 0 ? `Resend available in ${cooldown}s` : "Enter details again to resend"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="mt-8 space-y-4">
      <input
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="Admin email"
        className="input"
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="Password"
        className="input"
      />
      {error && <p className="text-sm text-rose">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-brand-500 px-8 py-3 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
      >
        {submitting ? "Sending code…" : "Continue"}
      </button>
    </form>
  );
}
