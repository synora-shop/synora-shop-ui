"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { money } from "@/components/loom/money";
import { cn } from "@/lib/utils";
import { LOOM_RULE, LoomButton, LoomSwipeRow } from "@/components/loom/primitives";
import { LoomChevronDown } from "@/components/loom/icons";
import { LoomProductCard } from "@/components/loom/product-card";
import { T } from "@/components/loom/type";
import { menu, on, str, type LoomContext } from "@/components/loom/contract";
import { tx } from "@/components/loom/text";
import { SORTS, offeredColours, offeredSizes, priceBands, type CatalogueItem, type PriceBand } from "@/components/loom/catalogue";

/** A shade light enough to vanish on white — it gets a hairline ring. */
const isPale = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 230;
};

/**
 * A collection: the products, filters that really filter, and a sort.
 * Not in the kit — designed from its parts, on its 322 module:
 *
 * Desktop, inside the 1320 column: the filters take one card's width, 322,
 * then the kit's 10px gutter, then three cards of 322.67 — so the sidebar is
 * visibly "one of the cards" and the grid lines up with the home page's.
 * Everything below the page's heading sits on the section rule, as every
 * section of the home page does.
 *
 * Phone: two columns of the phone's small card, and the filters move into a
 * full-screen sheet behind a Filter button beside the sort, so the products
 * start on the first screen instead of after three groups of controls.
 *
 * Every control is a kit part: the category menu is the Trending chips, colour
 * is the swatch from the colour chip (the whole chip is too big for a 322
 * column — 9 of them would stand one per line), size is the Trending chip,
 * sort is a chip-outlined pill with the kit's chevron.
 */
type Filters = { colours: string[]; sizes: string[]; price: number | null };
const NONE: Filters = { colours: [], sizes: [], price: null };



