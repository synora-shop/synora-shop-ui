"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { resolveNav } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * The navigation bar: the screens of whichever sidebar section you are in.
 *
 * It was dissolved on 21 September — the tabs moved into the sidebar, hung
 * under the section you were standing in — and the design of 22 September puts
 * it back. The reason it was dissolved was that the same links read twice on
 * one screen; the sidebar no longer lists them, so they do not.
 *
 * **A section with one screen draws no bar at all.** Data, Discounts,
 * Customers, Analytics and Account are one screen each, and a bar with a single
 * tab in it is furniture: it says nothing, costs 55px, and gives the eye a
 * control that cannot be used. `resolveNav` returns an empty list for those,
 * so the decision is made once, in the navigation, rather than per screen.
 *
 * It does not move. The whole panel scrolls inside the main container and
 * nothing else does, so the tabs stay where they were put — a merchant halfway
 * down a long product list can still reach Categories without scrolling back.
 *
 * Hidden screens are not here on purpose. Page drafts and Site text belong to
 * Your App and draw no tab, because both are on their way somewhere else — see
 * docs/PANEL.md §4. They still light this section in the sidebar.
 */
export function AdminNavbar() {
  const pathname = usePathname();
  const { tabs, current } = resolveNav(pathname);

  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Section"
      className="h-[var(--navbar-h)] flex-shrink-0 rounded-[var(--radius-container)] bg-panel shadow-container"
    >
      {/* Sliding rather than wrapping, and only when it has to.
          
          A bar that wrapped would be 110px on the screens with the most tabs
          and 55px everywhere else, so the content below it would start at a
          different height depending on which section you were in. Its own
          scroll keeps the bar one row tall whatever it holds.
          
          scrollbar-none because a visible scrollbar inside a 55px bar eats the
          bottom of the labels; the overflow is discoverable by dragging, which
          is how every other horizontal strip on a touch screen works. */}
      <ul className="scrollbar-none flex h-full items-center gap-1 overflow-x-auto px-[var(--pad-container)]">
        {tabs.map((tab) => {
          const here = tab.href === current;
          return (
            <li key={tab.href} className="flex-shrink-0">
              <Link
                href={tab.href}
                aria-current={here ? "page" : undefined}
                className={cn(
                  // 20px, and the active one is semibold rather than merely
                  // coloured — the same three-part active state as the
                  // sidebar: plate, colour, weight.
                  "flex h-[calc(38*var(--u))] items-center rounded-[var(--radius-inner)] px-[calc(14*var(--u))] text-[length:var(--text-normal)] transition-colors",
                  here
                    ? "bg-selected font-semibold text-brand-500"
                    : "text-control-ink hover:bg-control"
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
