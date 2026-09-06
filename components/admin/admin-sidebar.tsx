"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAdminNav } from "@/lib/admin-nav-store";
import { resolveNav } from "@/lib/admin-nav";
import { SynoraAppMark } from "@/components/ui/synora-marks";
import { cn } from "@/lib/utils";

/**
 * Six destinations, flat, in a fixed order.
 *
 * The sidebar used to be seven collapsible groups holding twenty-odd links, and
 * it was the panel's worst screen: finding Orders meant guessing which group
 * owned it, opening that group, and reading past its siblings — three decisions
 * for one destination. Everything below the first level now lives in the
 * navigation bar at the top of the page instead, so this list never changes
 * shape, never scrolls, and can be learned once.
 *
 * The pills float on the page rather than sitting in a panel of their own. That
 * is APP.ai's arrangement and it is doing real work: with no container edge, the
 * only lit thing on the left is the page you are on.
 */
export function AdminSidebar() {
  const open = useAdminNav((s) => s.open);
  const setOpen = useAdminNav((s) => s.setOpen);
  const pathname = usePathname();

  const { sections, section } = resolveNav(pathname);

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

        <nav className="flex flex-col gap-1 px-2.5 py-2.5">
          {sections.map((item) => {
            const active = item.key === section.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-pill px-3.5 text-[13.5px] transition-colors",
                  // 40px. APP.ai draws these at 70px on a 1920x1080 artboard,
                  // which is a sixth of the height of a laptop screen for six
                  // links that never change. The proportion is the drawing's;
                  // the absolute size is not.
                  "h-10",
                  active
                    ? "bg-brand-500 font-medium text-white"
                    : "border border-control-line bg-panel text-control-ink hover:bg-control"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
