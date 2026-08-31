"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterOptions = {
  sizes: string[];
  colors: { name: string; hex: string | null }[];
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

type Labels = {
  searchPlaceholder?: string;
  filtersButton?: string;
  sizeLabel?: string;
  colorLabel?: string;
  clearAll?: string;
};

export function ProductFilters({
  options,
  labels = {},
}: {
  options: FilterOptions;
  labels?: Labels;
}) {
  const {
    searchPlaceholder = "Search products…",
    filtersButton = "Filters",
    sizeLabel = "Size",
    colorLabel = "Color",
    clearAll = "Clear all",
  } = labels;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  /**
   * Adds a value if it is not applied, removes it if it is.
   *
   * Size and colour used to hold one value each, so picking a second size threw
   * the first away — there was no way to look at everything in S *and* M, and
   * no way to drop one of two choices without clearing the lot.
   */
  function toggleParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll(key);
    params.delete(key);
    for (const v of current.includes(value) ? current.filter((v2) => v2 !== value) : [...current, value]) {
      params.append(key, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const activeSizes = searchParams.getAll("size");
  const activeColors = searchParams.getAll("color");
  const activeSort = searchParams.get("sort") ?? "newest";
  const activeQuery = searchParams.get("q") ?? "";

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("q") as HTMLInputElement;
            updateParam("q", input.value || null);
          }}
          className="flex-1 min-w-[200px]"
        >
          <input
            name="q"
            type="search"
            defaultValue={activeQuery}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
        </form>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
            open ? "border-brand-500 bg-brand-500 text-white" : "border-border bg-white hover:border-brand-300 hover:bg-subtle active:bg-subtle"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" /> {filtersButton}
        </button>

        <select
          value={activeSort}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="rounded-full border border-border bg-white px-4 py-2 text-sm transition-colors hover:border-brand-300"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {(activeSizes.length > 0 || activeColors.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeSizes.map((size) => (
            <button
              type="button"
              key={`size-${size}`}
              onClick={() => toggleParam("size", size)}
              aria-label={`Remove ${sizeLabel} ${size}`}
              className="flex items-center gap-1 rounded-full border border-brand-500 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 transition-colors hover:bg-brand-100 active:bg-brand-100"
            >
              {size}
              <X className="h-3 w-3" />
            </button>
          ))}
          {activeColors.map((color) => (
            <button
              type="button"
              key={`color-${color}`}
              onClick={() => toggleParam("color", color)}
              aria-label={`Remove ${colorLabel} ${color}`}
              className="flex items-center gap-1 rounded-full border border-brand-500 bg-brand-50 px-2.5 py-1 text-xs text-brand-700 transition-colors hover:bg-brand-100 active:bg-brand-100"
            >
              <span
                className="h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: options.colors.find((c) => c.name === color)?.hex ?? "#ccc" }}
              />
              {color}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="mt-4 flex flex-wrap gap-6 rounded-lg border border-border bg-white p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {sizeLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.sizes.map((size) => (
                <button
          type="button"
                  key={size}
                  onClick={() => toggleParam("size", size)}
                  aria-pressed={activeSizes.includes(size)}
                  className={cn(
                    "rounded border border-border px-3 py-1 text-sm transition-colors",
                    activeSizes.includes(size)
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "hover:border-brand-300 hover:bg-subtle active:bg-subtle"
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {colorLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {options.colors.map((color) => (
                <button
          type="button"
                  key={color.name}
                  onClick={() => toggleParam("color", color.name)}
                  title={color.name}
                  aria-pressed={activeColors.includes(color.name)}
                  className={cn(
                    "no-tap-scale h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 active:scale-95",
                    activeColors.includes(color.name)
                      ? "border-brand-500 ring-2 ring-brand-300"
                      : "border-border hover:border-brand-300 active:border-brand-500"
                  )}
                  style={{ backgroundColor: color.hex ?? "#ccc" }}
                />
              ))}
            </div>
          </div>

          {(activeSizes.length > 0 || activeColors.length > 0 || activeQuery) && (
            <button
          type="button"
              onClick={() => router.push(pathname)}
              className="flex items-center gap-1 self-end rounded text-sm text-brand-600 transition-colors hover:text-brand-700 active:text-brand-700"
            >
              <X className="h-4 w-4" /> {clearAll}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
