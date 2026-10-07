import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomSwipeRow } from "@/components/loom/primitives";
import { LoomSearchIcon } from "@/components/loom/icons";
import { LoomProductCard } from "@/components/loom/product-card";
import { fill, menu, on, str, type LoomContext } from "@/components/loom/contract";
import type { CatalogueItem } from "@/components/loom/catalogue";
import { T } from "@/components/loom/type";
import { LoomPageHeading, PAGE_SECTION } from "@/components/loom/sections/page-heading";

/**
 * Search results — not in the kit.
 *
 * The header's search pill, grown to the buttons' 50 and to the blog's 654,
 * holding what was typed so it can be changed in place. Under it, suggestions
 * from a menu the merchant chose, as Trending chips — a row to swipe on the
 * phone. Then what was found, on the section rule, four across on the 322
 * module, the kit's card.
 *
 * Nothing found is not a dead end: it says what was searched for, says what
 * to do, and puts the suggestions right there. Product recommendations
 * ("Trending now") follow in the template, so the page always has products.
 *
 * Matching is every word of the query against a product's name and colours,
 * so "red skateboard" finds the red high-top. Ported, it is the platform's
 * search; the page does not change.
 */
function matches(p: CatalogueItem, q: string) {
  const hay = `${p.title} ${p.colours.join(" ")} shoe shoes`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

const CHIP =
  "flex h-[max(calc(50*var(--u)),40px)] shrink-0 items-center whitespace-nowrap rounded-[200px] border border-[#dddddd] px-[calc(19*var(--u))] text-[max(calc(14*var(--u)),11.2px)] font-medium uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))] text-[#121212]/80";

export function LoomSearch({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const q = (ctx.query ?? "").trim();
  const found = q ? ctx.products.filter((p) => matches(p, q)) : [];
  const suggestions = on(data, "showSuggestions") ? menu(data, "suggestionsMenu", ctx) : [];

  const suggestionsRow =
    suggestions.length ? (
      <div className="flex flex-col gap-[calc(12*var(--u))]">
        <p className={cn(T.single2, "uppercase text-[#121212]/80")}>{str(data, "suggestionsHeading")}</p>
        <LoomSwipeRow className="gap-[calc(8*var(--u))] md:flex-wrap md:gap-[calc(10*var(--u))]">
          {suggestions.map((l) => (
            <a key={l.id} href={l.href} className={CHIP}>
              {l.label}
            </a>
          ))}
        </LoomSwipeRow>
      </div>
    ) : null;

  return (
    <section className={PAGE_SECTION}>
      <LoomPageHeading
        m="search-title"
        title={q ? fill(str(data, "resultsHeading"), { query: q }) : str(data, "heading")}
        aside={q && found.length ? <span data-m="search-count">{fill(str(data, "countLabel"), { count: found.length })}</span> : undefined}
      />

      <div className="flex flex-col gap-[calc(24*var(--u))] pb-[calc(32*var(--u))]">
        <form role="search" action="/loom/search" className="flex h-[max(calc(50*var(--u)),40px)] w-full items-center rounded-[2000px] border border-[#e3e3e3] px-[calc(20*var(--u))] focus-within:border-[#121212] md:w-[calc(654*var(--u))]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={str(data, "placeholder")}
            aria-label="Search"
            data-m="search-input"
            className={cn(T.body6, "w-full min-w-0 bg-transparent text-[#121212] outline-none placeholder:text-[#121212]/50")}
          />
          <button type="submit" aria-label="Search" className="shrink-0">
            <LoomSearchIcon className="h-[max(calc(20*var(--u)),16px)] w-[max(calc(20*var(--u)),16px)] text-[#2e3a59] opacity-50" />
          </button>
        </form>
        {!q && suggestionsRow}
      </div>

      {q && (
        <div className={cn("pt-[calc(24*var(--u))] md:pt-[calc(32*var(--u))]", LOOM_RULE)}>
          {found.length ? (
            <div
              data-m="search-grid"
              className="grid grid-cols-2 gap-x-[calc(8*var(--u))] gap-y-[calc(16*var(--u))] md:grid-cols-4 md:gap-x-[calc(10*var(--u))] md:gap-y-[calc(20*var(--u))]"
            >
              {found.map((p) => (
                <LoomProductCard key={p.id} id={p.id} title={p.title} price={`$${p.price}`} w={322.5} src={p.src} href={p.href} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-[calc(24*var(--u))] py-[calc(16*var(--u))]">
              <div className="flex flex-col gap-[calc(8*var(--u))]">
                <p data-m="search-empty" className={cn(T.h4, "text-[#121212]")}>
                  {fill(str(data, "emptyHeading"), { query: q })}
                </p>
                <p className={cn(T.body6, "text-[#121212]/80")}>{str(data, "emptyText")}</p>
              </div>
              {suggestionsRow}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
