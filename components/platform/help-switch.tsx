import Link from "next/link";
import { SearchButton } from "@/components/platform/help-search";
import { SECTIONS, type HelpSection } from "@/components/platform/sections";

export type { HelpSection };

/**
 * On a phone, the three help pages' tab bar (14 October): Docs, Help,
 * Updates and Search along the bottom of the screen, where a thumb already
 * is. The lit tab wears its page's colour. Wider screens use the header.
 */
export function SectionTabBar({ active }: { active: HelpSection }) {
  return (
    <nav
      aria-label="Help pages"
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-[1.4rem] border border-[#0d0d50]/[0.08] bg-white/90 p-1.5 shadow-[0_12px_40px_-12px_rgba(13,13,80,0.35)] backdrop-blur-md md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {SECTIONS.map(({ id, href, short, icon: Icon, tab }) => {
        const on = id === active;
        return (
          <Link
            key={id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-semibold transition-colors ${on ? tab : "text-[#0d0d50]/60"}`}
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
