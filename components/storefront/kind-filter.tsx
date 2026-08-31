"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Package, Ruler, ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "", label: "Everything", icon: Store },
  { key: "NORMAL", label: "Buy now", icon: ShoppingBag },
  { key: "BULK", label: "Bulk orders", icon: Package },
  { key: "CUSTOM", label: "Made to order", icon: Ruler },
] as const;

/**
 * Browse by how a product is sold.
 *
 * Worth its own control rather than a line in the filter drawer, because it is
 * the one distinction that changes what the customer can *do* — a wholesale
 * buyer and a retail shopper want disjoint halves of the catalog, and neither
 * should have to wade through the other's.
 *
 * Links rather than buttons: each tab is a real, shareable URL, and it keeps
 * every other active filter intact instead of resetting the page.
 */
export function KindFilter({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("kind") ?? "";

  function hrefFor(kind: string) {
    const next = new URLSearchParams(params.toString());
    if (kind) next.set("kind", kind);
    else next.delete("kind");
    // Size and colour only exist on standard products; carrying them into a
    // bulk view would filter everything out and look like an empty catalog.
    if (kind === "BULK" || kind === "CUSTOM") {
      next.delete("size");
      next.delete("color");
    }
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  // A tab that would show nothing is not offered — an empty "Bulk orders" tab
  // teaches the customer the shop is broken, not that it has no bulk lines.
  const visible = TABS.filter((t) => t.key === "" || (counts[t.key] ?? 0) > 0);
  if (visible.length <= 2) return null;

  return (
    <nav aria-label="Filter by how products are sold" className="flex flex-wrap gap-1.5">
      {visible.map((tab) => {
        const active = current === tab.key;
        const n = tab.key === "" ? Object.values(counts).reduce((a, b) => a + b, 0) : counts[tab.key];
        return (
          <Link
            key={tab.key || "all"}
            href={hrefFor(tab.key)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-border text-ink-soft hover:bg-subtle hover:text-ink"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <span className={cn("font-mono tabular-nums", active ? "opacity-80" : "text-ink-faint")}>
              {n}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
