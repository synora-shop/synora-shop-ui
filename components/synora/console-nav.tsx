"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bug, Lightbulb, Sparkles } from "lucide-react";

/** The console's sections; the one you are in is lit (by address). */
export function ConsoleNav({ counts }: { counts: { tickets: number; suggestions: number } }) {
  const path = usePathname();
  const items = [
    { href: "/synora/tickets", label: "Tickets", icon: Bug, count: counts.tickets, match: ["/synora/tickets"] },
    { href: "/synora/suggestions", label: "Suggestions", icon: Lightbulb, count: counts.suggestions, match: ["/synora/suggestions"] },
    { href: "/synora/patch-notes", label: "Patch notes", icon: Sparkles, count: 0, match: ["/synora/patch-notes"] },
  ];
  return (
    <nav aria-label="Console" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon, count, match }) => {
        const on = match.some((m) => path.startsWith(m));
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14.5px] font-semibold transition-colors ${
              on ? "bg-[#6666ff] text-white shadow-[0_8px_20px_-10px_rgba(102,102,255,0.9)]" : "text-[#0d0d50]/65 hover:bg-[#f2f2ff] hover:text-[#0d0d50]"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {count > 0 && <span className={`rounded-full px-2 py-0.5 text-[12px] font-bold ${on ? "bg-white/25" : "bg-[#ecebff] text-[#4b4bea]"}`}>{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
