"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { ktx } from "@/components/kite/text";
import { kitRequestCode, kitSignInWithCode } from "@/lib/themes/kit-actions";
import { KiteButton, KiteField, KitePage, KiteTextLink, KiteTitle } from "@/components/kite/ui";

/**
 * Sign in — also how an account is made: an email, then the code sent to it,
 * no password (decided 8 October). Not in the file: one column the account's
 * intro width, 425 on the desktop, with the account's serif over Kite's field
 * and button. The second step keeps the column and swaps the field.
 */
export function KiteSignIn({ ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const router = useRouter();
  const live = !!ctx.live;
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);
  const t = kt("sans", 14, 20);

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

  return (
    <KitePage k="sign-in" className="flex justify-center">
      <div className="flex w-full flex-col gap-[calc(32*var(--u))] md:w-[calc(425*var(--u))] md:py-[calc(64*var(--u))]">
        <div className="flex flex-col gap-[calc(8*var(--u))]">
          <KiteTitle>{ktx(ctx, "account.signInHeading")}</KiteTitle>
          <p {...t}>{step === "email" ? ktx(ctx, "account.signInText") : ktx(ctx, "account.codeSent", { email: email.trim() })}</p>
        </div>
        {step === "email" ? (
          <form
            noValidate
            className="flex flex-col gap-[calc(32*var(--u))]"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(ktx(ctx, "account.emailError"));
              if (await send()) {
                setStep("code");
                setCode("");
                setResent(false);
              }
            }}
          >
            <KiteField label={ktx(ctx, "account.email")} type="email" autoComplete="email" inputMode="email" value={email} error={error ?? undefined} onChange={(e) => { setEmail(e.target.value); setError(null); }} />
            <KiteButton type="submit" disabled={busy} className="w-full">{ktx(ctx, "account.sendCode")}</KiteButton>
          </form>
        ) : (
          <form
            noValidate
            className="flex flex-col gap-[calc(32*var(--u))]"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) return setError(ktx(ctx, "account.codeError"));
              if (!live) return router.push(ctx.routes.account);
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
            }}
          >
            <KiteField label={ktx(ctx, "account.code")} autoComplete="one-time-code" inputMode="numeric" maxLength={7} value={code} error={error ?? undefined} onChange={(e) => { setCode(e.target.value); setError(null); }} />
            <KiteButton type="submit" disabled={busy} className="w-full">{ktx(ctx, "account.signInButton")}</KiteButton>
            <div className={cn("flex flex-wrap justify-between gap-[calc(16*var(--u))]")}>
              <KiteTextLink onClick={() => { setStep("email"); setError(null); }}>{ktx(ctx, "account.differentEmail")}</KiteTextLink>
              <KiteTextLink onClick={async () => { if (await send()) setResent(true); }}>{resent ? ktx(ctx, "account.codeResent") : ktx(ctx, "account.sendAgain")}</KiteTextLink>
            </div>
          </form>
        )}
      </div>
    </KitePage>
  );
}
