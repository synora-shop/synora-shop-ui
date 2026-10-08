"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { fill, on, route, str, type KiteContext } from "@/components/kite/contract";
import { kt } from "@/components/kite/type";
import { kiteMoney } from "@/components/kite/money";
import { ktx } from "@/components/kite/text";
import { KitePieceCard } from "@/components/kite/piece-card";
import { KITE_RULE, KITE_RULE_TOP, KiteButton, KiteHeading, KitePage, KiteTextLink, KiteTitle } from "@/components/kite/ui";
import { SORTS, offeredColours, offeredSizes, priceBands, type CatalogueItem } from "@/components/loom/catalogue";

/**
 * A collection, and the search page — not in the file; Kite's own parts
 * (decided 8 October).
 *
 * The name in the account's serif, the count at the right; under it on a
 * half-ink rule, FILTER and the sort as the file's underlined capitals; then
 * the pieces as the home page draws them (KitePieceCard), four across 32
 * apart on the desktop, one to a row on the phone, each photograph 4:5.
 *
 * Filters open in place under the bar: colour, size and price, each choice
 * a word in capitals, underlined when chosen. Every option is one the page's
 * pieces actually have; a colour picked on the way in (a colour chip's
 * `?color=`) starts chosen.
 */
type Filters = { colours: string[]; sizes: string[]; price: number | null };
const NONE: Filters = { colours: [], sizes: [], price: null };
const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Grid({ items, ctx, addLabel }: { items: CatalogueItem[]; ctx: KiteContext; addLabel: string }) {
  return (
    <div data-k="grid" className="grid grid-cols-1 gap-[calc(48*var(--u))] md:grid-cols-4 md:gap-x-[calc(32*var(--u))] md:gap-y-[calc(64*var(--u))]">
      {items.map((p) => (
        <KitePieceCard key={p.id} product={{ ...p, blurb: undefined, priceText: kiteMoney(p.price, ctx.currency) }} photoHeight={510} addLabel={addLabel} className="md:[&>a:first-child]:!h-[calc(490*var(--u))]" />
      ))}
    </div>
  );
}

