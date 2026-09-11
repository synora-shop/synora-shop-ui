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
          "lg:sticky lg:top-0 lg:h-screen lg:w-[13rem] lg:flex-shrink-0 lg:translate-x-0 lg:bg-transparent lg:shadow-none lg:transition-none",
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

        {/* One container per band, and the rows live inside it.
            
            Each destination used to be its own outlined pill, ten of them, and
            at 40px tall for 13.5px of text every one was mostly air with a line
            drawn round it. The outline is the band's now: three containers, and
            a row inside one is just a row. */}
        <nav className="flex flex-col gap-5 overflow-y-auto px-2.5 py-2.5">
          {bands.map((band) => (
            <div
              key={band[0].group}
              className="rounded-2xl border border-border bg-panel p-2"
            >
              <ul className="flex flex-col gap-8">
                {band.map((item) => {
                  const active = item.key === section.key;
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[18px] transition-colors",
                          // The selected row is *recessed*, not filled: the
                          // page's own tone cut into the white container, with
                          // the colour carried by the text and the glyph. It is
                          // the same move as a field inside a card, and it
                          // leaves #6666ff meaning one thing on this screen.
                          //
                          // Hover borrows the plate and keeps its text black,
                          // so the plate reads as "this row" and the colour as
                          // "you are here" — two signals, not two shapes.
                          active
                            ? "bg-control font-medium text-brand-500"
                            : "text-control-ink hover:bg-control"
                        )}
                      >
                        <Icon className="h-5 w-5" />
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
