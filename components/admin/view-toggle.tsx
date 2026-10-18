import Link from "next/link";
import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchParams } from "@/lib/sorting";

export type ViewKind = "list" | "grid";

/**
 * Rows or tiles.
 *
 * Which one is better depends entirely on what the list holds, which is why the
 * merchant picks rather than the designer. A catalogue of clothing is a wall of
 * pictures; a catalogue of spare parts is a table of names and numbers, and
 * tiles there are a screen of grey rectangles.
 *
 * Server-rendered links, like the sort and the filters, so the choice is in the
 * address and comes back with the page.
 */
export function ViewToggle({
  basePath,
  searchParams,
  current,
  fallback = "list",
}: {
  basePath: string;
  searchParams: SearchParams;
  current: ViewKind;
  /** Which view this list starts in, so that one needs no query parameter. */
  fallback?: ViewKind;
}) {
  function href(view: ViewKind): string {
    const qs = new URLSearchParams();
    for (const key of Object.keys(searchParams).sort()) {
      if (key === "view") continue;
      const raw = searchParams[key];
      if (raw === undefined) continue;
      for (const v of Array.isArray(raw) ? [...raw].sort() : [raw]) qs.append(key, v);
    }
    // The list's own default is spelled by leaving the parameter out — one
    // screen, one URL.
    if (view !== fallback) qs.set("view", view);
    const query = qs.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <div className="flex h-9 flex-shrink-0 items-center gap-0.5 rounded-[10px] bg-white px-1 ring-1 ring-inset ring-[#0a0a0a]/[0.09]">
      {([
        ["list", Rows3, "List view"],
        ["grid", LayoutGrid, "Grid view"],
      ] as const).map(([kind, Icon, label]) => (
        <Link
          key={kind}
          href={href(kind)}
          aria-label={label}
          title={label}
          aria-current={current === kind ? "true" : undefined}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-[7px] transition-colors",
            current === kind
              ? "bg-[#ecebff] text-[#4b4bea] ring-1 ring-inset ring-[#6666ff]/25"
              : "text-[#0a0a0a]/55 hover:text-[#0a0a0a]"
          )}
        >
          <Icon className="h-[var(--icon-box)] w-[var(--icon-box)]" />
        </Link>
      ))}
    </div>
  );
}

/**
 * The view in the URL.
 *
 * The fallback is per-list, not global: a list of orders is rows and a library
 * of pictures is tiles, and neither is the right starting point for the other.
 * Whichever a list defaults to is spelled by leaving the parameter out.
 */
export function readView(searchParams: SearchParams, fallback: ViewKind = "list"): ViewKind {
  const raw = searchParams.view;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  if (asked === "grid") return "grid";
  if (asked === "list") return "list";
  return fallback;
}
