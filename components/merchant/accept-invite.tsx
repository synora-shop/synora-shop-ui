"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/app/admin/staff-actions";
import { FormMessage } from "./form-shell";

export function AcceptInvite({ token, shopName }: { token: string; shopName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function accept() {
    setError(null);
    setPending(true);

    const result = await acceptInvite(token);
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    setDone(result.message ?? `You've joined ${shopName}.`);
    // The membership only reaches the session token on the next sign-in cycle,
    // so refresh rather than pushing straight into an admin the session does
    // not yet have access to.
    router.refresh();
  }

  if (done) {
    return (
      <div className="space-y-4">
        <FormMessage tone="success">{done}</FormMessage>
        <button
          type="button"
          onClick={() => {
            router.push("/admin");
            router.refresh();
          }}
          className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Go to {shopName}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <FormMessage tone="error">{error}</FormMessage>}
      <button
        type="button"
        onClick={accept}
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Joining…" : `Join ${shopName}`}
      </button>
    </div>
  );
}
