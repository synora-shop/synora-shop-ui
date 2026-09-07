"use client";

import { useState } from "react";
import { FieldError } from "@/components/ui/primitives";
import { HONEYPOT_FIELD } from "@/lib/spam";
import { emailProblem } from "@/lib/holding-page";
import { signupForReopening } from "@/app/(storefront)/maintenance/actions";

/**
 * "Tell me when you reopen", on the holding page.
 *
 * Deliberately the smallest form in the product: one field and a button. The
 * person reading it has just been told the shop is shut, and every extra box
 * is a reason to close the tab instead.
 *
 * It never says whether the address was already signed up — the action does
 * not tell it, on purpose — so a "thanks" here means the same thing either
 * way. Once it has thanked someone, the form is replaced rather than reset: a
 * form still sitting there invites the same person to submit again and wonder
 * whether the first one worked.
 */
export function ReopenSignupForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (done) {
    return (
      <p role="status" className="notice-in mt-8 max-w-md text-sm leading-relaxed text-ink">
        {done}
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Checked here for the immediate answer, and again in the action, which is
    // where the rule actually lives.
    const problem = emailProblem(email);
    if (problem) {
      setError(problem);
      return;
    }

    setSending(true);
    setError(null);
    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem(HONEYPOT_FIELD) as HTMLInputElement | null)?.value;

    try {
      const result = await signupForReopening(email, honeypot);
      if (result.ok) setDone(result.message);
      else setError(result.error);
    } catch {
      // A shut store is exactly where the network is least reliable — the
      // visitor may be on a stale tab. Say so rather than failing silently.
      setError("Couldn't send that just now. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 w-full max-w-sm">
      <label htmlFor="reopen-email" className="block text-xs font-medium text-ink-soft">
        Want to know when we&rsquo;re back?
      </label>

      <div className="mt-2 flex gap-2">
        <input
          id="reopen-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="you@example.com"
          className="input min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-pill bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-55"
        >
          {sending ? "Sending…" : "Tell me"}
        </button>
      </div>

      {/* The honeypot. A person never sees it and never fills it in; see
          lib/spam.ts. Hidden from assistive technology as well as from sight,
          because a screen reader that announces it turns the trap into a
          question a real person is asked. */}
      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {error && <FieldError size="xs" className="mt-2">{error}</FieldError>}

      <p className="mt-2 text-[11px] leading-snug text-ink-faint">
        We&rsquo;ll only use this to tell you the store is open again.
      </p>
    </form>
  );
}
