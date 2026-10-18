"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { resolveNav, type NavTone } from "@/lib/admin-nav";

/**
 * The start of every heading (18 October): the section's own colour and
 * glyph, then the section's name as a crumb when you are on one of its other
 * screens. Read from the navigation model, so it can never disagree with the
 * rail.
 */
const CHIP: Record<NavTone, string> = {
  iris: "bg-[#6666ff] text-white",
  lavender: "bg-[#b7b9ff] text-[#0a0a0a]",
  sky: "bg-[#c8e7ff] text-[#0a0a0a]",
  mint: "bg-[#b8efd6] text-[#0a0a0a]",
  ink: "bg-[#0a0a0a]/[0.07] text-[#0a0a0a]",
};

export function HeadingTrail({ crumbs = [], title }: { crumbs?: { label: string; href: string }[]; title?: string }) {
  const path = usePathname();
  const { section, current } = resolveNav(path);
  const Icon = section.icon;
  const away = current !== section.href || path !== section.href || (title !== undefined && title !== section.label);
  const trail = [...(away ? [{ label: section.label, href: section.href }] : []), ...crumbs];
  return (
    <>
      <span aria-hidden className={`mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-[8px] ${CHIP[section.tone]}`}>
        <Icon className="h-[15px] w-[15px]" />
      </span>
      {trail.map((c) => (
        <span key={c.href} className="flex shrink-0 items-center gap-1.5 text-[13px] text-[#0a0a0a]/50 max-sm:hidden">
          <Link href={c.href} className="hover:text-[#0a0a0a]">{c.label}</Link>
          <ChevronRight className="h-3.5 w-3.5 text-[#0a0a0a]/30" />
        </span>
      ))}
    </>
  );
}
