"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CreditCard, Globe, Search, Store, Truck, Users } from "lucide-react";
import { PreferencesIcon } from "@/components/admin/nav-icons";
import { resolveNav, sections } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * Settings, one screen at a time (new admin, 15 October).
 *
 * The list of every settings screen stays put on the left while the chosen
 * one fills the right, the way Shopify's settings work, so moving between
 * them is one click and you always see where else you could be. Type in the
 * box to narrow the list; Enter opens the first match.
 *
 * The list is the Settings section's own tabs in lib/admin-nav.ts, so a new
 * settings screen appears here by being added there, and lights by the same
 * rule as everything else.
 */
const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin/store": Store,
  "/admin/store-defaults": PreferencesIcon,
  "/admin/settings": Truck,
  "/admin/payments": CreditCard,
  "/admin/domains": Globe,
  "/admin/account": Users,
};

const WORDS: Record<string, string> = {
  "/admin/store": "name logo favicon address phone email contact identity",
  "/admin/store-defaults": "currency time zone units weight business type restaurant blog",
  "/admin/settings": "shipping delivery contact whatsapp checkout notifications push",
  "/admin/payments": "jazzcash easypaisa card cash on delivery cod bank gateway",
  "/admin/domains": "domain dns address https",
  "/admin/account": "password staff team invite role security sessions owner",
};

export function SettingsFrame({ children, header }: { children: ReactNode; header?: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const { current } = resolveNav(path);
  const tabs = sections().find((s) => s.key === "settings")?.tabs ?? [];
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = tabs.filter((t) => words.every((w) => `${t.label} ${WORDS[t.href] ?? ""}`.toLowerCase().includes(w)));

  return (
    <>
      {header}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-5">
        {/* The second sidebar (18 October): a charcoal panel a step lighter
            than the rail, one colour throughout, the open screen lit white
            with an iris mark. */}
        <nav aria-label="Settings" className="rounded-[16px] bg-[#1a1a1a] p-1.5 text-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)] lg:sticky lg:top-[72px] lg:self-start">
          <label className="mb-1 flex h-8 items-center gap-2 rounded-[10px] bg-white/[0.07] px-2.5 focus-within:bg-white/[0.11]">
            <Search className="h-3.5 w-3.5 text-white/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && shown[0]) {
                  router.push(shown[0].href);
                  setQ("");
                }
              }}
              placeholder="Find a setting"
              aria-label="Find a setting"
              className="min-w-0 flex-1 !bg-transparent text-[13px] text-white outline-none placeholder:text-white/35"
            />
          </label>
          <ul className="flex gap-px overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible">
            {shown.length === 0 && <li className="px-2.5 py-2 text-[12.5px] text-white/45">No setting matches.</li>}
            {shown.map((t) => {
              const Icon = ICON[t.href] ?? Store;
              const on = t.href === current;
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "relative flex h-8 items-center gap-2.5 whitespace-nowrap rounded-[9px] px-2.5 text-[13px] transition-colors",
                      on
                        ? "bg-white/[0.1] font-semibold text-white before:absolute before:-left-1.5 before:top-1.5 before:h-5 before:w-[3px] before:rounded-r-full before:bg-[#8f8fff]"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", on ? "text-[#b7b9ff]" : "text-white/45")} />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0 max-w-4xl">{children}</div>
      </div>
    </>
  );
}
