"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { signUp, type SignupRefusal } from "@/app/merchant/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { Field, FormMessage, SubmitButton } from "./form-shell";

/**
 * Creating a merchant account and their first shop, in one form.
 *
 * Only four things are asked: name, email, password, store name. The store's
 * web address is generated automatically and made unique — the merchant never
 * has to pick one, a name collision never blocks signup, and both the name and
 * the address can be changed later in Settings. This is how Shopify hands out a
 * `*.myshopify.com` handle.
 */
export function SignupForm({ platformDomain }: { platformDomain: string }) {
  const [error, setError] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<SignupRefusal | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-bg text-green">
          <Check className="h-5 w-5" />
        </div>
        <h2 className="font-serif text-2xl font-semibold text-ink">Check your email</h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          We&rsquo;ve sent a confirmation link to{" "}
          <span className="font-medium text-ink">{sent}</span>. Open it and your store is ready.
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          Nothing after a minute or two? Check the spam folder, or{" "}
          <a href="/merchant/verify" className="font-medium text-brand-600 underline-scribble">
            send it again
          </a>
          .
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setRefusal(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();

    const result = await signUp({
      name: String(form.get("name") ?? ""),
      email,
      password: String(form.get("password") ?? ""),
      storeName: String(form.get("storeName") ?? ""),
    });

    if (!result.ok) {
      setError(result.error);
      setRefusal(result.code ?? null);
      setPending(false);
      return;
    }
    setSent(email);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Field label="Your name">
        <input name="name" type="text" autoComplete="name" required className="input" />
      </Field>

      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className="input" />
      </Field>

      <Field label="Password" hint="At least 10 characters. Length matters more than symbols.">
        <PasswordInput
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
        />
      </Field>

      <Field
        label="Store name"
        hint={`We'll create your store at yourname.${platformDomain}, you can change the address or connect your own domain later.`}
      >
        <input name="storeName" type="text" required className="input" />
      </Field>

      {error && <FormMessage tone="error">{error}</FormMessage>}

      {/* A refusal that names the address leaves the person stranded unless it
          also says where to go next, so each case carries its own way out. */}
      {refusal && (
        <p className="text-center text-sm text-ink-soft">
          {refusal === "email_taken" ? (
            <>
              <a href="/merchant/login" className="font-medium text-brand-600 underline-scribble">
                Sign in
              </a>{" "}
              instead, or{" "}
              <a href="/merchant/forgot" className="font-medium text-brand-600 underline-scribble">
                reset your password
              </a>
              .
            </>
          ) : (
            <>
              Can&rsquo;t remember it?{" "}
              <a href="/merchant/forgot" className="font-medium text-brand-600 underline-scribble">
                Set a new password
              </a>{" "}
              &mdash; that confirms your address at the same time.
            </>
          )}
        </p>
      )}

      <SubmitButton pending={pending} pendingLabel="Creating your store…">
        Create store
      </SubmitButton>
    </form>
  );
}