export function KiteCollection({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => ({ ...NONE, colours: params.getAll("color") }));
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState(0);
  const bands = useMemo(() => priceBands(ctx.products, ctx.currency, kiteMoney), [ctx.products, ctx.currency]);
  const colours = offeredColours(ctx.products).map((c) => c.name);
  const sizes = offeredSizes(ctx.products);
  const shown = useMemo(
    () =>
      ctx.products
        .filter(
          (p) =>
            (filters.colours.length === 0 || filters.colours.some((c) => p.colours.includes(c))) &&
            (filters.sizes.length === 0 || filters.sizes.some((s) => (p.sizes as readonly string[]).includes(s))) &&
            (filters.price === null || !bands[filters.price] || bands[filters.price].test(p.price))
        )
        .sort(SORTS[sort].by),
    [ctx.products, filters, sort, bands]
  );
  const active = filters.colours.length + filters.sizes.length + (filters.price === null ? 0 : 1);
  const t = kt("sans", 14, 16);

  return (
    <KitePage k="collection">
      <header className="flex flex-col gap-[calc(16*var(--u))] pb-[calc(32*var(--u))] md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-[calc(8*var(--u))]">
          <KiteTitle>{ctx.collection?.title ?? ""}</KiteTitle>
          {on(data, "showDescription") && ctx.collection?.description ? (
            <p {...kt("sans", 14, 20)} className={cn(kt("sans", 14, 20).className, "md:w-[calc(585*var(--u))]")}>{ctx.collection.description}</p>
          ) : null}
        </div>
        <p {...t} className={cn(t.className, "uppercase opacity-80")} aria-live="polite">
          {shown.length === 1 ? ktx(ctx, "collections.countOne") : ktx(ctx, "collections.count", { count: shown.length })}
        </p>
      </header>

      <div className={cn("flex items-center justify-between py-[calc(16*var(--u))]", KITE_RULE_TOP, KITE_RULE)}>
        {on(data, "showFilters") ? (
          <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} {...t} className={cn(t.className, "uppercase underline underline-offset-4")}>
            {ktx(ctx, "filters.filtersButton")}
            {active ? ` (${active})` : ""}
          </button>
        ) : (
          <span />
        )}
        <label className="flex items-center gap-[calc(8*var(--u))]">
          <span {...t} className={cn(t.className, "uppercase opacity-50")}>{ktx(ctx, "filters.sortBy")}</span>
          <select value={sort} onChange={(e) => setSort(Number(e.target.value))} style={t.style} className={cn(t.className, "cursor-pointer appearance-none bg-transparent uppercase underline underline-offset-4 outline-none [&>option]:bg-[#040404]")}>
            {SORTS.map((s, i) => (
              <option key={s.key} value={i}>
                {ktx(ctx, s.key)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {open ? (
        <div className={cn("grid grid-cols-1 gap-[calc(24*var(--u))] py-[calc(24*var(--u))] md:grid-cols-4 md:gap-[calc(32*var(--u))]", KITE_RULE)}>
          {[
            { label: ktx(ctx, "filters.colorLabel"), options: colours, isOn: (o: string) => filters.colours.includes(o), flip: (o: string) => setFilters({ ...filters, colours: toggle(filters.colours, o) }) },
            { label: ktx(ctx, "filters.sizeLabel"), options: sizes, isOn: (o: string) => filters.sizes.includes(o), flip: (o: string) => setFilters({ ...filters, sizes: toggle(filters.sizes, o) }) },
            { label: ktx(ctx, "filters.priceLabel"), options: bands.map((b) => b.label), isOn: (o: string) => filters.price !== null && bands[filters.price]?.label === o, flip: (o: string) => { const i = bands.findIndex((b) => b.label === o); setFilters({ ...filters, price: filters.price === i ? null : i }); } },
          ]
            .filter((g) => g.options.length > 0)
            .map((g) => (
              <fieldset key={g.label} className="flex flex-col gap-[calc(12*var(--u))]">
                <KiteHeading as="legend" className="pb-[calc(8*var(--u))]">{g.label}</KiteHeading>
                <div className="flex flex-wrap gap-x-[calc(24*var(--u))] gap-y-[calc(8*var(--u))]">
                  {g.options.map((o) => (
                    <button key={o} type="button" aria-pressed={g.isOn(o)} onClick={() => g.flip(o)} {...t} className={cn(t.className, "uppercase", g.isOn(o) ? "underline underline-offset-4" : "opacity-50 hover:opacity-100")}>
                      {o}
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          {active ? (
            <div className="flex items-end md:justify-end">
              <KiteTextLink onClick={() => setFilters(NONE)}>{ktx(ctx, "filters.clearAll")}</KiteTextLink>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="pt-[calc(32*var(--u))]">
        {shown.length ? (
          <Grid items={shown} ctx={ctx} addLabel={str(data, "addLabel")} />
        ) : (
          <div className="flex flex-col items-start gap-[calc(24*var(--u))] py-[calc(32*var(--u))]">
            <KiteHeading as="p">{ktx(ctx, "collections.emptyState")}</KiteHeading>
            <KiteButton variant="outline" onClick={() => setFilters(NONE)}>
              {ktx(ctx, "filters.clearFilters")}
            </KiteButton>
          </div>
        )}
      </div>
    </KitePage>
  );
}

/** Search: the field, holding what was typed, and what it found, as the collection shows pieces. */
export function KiteSearch({ data, ctx }: { data: Record<string, unknown>; ctx: KiteContext }) {
  const q = (ctx.query ?? "").trim();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const found = q ? ctx.products.filter((p) => words.every((w) => `${p.title} ${p.colours.join(" ")}`.toLowerCase().includes(w))) : [];
  const t = kt("sans", 14, 16);
  const v = kt("sans", 16, 20);
  return (
    <KitePage k="search">
      <header className="flex flex-col gap-[calc(16*var(--u))] pb-[calc(32*var(--u))] md:flex-row md:items-end md:justify-between">
        <KiteTitle>{q ? fill(str(data, "resultsHeading"), { query: q }) : str(data, "heading")}</KiteTitle>
        {q && found.length ? (
          <p {...t} className={cn(t.className, "uppercase opacity-80")}>{fill(str(data, "countLabel"), { count: found.length })}</p>
        ) : null}
      </header>
      <form role="search" action={route(ctx, "search")} className="flex items-end gap-[calc(16*var(--u))] pb-[calc(32*var(--u))] md:w-[calc(800*var(--u))]">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={str(data, "placeholder")}
          aria-label={str(data, "heading")}
          style={v.style}
          className={cn(v.className, "min-w-0 flex-1 rounded-none bg-transparent pb-[calc(12*var(--u))] shadow-[inset_0_-1px_0_#f4f3f1] outline-none placeholder:text-[#f4f3f1]/40")}
        />
        <KiteButton type="submit" variant="outline">{str(data, "heading")}</KiteButton>
      </form>
      {q ? (
        found.length ? (
          <div className={cn("pt-[calc(32*var(--u))]", KITE_RULE_TOP)}>
            <Grid items={found} ctx={ctx} addLabel={str(data, "addLabel")} />
          </div>
        ) : (
          <div className={cn("flex flex-col items-start gap-[calc(16*var(--u))] pt-[calc(32*var(--u))]", KITE_RULE_TOP)}>
            <KiteHeading as="p">{fill(str(data, "emptyHeading"), { query: q })}</KiteHeading>
            <p {...v}>{str(data, "emptyText")}</p>
            <KiteButton variant="outline" href={route(ctx, "collection")} className="mt-[calc(8*var(--u))]">
              {ktx(ctx, "cart.continueShopping")}
            </KiteButton>
          </div>
        )
      ) : null}
    </KitePage>
  );
}