export function LoomCollection({ data, ctx }: { data: Record<string, unknown>; ctx: LoomContext }) {
  const categories = menu(data, "categoriesMenu", ctx);
  const activeCategory = str(data, "activeCategory").toLowerCase();
  const [filters, setFilters] = useState<Filters>(NONE);
  const [sort, setSort] = useState(0);
  const [sheet, setSheet] = useState(false);

  // The page's own prices, colours and sizes — an option that matches nothing is not offered.
  const bands = useMemo(() => priceBands(ctx.products, ctx.currency, money), [ctx.products, ctx.currency]);
  const shown = useMemo(() => apply(ctx.products, filters, bands).sort(SORTS[sort].by), [ctx.products, filters, sort, bands]);
  // Every matching product is on this one page; with real paging this is the
  // collection's full count and `shown` is the page.
  const total = shown.length;
  const active = filters.colours.length + filters.sizes.length + (filters.price === null ? 0 : 1);

  return (
    <section className="px-[calc(16*var(--u))] pb-[calc(40*var(--u))] md:px-[calc(60*var(--u))] md:pb-[calc(120*var(--u))]">
      {/* Heading — the hero's second band: a Heading 1 statement and Body 4 under it. */}
      <header className="flex flex-col gap-[calc(16*var(--u))] pb-[calc(24*var(--u))] md:flex-row md:items-end md:justify-between md:pb-[calc(32*var(--u))]">
        <h1 data-m="collection-title" className={cn(T.h3, "text-[#121212] md:text-[calc(65*var(--u))] md:leading-[calc(65*var(--u))] md:tracking-[calc(-4*var(--u))]")}>
          {ctx.collection?.title}
        </h1>
        {on(data, "showDescription") && ctx.collection?.description && (
          <p className={cn(T.body6, "text-[#121212]/80 md:w-[calc(411*var(--u))] md:text-[max(calc(18*var(--u)),14.4px)]")}>
            {ctx.collection.description}
          </p>
        )}
      </header>

      {/* The category menu — the Trending chips, as links. */}
      {categories.length > 0 && <LoomSwipeRow data-m="collection-categories" className="gap-[calc(8*var(--u))] pb-[calc(24*var(--u))] md:gap-[calc(10*var(--u))] md:pb-[calc(32*var(--u))]">
        {categories.map((c) => (
          <a
            key={c.id}
            href={c.href}
            aria-current={c.label.toLowerCase() === activeCategory ? "page" : undefined}
            className={cn(
              CHIP,
              c.label.toLowerCase() === activeCategory ? "bg-[#121212] text-white" : "border border-[#dddddd] text-[#121212]/80"
            )}
          >
            {c.label}
          </a>
        ))}
      </LoomSwipeRow>}

      <div className={cn("flex gap-[calc(10*var(--u))] pt-[calc(24*var(--u))] md:pt-[calc(32*var(--u))]", LOOM_RULE)}>
        {/* Desktop: the filters are a column the width of one card. */}
        {on(data, "showFilters") && (
          <aside aria-label={tx(ctx, "filters.heading")} className="hidden md:block md:w-[calc(322*var(--u))] md:shrink-0">
            <FilterGroups ctx={ctx} filters={filters} onChange={setFilters} />
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-[calc(16*var(--u))] md:gap-[calc(24*var(--u))]">
          {/* Toolbar. Desktop: the count, then Sort at the right. Phone: the count
              on its own line, then Filter and Sort sharing the next. */}
          <div className="flex flex-wrap items-center gap-[calc(8*var(--u))] md:min-h-[calc(50*var(--u))] md:gap-[calc(10*var(--u))]">
            <p data-m="collection-count" className={cn(T.body6, "w-full text-[#121212]/80 md:mr-auto md:w-auto md:text-[max(calc(18*var(--u)),14.4px)]")} aria-live="polite">
              {shown.length === 1 ? tx(ctx, "collections.countOne") : tx(ctx, "collections.count", { count: shown.length })}
            </p>
            <button
              type="button"
              onClick={() => setSheet(true)}
              aria-haspopup="dialog"
              className={cn(CHIP, "border border-[#dddddd] text-[#121212]/80 md:hidden", !on(data, "showFilters") && "hidden")}
            >
              {tx(ctx, "filters.filtersButton")}
              {active ? ` (${active})` : ""}
            </button>
            <label className="relative min-w-0 flex-1 md:flex-none">
              <span className="sr-only">{tx(ctx, "filters.sortBy")}</span>
              <select
                data-m="collection-sort"
                value={sort}
                onChange={(e) => setSort(Number(e.target.value))}
                className={cn(CHIP, "w-full cursor-pointer appearance-none justify-start border border-[#dddddd] bg-transparent pr-[calc(48*var(--u))] text-[#121212]/80")}
              >
                {SORTS.map((s, i) => (
                  <option key={s.key} value={i}>
                    {tx(ctx, s.key)}
                  </option>
                ))}
              </select>
              <LoomChevronDown className="pointer-events-none absolute right-[calc(16*var(--u))] top-1/2 h-[max(calc(24*var(--u)),19px)] w-[max(calc(24*var(--u)),19px)] -translate-y-1/2 text-[#121212]" />
            </label>
          </div>

          {shown.length ? (
            <div
              data-m="collection-grid"
              className="grid grid-cols-2 gap-x-[calc(8*var(--u))] gap-y-[calc(16*var(--u))] md:grid-cols-3 md:gap-x-[calc(10*var(--u))] md:gap-y-[calc(20*var(--u))]"
            >
              {shown.map((p) => (
                <LoomProductCard key={p.id} id={p.id} title={p.title} price={money(p.price, ctx.currency)} amount={p.price} w={322.67} src={p.src} href={p.href} loved={p.loved} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-[calc(24*var(--u))] py-[calc(40*var(--u))]">
              <p className={cn(T.h4, "text-[#121212]")}>{tx(ctx, "collections.emptyState")}</p>
              <LoomButton variant="outline" onClick={() => setFilters(NONE)}>
                {tx(ctx, "filters.clearFilters")}
              </LoomButton>
            </div>
          )}

          {/* "Show more" is the kit's outline button, offered only while there
              is more to show. The demo has one page, so here it is the count
              alone — a greyed button would offer something it cannot do. */}
          {shown.length > 0 && (
            <div className="flex flex-col items-center gap-[calc(16*var(--u))] pt-[calc(16*var(--u))] md:pt-[calc(24*var(--u))]">
              <p className={cn(T.body6, "text-[#121212]/80")}>
                {tx(ctx, "collections.showing", { shown: shown.length, total })}
              </p>
              {shown.length < total && (
                <LoomButton variant="outline" className="self-center">
                  {tx(ctx, "collections.showMore")}
                </LoomButton>
              )}
            </div>
          )}
        </div>
      </div>

      {sheet && (
        <FilterSheet
          ctx={ctx}
          filters={filters}
          onChange={setFilters}
          count={shown.length}
          onClose={() => setSheet(false)}
        />
      )}
    </section>
  );
}

/** The Trending chip, written for a link or a select rather than the button primitive. */
const CHIP =
  "flex h-[max(calc(50*var(--u)),40px)] shrink-0 items-center justify-center whitespace-nowrap rounded-[200px] px-[calc(19*var(--u))] text-[max(calc(14*var(--u)),11.2px)] font-medium uppercase leading-[max(calc(24*var(--u)),19.2px)] tracking-[calc(1*var(--u))]";

function apply(items: CatalogueItem[], f: Filters, bands: PriceBand[]) {
  return items.filter(
    (p) =>
      (f.colours.length === 0 || f.colours.some((c) => p.colours.includes(c))) &&
      (f.sizes.length === 0 || f.sizes.some((s) => (p.sizes as readonly string[]).includes(s))) &&
      (f.price === null || !bands[f.price] || bands[f.price].test(p.price))
  );
}

function toggle<T>(list: T[], v: T) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/**
 * The three groups, each on the section rule. Colour is the colour chip's
 * swatch alone, ringed in ink when chosen; size is the Trending chip; price is
 * a short list, one choice at a time.
 */
/** `clear` is off in the phone sheet, whose foot already has a Clear button. */
function FilterGroups({
  filters,
  onChange,
  clear = true,
  ctx,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  clear?: boolean;
  ctx: LoomContext;
}) {
  const any = clear && (filters.colours.length || filters.sizes.length || filters.price !== null);
  return (
    <div className="flex flex-col">
      <Group label={tx(ctx, "filters.colorLabel")} first>
        <div className="flex flex-wrap gap-[calc(12*var(--u))]">
          {offeredColours(ctx.products).map(({ name: c, hex }) => {
            const on = filters.colours.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                aria-label={c}
                title={c}
                onClick={() => onChange({ ...filters, colours: toggle(filters.colours, c) })}
                className={cn(
                  "flex h-[max(calc(41*var(--u)),36px)] w-[max(calc(41*var(--u)),36px)] items-center justify-center rounded-full",
                  on ? "shadow-[inset_0_0_0_1px_#121212]" : ""
                )}
              >
                <span
                  className="h-[max(calc(33*var(--u)),28px)] w-[max(calc(33*var(--u)),28px)] rounded-full"
                  style={{ backgroundColor: hex, boxShadow: isPale(hex) ? "inset 0 0 0 1px #dedede" : undefined }}
                />
              </button>
            );
          })}
        </div>
      </Group>

      <Group label={tx(ctx, "filters.sizeLabel")}>
        <div className="flex flex-wrap gap-[calc(8*var(--u))] md:gap-[calc(10*var(--u))]">
          {offeredSizes(ctx.products).map((s) => {
            const on = filters.sizes.includes(s);
            return (
              <LoomButton
                key={s}
                variant={on ? "solid" : "outlineLight"}
                aria-pressed={on}
                className="min-w-[calc(80*var(--u))]"
                onClick={() => onChange({ ...filters, sizes: toggle(filters.sizes, s) })}
              >
                {s}
              </LoomButton>
            );
          })}
        </div>
      </Group>

      {priceBands(ctx.products, ctx.currency, money).length > 0 && (
      <Group label={tx(ctx, "filters.priceLabel")}>
        <div className="flex flex-col" role="radiogroup" aria-label={tx(ctx, "filters.priceLabel")}>
          {priceBands(ctx.products, ctx.currency, money).map((b, i) => {
            const on = filters.price === i;
            return (
              <button
                key={b.label}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onChange({ ...filters, price: on ? null : i })}
                className={cn(T.body6, "flex items-center gap-[calc(12*var(--u))] py-[calc(6*var(--u))] text-left text-[#121212]/80 md:text-[max(calc(18*var(--u)),14.4px)]")}
              >
                <span className="flex h-[max(calc(20*var(--u)),18px)] w-[max(calc(20*var(--u)),18px)] shrink-0 items-center justify-center rounded-full border border-[#121212]">
                  {on && <span className="h-[50%] w-[50%] rounded-full bg-[#121212]" />}
                </span>
                {b.label}
              </button>
            );
          })}
        </div>
      </Group>
      )}

      {any ? (
        <button
          type="button"
          onClick={() => onChange(NONE)}
          className={cn(T.single2, "self-start pt-[calc(8*var(--u))] uppercase text-[#121212] underline underline-offset-4")}
        >
          {tx(ctx, "filters.clearAll")}
        </button>
      ) : null}
    </div>
  );
}

function Group({ label, first, children }: { label: string; first?: boolean; children: React.ReactNode }) {
  return (
    <fieldset className={cn("flex flex-col gap-[calc(16*var(--u))] pb-[calc(24*var(--u))]", !first && cn("pt-[calc(24*var(--u))]", LOOM_RULE))}>
      <legend className={cn(T.single2, "float-left w-full uppercase text-[#121212]/80")}>{label}</legend>
      {children}
    </fieldset>
  );
}

/**
 * The phone's filters: a full-screen sheet, because three groups of controls
 * do not fit beside a 343 grid and should not push it below the fold. The
 * header is the phone header's height; the foot holds the one action, which
 * says how many products the choice leaves so nobody filters down to nothing
 * without knowing.
 */
function FilterSheet({
  filters,
  onChange,
  count,
  onClose,
  ctx,
}: {
  ctx: LoomContext;
  filters: Filters;
  onChange: (f: Filters) => void;
  count: number;
  onClose: () => void;
}) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={tx(ctx, "filters.heading")} className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
      <div className="flex min-h-[calc(94*var(--u))] items-center justify-between px-[calc(16*var(--u))] pt-[calc(16*var(--u))]">
        <p className={cn(T.h4, "text-[#121212]")}>{tx(ctx, "filters.heading")}</p>
        <button
          ref={close}
          type="button"
          onClick={onClose}
          aria-label={tx(ctx, "filters.close")}
          className="flex h-[44px] w-[44px] items-center justify-center text-[28px] leading-none text-[#121212]"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-[calc(16*var(--u))]">
        <FilterGroups ctx={ctx} filters={filters} onChange={onChange} clear={false} />
      </div>
      <div className={cn("flex gap-[calc(10*var(--u))] px-[calc(16*var(--u))] py-[calc(16*var(--u))]", LOOM_RULE)}>
        <LoomButton variant="outline" className="min-w-0" onClick={() => onChange(NONE)}>
          {tx(ctx, "filters.clear")}
        </LoomButton>
        <LoomButton className="min-w-0 flex-1" onClick={onClose}>
          {count === 1 ? tx(ctx, "filters.showResultsOne") : tx(ctx, "filters.showResults", { count })}
        </LoomButton>
      </div>
    </div>
  );
}
