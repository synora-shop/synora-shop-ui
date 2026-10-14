"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { AccountAvatar } from "@/components/platform/account-avatar";

/** Who is signed in to the console, and the way out (14 October). */
export function ConsoleAccount({ name, email, initials, compact = false }: { name: string; email: string; initials: string; compact?: boolean }) {
  const [leaving, setLeaving] = useState(false);
  const out = () => {
    setLeaving(true);
    signOut({ redirectTo: "/" });
  };
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <AccountAvatar initials={initials} master />
        <button type="button" onClick={out} disabled={leaving} aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-full text-[#0d0d50]/55 hover:bg-[#fff4ee] hover:text-[#c2410c]">
          {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-[#f6f6fb] p-3.5">
      <div className="flex items-center gap-3">
        <AccountAvatar initials={initials} master size="md" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{name}</p>
          <p className="truncate text-[12px] text-[#0d0d50]/55">{email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={out}
        disabled={leaving}
        className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-full bg-white text-[13px] font-semibold text-[#0d0d50]/75 transition-colors hover:bg-white hover:text-[#c2410c]"
      >
        {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Sign out
      </button>
    </div>
  );
}
