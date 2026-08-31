"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { resendVerification, verifyEmail } from "@/app/merchant/actions";
import { Field, FormMessage, SubmitButton } from "./form-shell";
import { useCountdownRedirect } from "./use-countdown-redirect";

/** Long enough to read that it worked, short enough not to be a wait. */
const REDIRECT_SECONDS = 6;

/**
 * Confirming an address, behind a button rather than on page load.
 *
 * The obvious design is to verify during render, so the link in the email just
 * works. It doesn't: corporate mail filters and link scanners fetch every URL
 * in a message before the recipient sees it, and a single-use token consumed by
 * a scanner is a link that is already spent when the person finally clicks it.
 * A button needs a real person, and costs them one click.
 */
export function ConfirmEmail({ token }: { token: string }) {
  const [state, setState] = useState<
    { kind: "ready" } | { kind: "pending" } | { kind: "done"; message: string } | { kind: "error"; message: string }
  >({ kind: "ready" });
  const remaining = useCountdownRedirect(
    "/merchant/login",
    REDIRECT_SECONDS,
    state.kind === "done"
  );

  async function confirm() {
    setState({ kind: "pending" });
    const result = await verifyEmail(token);
    setState(
      result.ok
        ? { kind: "done", message: result.message ?? "Email confirmed." }
        : { kind: "error", message: result.error }
    );
  }

  if (state.kind === "done") {
    return (
      <div className="space-y-4">
        <FormMessage tone="success">{state.message}</FormMessage>
        <Link
          href="/merchant/login"
          className="block w-full rounded-lg bg-brand-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Sign in
        </Link>
        <p className="text-center text-sm text-ink-soft" aria-live="polite">
          {remaining > 0
            ? `Taking you to sign in in ${remaining} second${remaining === 1 ? "" : "s"}…`
            : "Taking you to sign in…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.kind === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
      <button
        type="button"
        onClick={confirm}
        disabled={state.kind === "pending"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MailCheck className="h-4 w-4" />
        {state.kind === "pending" ? "Confirming…" : "Confirm my email address"}
      </button>
      {state.kind === "error" && (
        <p className="text-center text-sm text-ink-soft">
          <Link href="/merchant/verify" className="underline-scribble hover:text-ink">
            Send a new link
          </Link>
        </p>
      )}
    </div>
  );
}

/** For when the link expired, went missing, or never arrived. */
export function ResendVerification() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const result = await resendVerification(String(form.get("email") ?? ""));

    if (result.ok) setMessage(result.message ?? "On its way.");
    else setError(result.error);
    setPending(false);
  }

  if (message) return <FormMessage tone="success">{message}</FormMessage>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className="input" autoFocus />
      </Field>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      <SubmitButton pending={pending} pendingLabel="Sending…">
        Send a new link
      </SubmitButton>
    </form>
  );
}
