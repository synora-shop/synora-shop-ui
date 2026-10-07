"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton } from "@/components/loom/primitives";
import { LoomField } from "@/components/loom/commerce";
import { T } from "@/components/loom/type";
import type { LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";

/**
 * Sign in, and create an account — one page that turns between the two, so
 * somebody who arrives at the wrong one is a click from the right one.
 *
 * Not in the kit. One column 411 wide — the hero's copy column, the narrowest
 * block of words the kit sets — with a Heading 1 over the fields, the kit's
 * button, and the other way in under the section rule. The phone is the same
 * column in the 16px gutter.
 */
export function LoomSignIn({ ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Partial<typeof values>>({});

  const bind = (k: keyof typeof values) => ({
    value: values[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [k]: e.target.value }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<typeof values> = {};
    if (mode === "up" && !values.name.trim()) next.name = tx(ctx, "account.nameError");
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = tx(ctx, "account.emailError");
    if (values.password.length < (mode === "up" ? 8 : 1)) {
      next.password = tx(ctx, mode === "up" ? "account.passwordShortError" : "account.passwordError");
    }
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() => (document.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus());
      return;
    }
    // A reference build: there is no account behind this, so arriving is the demo.
    router.push("/loom/account");
  };

  return (
    <section className="flex justify-center px-[calc(16*var(--u))] pb-[calc(80*var(--u))] pt-[calc(16*var(--u))] md:pb-[calc(120*var(--u))] md:pt-[calc(40*var(--u))]">
      <div className="flex w-full flex-col gap-[calc(32*var(--u))] md:w-[calc(411*var(--u))]">
        <div className="flex flex-col gap-[calc(16*var(--u))]">
          <h1 data-m="signin-title" className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
            {tx(ctx, mode === "in" ? "account.signInHeading" : "account.createAccountHeading")}
          </h1>
          <p className={cn(T.body6, "text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")}>
            {tx(ctx, mode === "in" ? "account.signInText" : "account.createAccountText")}
          </p>
        </div>

        <form noValidate onSubmit={submit} className="flex flex-col gap-[calc(20*var(--u))]">
          {mode === "up" && <LoomField label={tx(ctx, "account.name")} autoComplete="name" {...bind("name")} />}
          <LoomField label={tx(ctx, "account.email")} type="email" autoComplete="email" inputMode="email" {...bind("email")} />
          <LoomField
            label={tx(ctx, "account.password")}
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            {...bind("password")}
          />
          {mode === "in" && (
            <a href="#" className={cn(T.small, "self-start text-[#121212]/80 underline underline-offset-4")}>
              {tx(ctx, "account.forgotPassword")}
            </a>
          )}
          <LoomButton type="submit" data-m="signin-submit" className="mt-[calc(8*var(--u))] w-full min-w-0">
            {tx(ctx, mode === "in" ? "account.signInButton" : "account.createAccountButton")}
          </LoomButton>
        </form>

        <div className={cn("flex flex-col gap-[calc(16*var(--u))] pt-[calc(32*var(--u))]", LOOM_RULE)}>
          <p className={cn(T.body3, "text-[#121212]")}>{tx(ctx, mode === "in" ? "account.noAccountPrompt" : "account.haveAccountPrompt")}</p>
          <LoomButton
            variant="outline"
            className="w-full min-w-0"
            onClick={() => {
              setMode((m) => (m === "in" ? "up" : "in"));
              setErrors({});
            }}
          >
            {tx(ctx, mode === "in" ? "account.createOneLink" : "account.signInLink")}
          </LoomButton>
        </div>
      </div>
    </section>
  );
}
