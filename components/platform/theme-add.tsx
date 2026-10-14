"use client";

import { ArrowUpRight, Plus } from "lucide-react";
import { AccountAvatar } from "@/components/platform/account-avatar";
import { useAccount } from "@/components/platform/use-account";
import { initialsOf } from "@/lib/initials";

/**
 * "Add to my store" for a theme (14 October), on the Theme Store and on the
 * bar across each demo.
 *
 * Signed in: opens the admin's Themes page in a new tab with the theme
 * waiting to be added (/admin/theme?add=kite), so the store page stays where
 * it was. Adding puts a copy in the library, not live. A visitor is offered
 * sign-up, or log-in, and after logging in lands on the same page.
 */
export function ThemeAdd({ themeKey, name, login, signup, tone = "light", withAvatar = false, onDark = false }: { themeKey: string; name: string; login: string; signup: string; tone?: "light" | "dark"; withAvatar?: boolean; onDark?: boolean }) {
  const me = useAccount();
  const target = `/admin/theme?add=${encodeURIComponent(themeKey)}`;
  const primary =
    tone === "dark"
      ? "bg-white text-[#0c0c4a] hover:bg-white/90"
      : "bg-[#6666ff] text-white shadow-[0_10px_28px_-12px_rgba(102,102,255,0.9)] hover:bg-[#5a5af5]";
  const secondary = tone === "dark" || onDark ? "text-white/80 hover:text-white" : "text-[#0d0d50]/70 hover:text-[#0d0d50]";
  const size = tone === "dark" ? "h-8 px-3.5 text-[13px]" : "h-12 px-6 text-[15px]";

  if (me === undefined) return <span className={`inline-block ${size}`} aria-hidden />;

  if (me) {
    return (
      <span className="inline-flex items-center gap-2">
        <a href={target} target="_blank" rel="noopener" className={`inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors ${size} ${primary}`}>
          <Plus className="h-4 w-4" /> Add {name} to my store <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
        </a>
        {withAvatar && <AccountAvatar initials={(me.master !== null && me.master) || initialsOf(me.name, me.email)} master={me.master !== null} />}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <a href={`${login}?callbackUrl=${encodeURIComponent(target)}`} className={`rounded-full px-3 py-1.5 font-medium transition-colors ${tone === "dark" ? "text-[13px]" : "text-[15px]"} ${secondary}`}>
        Log in
      </a>
      <a href={signup} className={`inline-flex items-center rounded-full font-semibold transition-colors ${size} ${primary}`}>
        Sign up free to use {name}
      </a>
    </span>
  );
}
