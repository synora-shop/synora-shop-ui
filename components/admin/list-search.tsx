"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";

/**
 * Search within one list.
 *
 * Not the same thing as the search in the top bar, which finds screens and
 * settings across the whole panel. This one narrows the rows in front of you,
 * and it does it by writing `q` into the address — so a filtered list can be
 * reloaded, bookmarked and shared, and the server does the filtering rather
 * than the browser hiding rows it has already been sent.
 *
 * Typing is debounced, because every keystroke is a round trip otherwise, and
 * always returns to page one: the third page of a search you have just changed
 * is not a place anybody meant to be.
 */
export function ListSearch({ placeholder = "Search" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("q") ?? "";
  const [value, setValue] = useState(fromUrl);
  const typed = useRef(false);

  // The URL can change without this field: a filter chip, the back button, a
  // link from somewhere else. When it does, the field follows — but only when
  // the merchant is not mid-word, or their typing would be overwritten by the
  // response to their own previous keystroke.
  useEffect(() => {
    if (!typed.current) setValue(fromUrl);
  }, [fromUrl]);

  useEffect(() => {
    if (!typed.current) return;
    const id = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set("q", value);
      else next.delete("q");
      next.delete("page");
      const query = next.toString();
      typed.current = false;
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-pill border border-control-line bg-control px-4 sm:max-w-sm">
      <Search className="h-4 w-4 flex-shrink-0 text-control-soft" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          typed.current = true;
          setValue(e.target.value);
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-control-soft [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            typed.current = true;
            setValue("");
          }}
          className="flex-shrink-0 rounded-full p-0.5 text-control-soft transition-colors hover:text-ink"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
