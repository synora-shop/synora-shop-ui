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
 * The bands are not that mistake returning. Nothing here collapses, nothing is
 * hidden, and no click is added — every destination is on screen at all times.
 * A band groups the runs that answer different questions: running the shop, how
 * the shop looks, and the account underneath it.
 *
 * Each band is one container rather than a run of separate ones. Every
 * destination used to be its own outlined pill — ten of them, each 40px tall
 * around 13.5px of text, so every row was mostly air with a line drawn round
 * it, and the ten lines competed with the one that mattered. The outline
 * belongs to the band now and a row inside it is just a row.
 *
 * No headings and no rules. A heading would add three lines of text to a list
 * whose whole virtue is that it can be taken in at a glance, and it would need
 * three names that are hard to get right and worse than silence when wrong.
 * Grouping is in lib/admin-nav.ts; this file only draws what it is given, so
 * the order and the bands cannot disagree.
 *
 * The selected row is recessed rather than filled: #f5f5f5 cut into the white
 * container, with #6666ff carried by the glyph and the label. It is the same
 * move as a field inside a card — the page's own tone, pressed in — and it
 * means the one saturated thing on the left is a colour, not a slab.
 */
export function AdminSidebar() {
  const open = useAdminNav((s) => s.open);
  const setOpen = useAdminNav((s) => s.setOpen);
  const pathname = usePathname();

  const { sections, section, children, current } = resolveNav(pathname);

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
          "lg:sticky lg:top-0 lg:h-screen lg:w-[13.75rem] lg:flex-shrink-0 lg:translate-x-0 lg:bg-transparent lg:shadow-none lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* The drawer names itself. On a desktop the mark is in the top bar
            instead, dead centre, so this header is hidden there. */}
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

        {/* One container per band, and a band's rows are its sections.
            
            A section that has more than one screen drops its list underneath
            itself while you are standing in it — which is where the navigation
            bar used to put them, across the top of the page. */}
        <nav className="flex flex-col gap-2 overflow-y-auto px-2.5 py-2.5">
          {bands.map((band) => (
            <div key={band[0].group} className="rounded-2xl border border-border bg-panel p-2.5">
              <ul>
                {band.map((item) => {
                  const here = item.key === section.key;
                  const Icon = item.icon;
                  // The screen you are on is the deepest thing that matches, so
                  // it is a child when one of them is it and the section itself
                  // otherwise — including when the child naming the section was
                  // dropped as a repeat. Exactly one aria-current per sidebar,
                  // which is what a screen reader is counting.
                  const childIndex = here ? children.findIndex((c) => c.href === current) : -1;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={here && childIndex === -1 ? "page" : undefined}
                        className={cn(
                          "flex h-[30px] items-center gap-2 rounded-lg px-2.5 text-[18px] transition-colors",
                          here
                            ? "bg-control font-medium text-brand-500"
                            : "text-control-ink hover:bg-control"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="truncate">{item.label}</span>
                      </Link>

                      {here && children.length > 0 && (
                        <div className="relative">
                          {/* One line, drawn only to the screen you are on.
                              
                              It leaves the middle of the section's own glyph and
                              turns into the label beneath it, so the arrow says
                              which of the list you are looking at. The others
                              carry nothing: a line beside every child would draw
                              the shape of the list six times over to say one
                              thing about one row. */}
                          {childIndex >= 0 && <Elbow rows={childIndex} />}
                          <ul>
                            {children.map((tab, i) => (
                              <li key={tab.href}>
                                <Link
                                  href={tab.href}
                                  onClick={() => setOpen(false)}
                                  aria-current={i === childIndex ? "page" : undefined}
                                  className={cn(
                                    // Left padding, not an indent on the text:
                                    // the label lines up under the section's own
                                    // label, and the glyph column is where the
                                    // line lives.
                                    "flex h-[30px] items-center rounded-lg pl-[38px] pr-2.5 text-[16px] transition-colors",
                                    i === childIndex
                                      ? "font-medium text-brand-500"
                                      : "text-control-ink hover:bg-control"
                                  )}
                                >
                                  <span className="truncate">{tab.label}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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

/**
 * The line from a section to the one screen of its you are on.
 *
 * `rows` is how many children sit above it, and a row is 30px, so the turn
 * happens at the middle of that row. Drawn rather than built from borders
 * because a border cannot be given an arrowhead, and the arrow is the half that
 * says *which* — a plain corner would only say "these belong to that".
 *
 * Left 20px puts the stroke through the centre of the glyph column: the
 * container pads 10, the row pads another 10, and the glyph is 20 wide.
 */
function Elbow({ rows }: { rows: number }) {
  const y = rows * 30 + 15;
  return (
    <svg
      aria-hidden="true"
      width={24}
      height={y + 6}
      viewBox={`0 0 24 ${y + 6}`}
      fill="none"
      className="pointer-events-none absolute left-[20px] top-0 text-brand-500"
    >
      <path
        d={`M1 0 V ${y - 6} a 6 6 0 0 0 6 6 H 19`}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={`M15 ${y - 4} L 19 ${y} L 15 ${y + 4}`}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
