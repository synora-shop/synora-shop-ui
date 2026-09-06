"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useAdminNav } from "@/lib/admin-nav-store";
import { type BusinessType, resolveNav } from "@/lib/admin-nav";
import { SynoraAppMark } from "@/components/ui/synora-app-mark";
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
export function AdminSidebar({ businessType = "ECOMMERCE" }: { businessType?: BusinessType }) {
  const open = useAdminNav((s) => s.open);
  const setOpen = useAdminNav((s) => s.setOpen);
  const pathname = usePathname();

  const { sections, section } = resolveNav(pathname, businessType);

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
          "lg:sticky lg:top-0 lg:h-screen lg:w-[15rem] lg:flex-shrink-0 lg:translate-x-0 lg:bg-transparent lg:shadow-none lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* The drawer names itself. On a desktop the mark is in the top bar
            instead, dead centre, so this header is hidden there. */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4 lg:hidden">
          <Link href="/admin" onClick={() => setOpen(false)}>
            <SynoraAppMark color="var(--color-brand-500)" tone="onLight" />
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

        <nav className="flex flex-col gap-2 px-3 py-3 lg:py-4">
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
                  "flex items-center gap-3 rounded-pill px-5 text-[15px] transition-colors",
                  // 48px, not the drawing's 70px. The proportion is the
                  // drawing's; the absolute size is not, because APP.ai is
                  // drawn at 1920×1080 and a merchant's laptop is not that tall.
                  "h-12",
                  active
                    ? "bg-brand-500 font-medium text-white"
                    : "border border-control-line bg-panel text-control-ink hover:bg-control"
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
