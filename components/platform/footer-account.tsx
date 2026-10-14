"use client";

import { useAccount, dashboardHref } from "@/components/platform/use-account";
import { MasterDashboardLink } from "@/components/platform/gold-glass";

/**
 * The footer's links that depend on who is looking (14 October): "Dashboard"
 * for someone signed in, "Log in / Sign up free" for a visitor, and for a
 * Synora master admin "Master dashboard" in gold as well. While the browser is
 * still asking, the visitor's links hold the place invisibly.
 */
export function FooterAccountLinks({ linkClass, login, signup, slot }: { linkClass: string; login: string; signup: string; slot: "account" | "master" }) {
  const me = useAccount();
  if (slot === "master") {
    return me?.master != null ? (
      <li>
        <MasterDashboardLink />
      </li>
    ) : null;
  }
  if (me) {
    return (
      <li>
        <a href={dashboardHref(me)} className={linkClass}>
          Dashboard
        </a>
      </li>
    );
  }
  return (
    <li className={me === undefined ? "invisible" : ""}>
      <a href={login} className={linkClass}>
        Log in
      </a>
      <span className="mx-1.5 text-current opacity-40">/</span>
      <a href={signup} className={linkClass}>
        Sign up free
      </a>
    </li>
  );
}
