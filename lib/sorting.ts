/**
 * How a list is ordered, and how a merchant changes it.
 *
 * The documentation asks for sorting in the action bar beside the filters, and
 * the two work the same way for the same reason: the choice lives in the URL,
 * so an ordering survives a reload, a bookmark and the back button, and the
 * server does the ordering rather than the browser re-arranging rows it has
 * already been sent. That matters more here than it looks — with paging on,
 * sorting in the browser would only ever reorder the twenty-five rows on
 * screen, which is not sorting at all.
 *
 * Each list declares its own options because "newest" means `createdAt` on a
 * product and `total` on an order, and because offering a merchant a sort by a
 * column their list does not show is a control that appears to do nothing.
 *
 * Client-safe: plain data and pure string handling, no Prisma, no next/headers.
 */

/** One entry in a list's sort menu. `orderBy` goes straight to Prisma. */
export type SortOption = {
  /** How it is spelled in the URL. */
  value: string;
  label: string;
  orderBy: Record<string, unknown> | Record<string, unknown>[];
};

export type SearchParams = Record<string, string | string[] | undefined>;

function first(searchParams: SearchParams, key: string): string | undefined {
  const raw = searchParams[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * The chosen option, or the list's default.
 *
 * The default is the first option, always — so a list's natural order is
 * whatever it chooses to put at the top of its own menu, and the two can never
 * disagree.
 */
export function readSort(searchParams: SearchParams, options: readonly SortOption[]): SortOption {
  const asked = first(searchParams, "sort");
  return options.find((o) => o.value === asked) ?? options[0];
}

/** The href for a different ordering. Returns to the first page. */
export function sortHref(
  basePath: string,
  searchParams: SearchParams,
  value: string,
  // Only the first option is read, to know which value is the default. Typed
  // to that so the customer list — whose options carry a comparator instead of
  // a Prisma clause — can use this without a cast.
  options: readonly { value: string }[]
): string {
  const qs = new URLSearchParams();
  for (const key of Object.keys(searchParams).sort()) {
    if (key === "sort" || key === "page") continue;
    const raw = searchParams[key];
    if (raw === undefined) continue;
    for (const v of Array.isArray(raw) ? [...raw].sort() : [raw]) qs.append(key, v);
  }
  // Re-ordering moves every row, so page 3 of the old order is not a place
  // anybody meant to be — the same reasoning as changing the page size.
  if (value !== options[0].value) qs.set("sort", value);
  const query = qs.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/* -------------------------------------------------------------------------- */
/* The lists                                                                  */
/* -------------------------------------------------------------------------- */

export const PRODUCT_SORTS: readonly SortOption[] = [
  { value: "newest", label: "Newest first", orderBy: { createdAt: "desc" } },
  { value: "oldest", label: "Oldest first", orderBy: { createdAt: "asc" } },
  { value: "title", label: "Name A–Z", orderBy: { title: "asc" } },
  { value: "title-desc", label: "Name Z–A", orderBy: { title: "desc" } },
  { value: "price", label: "Price, low to high", orderBy: { basePrice: "asc" } },
  { value: "price-desc", label: "Price, high to low", orderBy: { basePrice: "desc" } },
];

export const ORDER_SORTS: readonly SortOption[] = [
  { value: "newest", label: "Newest first", orderBy: { createdAt: "desc" } },
  { value: "oldest", label: "Oldest first", orderBy: { createdAt: "asc" } },
  { value: "total-desc", label: "Largest first", orderBy: { total: "desc" } },
  { value: "total", label: "Smallest first", orderBy: { total: "asc" } },
];

export const ENQUIRY_SORTS: readonly SortOption[] = [
  { value: "newest", label: "Newest first", orderBy: { createdAt: "desc" } },
  { value: "oldest", label: "Oldest first", orderBy: { createdAt: "asc" } },
  { value: "name", label: "Name A–Z", orderBy: { name: "asc" } },
];

export const MEDIA_SORTS: readonly SortOption[] = [
  { value: "newest", label: "Newest first", orderBy: { createdAt: "desc" } },
  { value: "oldest", label: "Oldest first", orderBy: { createdAt: "asc" } },
  { value: "name", label: "Name A–Z", orderBy: { filename: "asc" } },
  { value: "largest", label: "Largest first", orderBy: { size: "desc" } },
];

/**
 * Customers are sorted in memory, not by the database.
 *
 * Lifetime spend is the sum of a customer's orders — a number no column holds —
 * so the rows have to be read and totalled before they can be ordered. These
 * carry a comparator rather than a Prisma clause; see lib/data/customers.ts.
 */
export type CustomerSummaryish = {
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
  createdAt: Date;
};

export const CUSTOMER_SORTS: readonly { value: string; label: string }[] = [
  { value: "spend", label: "Highest spend" },
  { value: "orders", label: "Most orders" },
  { value: "recent", label: "Ordered most recently" },
  { value: "name", label: "Name A–Z" },
  { value: "newest", label: "Newest customer" },
];

const time = (d: Date | null) => (d ? d.getTime() : 0);

export function compareCustomers(
  sort: string
): (a: CustomerSummaryish, b: CustomerSummaryish) => number {
  switch (sort) {
    case "orders":
      return (a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent;
    case "recent":
      // A customer who has never ordered has no date to sort by and belongs at
      // the bottom, not at the top where a zero timestamp would put them.
      return (a, b) => time(b.lastOrderAt) - time(a.lastOrderAt);
    case "name":
      return (a, b) => a.name.localeCompare(b.name);
    case "newest":
      return (a, b) => time(b.createdAt) - time(a.createdAt);
    default:
      return (a, b) => b.totalSpent - a.totalSpent || b.orderCount - a.orderCount;
  }
}
