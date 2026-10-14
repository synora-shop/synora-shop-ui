"use client";

import { useEffect, useState } from "react";

/**
 * Who is signed in, for the site's header and footer (14 October).
 *
 * Asked once per page load from /api/auth/session and shared by everything
 * that wants it, so the front page stays one cached page for everybody and
 * never reads the session itself (scripts/check-platform.ts). `undefined`
 * while asking, `null` for a visitor. A shopper's session (customerId) is for
 * one shop, not for us, and counts as a visitor.
 */
export type Account = {
  name: string;
  email: string;
  /** A Synora master admin's avatar initials ("" if none set); null for everyone else. */
  master: string | null;
  shops: { subdomain: string; role: string }[];
};

let asked: Promise<Account | null> | null = null;

function ask(): Promise<Account | null> {
  asked ??= fetch("/api/auth/session", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null))
    .then((s) => {
      const u = s?.user;
      return u?.id && !u.customerId ? { name: u.name ?? "", email: u.email ?? "", master: u.master ?? null, shops: u.shops ?? [] } : null;
    })
    .catch(() => null);
  return asked;
}

export function useAccount(): Account | null | undefined {
  const [me, setMe] = useState<Account | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    ask().then((a) => live && setMe(a));
    return () => {
      live = false;
    };
  }, []);
  return me;
}

/** Where "Dashboard" goes: the one shop's panel, or the list to choose or create one. */
export const dashboardHref = (a: Account) => (a.shops.length === 1 ? "/admin" : "/merchant/stores");
