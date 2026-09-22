"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAdminNav } from "@/lib/admin-nav-store";
import { resolveNav } from "@/lib/admin-nav";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { cn } from "@/lib/utils";

/**
 * Ten destinations, flat, in a fixed order, in three bands.
 *
 * The sidebar used to be seven collapsible groups holding twenty-odd links, and
 * it was the panel's worst screen: finding Orders meant guessing which group
 * owned it, opening that group, and reading past its siblings — three decisions
 * for one destination. Everything below the first level lives in the navigation
 * bar at the top of the page instead, so this list never changes shape, never
 * scrolls, and can be learned once.
 *
 * It held the second level for one day. On 21 September the navigation bar was
 * dissolved and each section dropped its screens underneath itself, with a line
 * drawn to the one you were on. The design of 22 September puts the bar back
 * and returns this to ten parent rows. What the dissolve was protecting
 * against — the same links appearing twice — does not arise, because this list
 * does not repeat them.
 *
 * The bands are not the old mistake returning. Nothing collapses, nothing is
 * hidden, no click is added: every destination is on screen at all times. A
 * band groups the runs that answer different questions — running the shop, how
 * the shop looks, and the account underneath it. Each band is one container
 * rather than a run of outlined pills, so the ten outlines that used to compete
 * with the one that mattered are down to three.
 *
 * No headings and no rules. A heading would add three lines of text to a list
 * whose whole virtue is that it can be taken in at a glance, and it would need
 * three names that are hard to get right and worse than silence when wrong.
 * Grouping is in lib/admin-nav.ts; this file only draws what it is given, so
 * the order and the bands cannot disagree.
 *
 * **The selected row is three things at once** — #e9e9ff behind it, #5050ea on
 * the glyph and label, and semibold instead of regular. One of them alone is
 * not a state anyone reads at a glance, and the plate is what carries it from
 * across the room.
 */
export function AdminSidebar() {
  const open = useAdminNav((s) => s.open);
  const setOpen = useAdminNav((s) => s.setOpen);
  const pathname = usePathname();

  const { sections, section } = resolveNav(pathname);

  // Grouped by band, in order, without assuming how many bands there are or
  // that they are numbered 1..n — lib/admin-nav.ts owns that, and check:nav
  // already holds each band to one unbroken run.
  const bands = sections.reduce<(typeof sections)[]>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last[0].group === item.group) last.push(item);
    else acc.push([item]);
    return acc;
  }, []);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        id="admin-nav"
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-shell shadow-lg transition-transform duration-200",
          // 260px, from the global design document, and it does not move. The
          // sidebar is the one column in the panel that is not fluid: it holds
          // ten labels whose longest is known, so a width that flexed would
          // only ever make it worse.
          "lg:sticky lg:top-0 lg:h-screen lg:w-[260px] lg:flex-shrink-0 lg:translate-x-0 lg:bg-transparent lg:shadow-none lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* The drawer names itself. On a desktop the mark is in the header
            instead, at the left, so this is hidden there. */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4 lg:hidden">
          <Link href="/admin" onClick={() => setOpen(false)}>
            <SynoraAppMark />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-control-ink transition-colors hover:bg-control"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* One container per band, 15px apart.
            
            Its own scroll, and only if it ever needs one. Nothing else in the
            panel scrolls except the main container — see app/admin/layout.tsx —
            so a sidebar that scrolled with the page would take the section you
            were trying to reach off the screen. At ten rows it never fires. */}
        <nav className="flex flex-col gap-[15px] overflow-y-auto p-2.5 lg:p-0">
          {bands.map((band) => (
            <div key={band[0].group} className="rounded-2xl bg-panel p-2.5 shadow-container">
              <ul>
                {band.map((item) => {
                  const here = item.key === section.key;
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={here ? "page" : undefined}
                        className={cn(
                          // 40.5px rows around 20px text, and a 20px glyph box.
                          // The box is the point rather than the drawing inside
                          // it: an icon wider than it is tall still occupies
                          // 20 x 20, which is what keeps the column aligned.
                          "flex h-[40.5px] items-center gap-2.5 rounded-lg px-2.5 text-[20px] transition-colors",
                          here
                            ? "bg-selected font-semibold text-brand-500"
                            : "text-control-ink hover:bg-control"
                        )}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
