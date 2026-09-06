/**
 * How a long list is broken into pages.
 *
 * The rule the documentation sets is simple and worth stating plainly: the
 * merchant chooses how many rows a page holds, and choosing "all" makes the
 * pagination bar disappear entirely. A hundred orders shown twenty-five at a
 * time is four pages; shown all at once it is no pages, and no bar.
 *
 * Held in the URL rather than in client state, for the same reason the filters
 * are: a page of a list should survive a reload, a bookmark and a back button,
 * and a server component cannot read client state anyway.
 *
 * Client-safe: pure string and number handling, no Prisma, no next/headers.
 */

/** What a merchant can choose. `null` is "all", which turns paging off. */
export const PER_PAGE_OPTIONS: readonly (number | null)[] = [25, 50, 100, null];

export const DEFAULT_PER_PAGE = 25;

/** How "all" is spelled in the URL. */
export const ALL = "all";

export type SearchParams = Record<string, string | string[] | undefined>;

export type Paging = {
  /** 1-based, and never below 1. */
  page: number;
  /** Rows per page, or null for all of them. */
  perPage: number | null;
  /** Ready for Prisma. `take` is undefined when showing everything. */
  skip: number;
  take: number | undefined;
};

function first(searchParams: SearchParams, key: string): string | undefined {
  const raw = searchParams[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

/** The rows-per-page choice in the URL, or the default when it says nothing usable. */
export function readPerPage(searchParams: SearchParams): number | null {
  const raw = first(searchParams, "per");
  if (raw === ALL) return null;
  const n = Number(raw);
  // A hand-edited ?per=100000 is a way to ask the database for everything while
  // still drawing a pagination bar that promises otherwise. Only the offered
  // sizes are honoured.
  return PER_PAGE_OPTIONS.includes(n) ? n : DEFAULT_PER_PAGE;
}

/** How many pages a list of this length needs. Always at least 1. */
export function totalPages(total: number, perPage: number | null): number {
  if (perPage === null || perPage <= 0) return 1;
  return Math.max(1, Math.ceil(total / perPage));
}

/**
 * Where the list should start, given the URL and how many rows there are.
 *
 * `total` is passed in so that a page number past the end comes back as the
 * last real page rather than as an empty screen — which is what happens on its
 * own the moment a merchant on page 4 deletes enough rows to leave three.
 */
export function readPaging(searchParams: SearchParams, total: number): Paging {
  const perPage = readPerPage(searchParams);
  const pages = totalPages(total, perPage);
  const asked = Math.trunc(Number(first(searchParams, "page")));
  const page = Number.isFinite(asked) && asked >= 1 ? Math.min(asked, pages) : 1;
  if (perPage === null) return { page: 1, perPage: null, skip: 0, take: undefined };
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

/** Every query parameter the URL already carries, repeated values included. */
function params(searchParams: SearchParams): URLSearchParams {
  const qs = new URLSearchParams();
  for (const key of Object.keys(searchParams).sort()) {
    const raw = searchParams[key];
    if (raw === undefined) continue;
    for (const value of Array.isArray(raw) ? [...raw].sort() : [raw]) qs.append(key, value);
  }
  return qs;
}

function build(basePath: string, qs: URLSearchParams): string {
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** The href for another page of the same list, with every filter kept. */
export function pageHref(basePath: string, searchParams: SearchParams, page: number): string {
  const qs = params(searchParams);
  qs.delete("page");
  // Page 1 is the default, so it is spelled by leaving the parameter out. One
  // list, one URL — otherwise ?page=1 and no parameter are two addresses for
  // the same screen.
  if (page > 1) qs.set("page", String(page));
  return build(basePath, qs);
}

/** The href for a different page size. Always returns to the first page. */
export function perPageHref(
  basePath: string,
  searchParams: SearchParams,
  perPage: number | null
): string {
  const qs = params(searchParams);
  qs.delete("page");
  qs.delete("per");
  // Showing more rows moves everything, so staying on page 3 would land the
  // merchant somewhere they did not ask to be.
  if (perPage === null) qs.set("per", ALL);
  else if (perPage !== DEFAULT_PER_PAGE) qs.set("per", String(perPage));
  return build(basePath, qs);
}

/**
 * Which page numbers to draw.
 *
 * Every page while there are few, and a window around the current one once
 * there are many — 0 stands for a gap. A merchant with two hundred pages needs
 * to reach the next one and the last one; the other hundred and ninety-eight
 * buttons are noise.
 */
export function pageWindow(page: number, pages: number, span = 5): (number | 0)[] {
  if (pages <= span + 2) return Array.from({ length: pages }, (_, i) => i + 1);
  const half = Math.floor(span / 2);
  let start = Math.max(2, page - half);
  const end = Math.min(pages - 1, start + span - 1);
  start = Math.max(2, end - span + 1);
  const out: (number | 0)[] = [1];
  if (start > 2) out.push(0);
  for (let p = start; p <= end; p++) out.push(p);
  if (end < pages - 1) out.push(0);
  out.push(pages);
  return out;
}
