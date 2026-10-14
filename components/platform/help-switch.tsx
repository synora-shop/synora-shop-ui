import Link from "next/link";
import { BookOpen, LifeBuoy, Sparkles } from "lucide-react";
import { SearchButton } from "@/components/platform/help-search";

/**
 * Moving between the three help pages (14 October): Docs, Help, Release
 * notes. In the header on wide screens, a segmented switch with the search
 * beside it; on phones, a tab bar along the bottom of the screen, where a
 * thumb already is, with search as its fourth tab.
 */
export type HelpSection = "docs" | "help" | "release-notes";

const SECTIONS: { id: HelpSection; href: string; label: string; short: string; icon: typeof BookOpen }[] = [
  { id: "docs", href: "/docs", label: "Docs", short: "Docs", icon: BookOpen },
  { id: "help", href: "/help", label: "Help", short: "Help", icon: LifeBuoy },
  { id: "release-notes", href: "/release-notes", label: "Release notes", short: "Updates", icon: Sparkles },
];

export function SectionSwitch({ active }: { active: HelpSection }) {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <nav aria-label="Help pages" className="flex items-center rounded-full bg-[#f2f2ff] p-1">
        {SECTIONS.map(({ id, href, label, short, icon: Icon }) => {
          const on = id === active;
          return (
            <Link
              key={id}
              href={href}
              aria-current={on ? "page" : undefined}
              className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition-all lg:px-3.5 ${
                on ? "bg-white text-[#4b4bea] shadow-[0_2px_10px_-3px_rgba(13,13,80,0.25)]" : "text-[#0d0d50]/60 hover:text-[#0d0d50]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="lg:hidden">{short}</span>
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <SearchButton />
    </div>
  );
}

export function SectionTabBar({ active }: { active: HelpSection }) {
  return (
    <nav
      aria-label="Help pages"
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-[1.4rem] border border-[#0d0d50]/[0.08] bg-white/90 p-1.5 shadow-[0_12px_40px_-12px_rgba(13,13,80,0.35)] backdrop-blur-md md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {SECTIONS.map(({ id, href, short, icon: Icon }) => {
        const on = id === active;
        return (
          <Link
            key={id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition-colors ${on ? "bg-[#6666ff] text-white" : "text-[#0d0d50]/60"}`}
          >
            <Icon className="h-5 w-5" />
            {short}
          </Link>
        );
      })}
      <SearchButton tab />
    </nav>
  );
}
