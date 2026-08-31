"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { changePassword, resendVerification, revokeAllSessions } from "@/app/merchant/actions";
import { PasswordInput } from "@/components/ui/password-input";
import { Button, Card } from "@/components/ui/primitives";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Field, FormMessage } from "@/components/merchant/form-shell";

export function AccountSecurity({
  email,
  emailVerified,
}: {
  email: string;
  emailVerified: boolean;
}) {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const next = String(data.get("next") ?? "");

    if (next !== String(data.get("confirm") ?? "")) {
      setError("Those two passwords don't match.");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(String(data.get("current") ?? ""), next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      form.reset();
      toast.success(result.message ?? "Password changed.");
    });
  }

  return (
    <div className="space-y-6">
      {dialog}

      {!emailVerified && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber/30 bg-amber-bg p-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Confirm your email address</p>
            <p className="mt-0.5 text-xs leading-snug text-ink-soft">
              Until {email} is confirmed you can&rsquo;t be given ownership of a store, and we
              can&rsquo;t help you recover this account.
            </p>
          </div>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await resendVerification(email);
                if (result.ok) toast.success(result.message ?? "Sent.");
                else toast.error(result.error, { blocking: true });
              })
            }
          >
            Send the link again
          </Button>
        </Card>
      )}

      <Card className="p-4">
        <h2 className="text-sm font-medium text-ink">Change your password</h2>
        <p className="mt-0.5 text-xs text-ink-soft">
          Changing it signs you out on every other device.
        </p>

        <form onSubmit={handleChangePassword} className="mt-4 max-w-sm space-y-4">
          <Field label="Current password">
            <PasswordInput name="current" autoComplete="current-password" required />
          </Field>
          <Field label="New password" hint="At least 10 characters.">
            <PasswordInput name="next" autoComplete="new-password" required minLength={10} />
          </Field>
          <Field label="Confirm new password">
            <PasswordInput name="confirm" autoComplete="new-password" required minLength={10} />
          </Field>

          {error && <FormMessage tone="error">{error}</FormMessage>}

          <Button type="submit" variant="primary" disabled={pending}>
            <ShieldCheck className="h-4 w-4" />
            {pending ? "Changing…" : "Change password"}
          </Button>
        </form>
      </Card>

      <Card className="p-4">
        <h2 className="text-sm font-medium text-ink">Sign out everywhere</h2>
        <p className="mt-0.5 max-w-prose text-xs leading-snug text-ink-soft">
          Ends every session on every device, including this one. Use it if you&rsquo;ve signed in
          somewhere you don&rsquo;t control, or you think someone else has your password, then
          change it.
        </p>
        <Button
          className="mt-4"
          variant="danger"
          disabled={pending}
          onClick={async () => {
            const ok = await confirm({
              title: "Sign out on every device?",
              description:
                "You'll be signed out here too and will need to sign in again. Nothing else changes.",
              confirmLabel: "Sign out everywhere",
              danger: true,
            });
            if (!ok) return;

            startTransition(async () => {
              const result = await revokeAllSessions();
              if (!result.ok) {
                toast.error(result.error, { blocking: true });
                return;
              }
              // The session cookie is still in the browser and would otherwise
              // survive until the token is next revalidated. Clear it now so
              // "everywhere" includes the tab the button was pressed in.
              await signOut({ callbackUrl: "/merchant/login" });
            });
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out everywhere
        </Button>
      </Card>
    </div>
  );
}
