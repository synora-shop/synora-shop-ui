"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LoomButton } from "@/components/loom/primitives";
import { LoomField } from "@/components/loom/commerce";
import { T } from "@/components/loom/type";
import type { LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";
import { kitRequestCode, kitSignInWithCode } from "@/lib/themes/kit-actions";

/**
 * Sign in — which is also how an account is made. An email, then the code
 * sent to it; no password anywhere (decided 8 October, as Shopify's new
 * customer accounts). Somebody new and somebody returning do exactly the same
 * thing, so there is no "create an account" to find.
 *
 * Not in the kit. One column 411 wide — the hero's copy column, the narrowest
 * block of words the kit sets — with a Heading 1 over the field and the kit's
 * button. The second step keeps the column and swaps the field: the code, the
 * address it went to, and the ways out (another address, a new code). The
 * phone is the same column in the 16px gutter.
 */
export function LoomSignIn({ ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const router = useRouter();
  const live = !!ctx.live;
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const send = async () => {
    setBusy(true);
    setError(null);
    // The reference build has nobody to email: it goes straight to the code.
    const r = live ? await kitRequestCode(email) : { ok: true as const };
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return false;
    }
    return true;
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError(tx(ctx, "account.emailError"));
      return;
    }
    if (await send()) {
      setStep("code");
      setCode("");
      setResent(false);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
      setError(tx(ctx, "account.codeError"));
      return;
    }
    if (!live) {
      router.push(ctx.routes.account);
      return;
    }
    setBusy(true);
    setError(null);
    const r = await kitSignInWithCode(email, code);
    if (!r.ok) {
      setError(r.error);
      setBusy(false);
      return;
    }
    // A full load, so the header and every server-drawn page see the new session.
    window.location.assign(ctx.afterSignIn || ctx.routes.account);
  };

  return (
    <section className="flex justify-center px-[calc(16*var(--u))] pb-[calc(80*var(--u))] pt-[calc(16*var(--u))] md:pb-[calc(120*var(--u))] md:pt-[calc(40*var(--u))]">
      <div className="flex w-full flex-col gap-[calc(32*var(--u))] md:w-[calc(411*var(--u))]">
        <div className="flex flex-col gap-[calc(16*var(--u))]">
          <h1 data-m="signin-title" className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
            {tx(ctx, "account.signInHeading")}
          </h1>
          <p className={cn(T.body6, "text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")}>
            {step === "email" ? tx(ctx, "account.signInText") : tx(ctx, "account.codeSent", { email: email.trim() })}
          </p>
        </div>

        {step === "email" ? (
          <form noValidate onSubmit={submitEmail} data-m="signin-email" className="flex flex-col gap-[calc(16*var(--u))]">
            <LoomField
              label={tx(ctx, "account.email")}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              error={error ?? undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
            />
            <LoomButton type="submit" data-m="signin-submit" className="mt-[calc(8*var(--u))] w-full min-w-0" disabled={busy}>
              {tx(ctx, "account.sendCode")}
            </LoomButton>
          </form>
        ) : (
          <form noValidate onSubmit={submitCode} data-m="signin-code" className="flex flex-col gap-[calc(16*var(--u))]">
            <LoomField
              label={tx(ctx, "account.code")}
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={7}
              value={code}
              error={error ?? undefined}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
            />
            <LoomButton type="submit" data-m="signin-submit" className="mt-[calc(8*var(--u))] w-full min-w-0" disabled={busy}>
              {tx(ctx, "account.signInButton")}
            </LoomButton>
            <div className="flex flex-wrap justify-between gap-[calc(16*var(--u))]">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className={cn(T.small, "text-[#121212]/80 underline underline-offset-4")}
              >
                {tx(ctx, "account.differentEmail")}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (await send()) setResent(true);
                }}
                className={cn(T.small, "text-[#121212]/80 underline underline-offset-4")}
              >
                {resent ? tx(ctx, "account.codeResent") : tx(ctx, "account.sendAgain")}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
