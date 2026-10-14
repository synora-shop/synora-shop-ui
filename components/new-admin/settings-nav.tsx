"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { ICONS, TONE } from "@/components/new-admin/ui";
import { WORDS } from "@/components/new-admin/settings-words";
import { SETTINGS } from "@/lib/new-admin/sample";

/**
 * The settings list (preview). Stays where it is while the section beside it
 * changes; type to narrow it ("jazz" leaves Payments), Enter opens the first.
 */
export function SettingsNav() {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = SETTINGS.filter((s) => words.every((w) => `${s.label} ${s.blurb} ${WORDS[s.slug] ?? ""}`.toLowerCase().includes(w)));
  return (
    <nav aria-label="Settings" className="flex min-h-0 flex-col gap-3">
      <label className="flex h-10 items-center gap-2 rounded-[10px] bg-white px-3 ring-1 ring-[#0a0a0a]/12 focus-within:ring-2 focus-within:ring-[#0a0a0a]">
        <Search className="h-4 w-4 text-[#0a0a0a]/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && shown[0]) { router.push(`/new-admin/settings/${shown[0].slug}`); setQ(""); } }}
          placeholder="Find a setting"
          aria-label="Find a setting"
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
        />
      </label>
      <ul className="-mx-1 flex min-h-0 gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:overflow-x-visible">
        {shown.length === 0 && <li className="px-3 py-2 text-[13px] text-[#0a0a0a]/50">No setting matches.</li>}
        {shown.map((s, i) => {
          const Icon = ICONS[s.icon];
          const on = path === `/new-admin/settings/${s.slug}`;
          const head = !q && s.group !== shown[i - 1]?.group;
          return (
            <li key={s.slug}>
              {head && <p className={`hidden px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#0a0a0a]/35 lg:block ${i > 0 ? "pt-3" : ""}`}>{s.group}</p>}
              <Link
                href={`/new-admin/settings/${s.slug}`}
                aria-current={on ? "page" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-[10px] px-2.5 py-[7px] text-[13.5px] transition-colors ${on ? "bg-[#0a0a0a] font-semibold text-white" : "text-[#0a0a0a]/65 hover:bg-[#0a0a0a]/[0.04] hover:text-[#0a0a0a]"}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${on ? (s.tone === "ink" ? "bg-white text-[#0a0a0a]" : TONE[s.tone].chip) : "bg-[#0a0a0a]/[0.05]"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
