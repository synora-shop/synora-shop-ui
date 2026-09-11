"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveNav } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * The second level of navigation: the tabs belonging to the sidebar item you
 * are standing in.
 *
 * Which tabs appear is decided entirely by the sidebar — see lib/admin-nav.ts.
 * That is the whole idea of the two-level scheme: the left column never
 * changes, so this row can, and a merchant only ever reads the handful of
 * screens that are relevant to what they are doing.
 *
 * Nothing is drawn for a section with one screen. A bar containing a single tab
 * is furniture that says "you are where you are".
 */
export function AdminNavBar() {
  const pathname = usePathname();
  const { tabs, current } = resolveNav(pathname);
  if (tabs.length === 0) return null;

  return (
    <div className="rounded-2xl bg-panel px-4 py-2.5 shadow-panel sm:px-5">
      {/* Scrolls rather than wraps: a wrapped tab row changes height as you move
          between sections, and everything below it jumps. */}
      <nav className="flex items-center gap-5 overflow-x-auto sm:gap-7 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const active = tab.href === current;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-shrink-0 whitespace-nowrap py-0.5 text-[15px] transition-colors",
                // Underlined *and* recoloured, per the design document. Either
                // alone would do the job on its own; together they survive a
                // colour-blind reader and a bad screen.
                active
                  ? "font-medium text-brand-500 underline decoration-2 underline-offset-[6px]"
                  : "text-control-ink hover:text-ink"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
