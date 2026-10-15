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

export function SettingsFrame({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const { current } = resolveNav(path);
  const tabs = sections().find((s) => s.key === "settings")?.tabs ?? [];
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = tabs.filter((t) => words.every((w) => `${t.label} ${WORDS[t.href] ?? ""}`.toLowerCase().includes(w)));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <nav aria-label="Settings" className="flex flex-col gap-3 lg:sticky lg:top-20 lg:self-start">
        <label className="flex h-10 items-center gap-2 rounded-[10px] bg-white px-3 ring-1 ring-[#0a0a0a]/12 focus-within:ring-2 focus-within:ring-[#0a0a0a]">
          <Search className="h-4 w-4 text-[#0a0a0a]/40" />
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
            className="min-w-0 flex-1 !bg-transparent text-[14px] outline-none"
          />
        </label>
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-visible">
          {shown.length === 0 && <li className="px-3 py-2 text-[13px] text-[#0a0a0a]/50">No setting matches.</li>}
          {shown.map((t) => {
            const Icon = ICON[t.href] ?? Store;
            const on = t.href === current;
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 whitespace-nowrap rounded-[10px] px-2.5 py-[7px] text-[13.5px] transition-colors",
                    on ? "bg-[#0a0a0a] font-semibold text-white" : "text-[#0a0a0a]/65 hover:bg-[#0a0a0a]/[0.04] hover:text-[#0a0a0a]"
                  )}
                >
                  <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md", on ? "bg-white text-[#0a0a0a]" : "bg-[#0a0a0a]/[0.05]")}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0 max-w-4xl">{children}</div>
    </div>
  );
}
