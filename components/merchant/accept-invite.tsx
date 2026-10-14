"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/app/admin/staff-actions";
import { FormMessage } from "./form-shell";
import { startNavProgress } from "@/components/ui/nav-progress";

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
    // Straight into the store. acceptInvite has already refreshed the session
    // and chosen this store, so the dashboard opens at once. It used to
    // router.refresh() here instead, which re-rendered this page with the
    // invitation now "used": the welcome and its button vanished and the
    // person was told to sign in again. Fixed 14 October.
    startNavProgress();
    router.push("/admin");
  }

  if (done) {
    return (
      <div className="space-y-4">
        <FormMessage tone="success">{done}</FormMessage>
        <button
          type="button"
          onClick={() => {
            startNavProgress();
            router.push("/admin");
            router.refresh();
          }}
          className="w-full h-12 rounded-full bg-[#6666ff] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(102,102,255,0.8)] transition-colors hover:bg-[#5a5af5]"
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
        className="w-full h-12 rounded-full bg-[#6666ff] px-5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-12px_rgba(102,102,255,0.8)] transition-colors hover:bg-[#5a5af5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6666ff] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Joining…" : `Join ${shopName}`}
      </button>
    </div>
  );
}
