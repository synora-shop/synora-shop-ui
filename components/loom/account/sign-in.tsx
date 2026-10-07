"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton } from "@/components/loom/primitives";
import { LoomField } from "@/components/loom/commerce";
import { T } from "@/components/loom/type";

/**
 * Sign in, and create an account — one page that turns between the two, so
 * somebody who arrives at the wrong one is a click from the right one.
 *
 * Not in the kit. One column 411 wide — the hero's copy column, the narrowest
 * block of words the kit sets — with a Heading 1 over the fields, the kit's
 * button, and the other way in under the section rule. The phone is the same
 * column in the 16px gutter.
 */
export function LoomSignIn() {
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
    if (mode === "up" && !values.name.trim()) next.name = "What should we call you?";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) next.email = "That does not look like an email address.";
    if (values.password.length < (mode === "up" ? 8 : 1)) {
      next.password = mode === "up" ? "At least eight characters." : "Your password.";
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
            {mode === "in" ? "Sign in" : "Create an account"}
          </h1>
          <p className={cn(T.body6, "text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")}>
            {mode === "in"
              ? "Welcome back. Your orders, addresses and wishlist are waiting."
              : "Keep your orders in one place and check out faster next time."}
          </p>
        </div>

        <form noValidate onSubmit={submit} className="flex flex-col gap-[calc(20*var(--u))]">
          {mode === "up" && <LoomField label="Name" autoComplete="name" {...bind("name")} />}
          <LoomField label="Email" type="email" autoComplete="email" inputMode="email" {...bind("email")} />
          <LoomField
            label="Password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            {...bind("password")}
          />
          {mode === "in" && (
            <a href="#" className={cn(T.small, "self-start text-[#121212]/80 underline underline-offset-4")}>
              Forgot your password?
            </a>
          )}
          <LoomButton type="submit" data-m="signin-submit" className="mt-[calc(8*var(--u))] w-full min-w-0">
            {mode === "in" ? "Sign in" : "Create account"}
          </LoomButton>
        </form>

        <div className={cn("flex flex-col gap-[calc(16*var(--u))] pt-[calc(32*var(--u))]", LOOM_RULE)}>
          <p className={cn(T.body3, "text-[#121212]")}>{mode === "in" ? "New here?" : "Already have an account?"}</p>
          <LoomButton
            variant="outline"
            className="w-full min-w-0"
            onClick={() => {
              setMode((m) => (m === "in" ? "up" : "in"));
              setErrors({});
            }}
          >
            {mode === "in" ? "Create an account" : "Sign in instead"}
          </LoomButton>
        </div>
      </div>
    </section>
  );
}
