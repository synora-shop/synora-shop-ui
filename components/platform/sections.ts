import { BookOpen, LifeBuoy, Sparkles, type LucideIcon } from "lucide-react";

/**
 * The site's three help pages and their colours (14 October). Each page wears
 * its colour everywhere it appears, the header link, the phone tab, the band
 * at the top of the page, so the colour alone says where you are.
 */
export type HelpSection = "docs" | "support" | "release-notes";

export const SECTIONS: {
  id: HelpSection;
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
  dot: string;
  on: string;
  tab: string;
}[] = [
  { id: "docs", href: "/docs", label: "Documentation", short: "Docs", icon: BookOpen, dot: "bg-[#6666ff]", on: "bg-[#ecebff] text-[#4b4bea]", tab: "bg-[#6666ff] text-white" },
  { id: "support", href: "/support", label: "Support", short: "Support", icon: LifeBuoy, dot: "bg-[#2fb37c]", on: "bg-[#ddf6ea] text-[#16704a]", tab: "bg-[#1f9d68] text-white" },
  { id: "release-notes", href: "/release-notes", label: "Release notes", short: "Updates", icon: Sparkles, dot: "bg-[#3d97e0]", on: "bg-[#e1f0ff] text-[#1b5d97]", tab: "bg-[#2f86cf] text-white" },
];
