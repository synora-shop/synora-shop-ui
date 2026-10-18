"use client";

import { usePathname } from "next/navigation";
import { ICONS, TONE } from "@/components/new-admin/ui";
import { A, RAIL } from "@/components/next-admin/nav";

/**
 * The section's own colour beside every heading (the preview's page chip,
 * smaller): iris for Orders, mint for Products, sky for Customers… so a
 * glance says where you are without reading.
 */
export function SectionMark() {
  const path = usePathname();
  const g = [...RAIL].reverse().find((x) => (x.id === "home" ? path === x.href : path === x.href || path.startsWith(`${x.href}/`)));
  const meta = g ?? (path.startsWith(`${A}/settings`) || path.startsWith(`${A}/account`) ? { icon: "settings", tone: "ink" as const } : path.startsWith(`${A}/bin`) ? { icon: "boxes", tone: "ink" as const } : null);
  if (!meta) return null;
  const Icon = ICONS[meta.icon];
  return (
    <span aria-hidden className={`mr-1 grid h-7 w-7 shrink-0 place-items-center rounded-[8px] ${meta.tone === "ink" ? "bg-[#0a0a0a]/[0.07] text-[#0a0a0a]" : TONE[meta.tone].chip}`}>
      <Icon className="h-[15px] w-[15px]" />
    </span>
  );
}
