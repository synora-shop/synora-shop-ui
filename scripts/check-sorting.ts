/**
 * Checks how a list is ordered and drawn — run with `npm run check:sorting`.
 *
 * Both choices live in the URL for the same reason the filters and the page
 * number do: an ordering that only exists in the browser would, with paging on,
 * re-arrange the twenty-five rows already on screen and call it sorting. The
 * traps guarded here are the ones that make that mistake invisible — a default
 * spelled two ways, a sort that keeps you on page four of the old order, and a
 * menu offering an ordering the query does not apply.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  CUSTOMER_SORTS,
  ENQUIRY_SORTS,
  MEDIA_SORTS,
  ORDER_SORTS,
  PRODUCT_SORTS,
  compareCustomers,
  readSort,
  sortHref,
} from "../lib/sorting";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

/* -------------------------------------------------------------------------- */
/* Choosing an ordering                                                       */
/* -------------------------------------------------------------------------- */

check("no choice means the list's own first option", readSort({}, PRODUCT_SORTS).value === "newest");
check("a choice is honoured", readSort({ sort: "title" }, PRODUCT_SORTS).value === "title");
// A hand-edited ?sort=stock would otherwise reach Prisma as an unknown column.
check("an unknown ordering falls back", readSort({ sort: "nonsense" }, PRODUCT_SORTS).value === "newest");
check(
  "one list's ordering is not valid on another",
  readSort({ sort: "price" }, ORDER_SORTS).value === "newest",
  "products sort by price; orders have no such column"
);

for (const [name, opts] of Object.entries({ PRODUCT_SORTS, ORDER_SORTS, ENQUIRY_SORTS, MEDIA_SORTS })) {
  check(`${name}: every option has a distinct value`, new Set(opts.map((o) => o.value)).size === opts.length);
  check(`${name}: every option carries an orderBy`, opts.every((o) => o.orderBy && Object.keys(o.orderBy).length > 0));
}
check("CUSTOMER_SORTS: every option has a distinct value", new Set(CUSTOMER_SORTS.map((o) => o.value)).size === CUSTOMER_SORTS.length);

/* -------------------------------------------------------------------------- */
/* The addresses                                                              */
/* -------------------------------------------------------------------------- */

// One screen, one URL — the default is spelled by leaving the parameter out.
check("the default ordering is spelled by omission", sortHref("/admin/products", {}, "newest", PRODUCT_SORTS) === "/admin/products");
check("another ordering says so", sortHref("/admin/products", {}, "title", PRODUCT_SORTS) === "/admin/products?sort=title");
check(
  "sorting keeps the filters and the search",
  sortHref("/admin/products", { status: ["DRAFT"], q: "shirt" }, "title", PRODUCT_SORTS) ===
    "/admin/products?q=shirt&status=DRAFT&sort=title"
);
// Re-ordering moves every row, so page 4 of the old order is nowhere anybody meant to be.
check(
  "sorting returns to the first page",
  !sortHref("/admin/products", { page: "4" }, "title", PRODUCT_SORTS).includes("page")
);
check(
  "the view survives a sort",
  sortHref("/admin/products", { view: "grid" }, "title", PRODUCT_SORTS).includes("view=grid")
);

/* -------------------------------------------------------------------------- */
/* Customers, ordered in memory                                               */
/* -------------------------------------------------------------------------- */

const d = (s: string) => new Date(s);
const people = [
  { name: "Zara", orderCount: 1, totalSpent: 500, lastOrderAt: d("2026-01-01"), createdAt: d("2025-01-01") },
  { name: "Adam", orderCount: 9, totalSpent: 100, lastOrderAt: d("2026-09-01"), createdAt: d("2026-08-01") },
  { name: "Mina", orderCount: 0, totalSpent: 0, lastOrderAt: null, createdAt: d("2026-05-01") },
];
const by = (s: string) => [...people].sort(compareCustomers(s)).map((p) => p.name);
check("spend orders by lifetime value", by("spend")[0] === "Zara");
check("orders counts orders, not money", by("orders")[0] === "Adam");
check("recent uses the last order", by("recent")[0] === "Adam");
// A customer who has never ordered has no date, and a zero timestamp would put
// them at the top of "ordered most recently" — the opposite of the truth.
check("someone who never ordered sorts last by recency", by("recent")[2] === "Mina", `got ${by("recent")}`);
check("name is alphabetical", by("name")[0] === "Adam");
check("newest uses signup, not orders", by("newest")[0] === "Adam");
check("an unknown ordering falls back to spend", by("nonsense")[0] === "Zara");

/* -------------------------------------------------------------------------- */
/* The screens actually use it                                                */
/* -------------------------------------------------------------------------- */

for (const [file, consts] of [
  ["app/admin/products/page.tsx", ["PRODUCT_SORTS", "ViewToggle"]],
  ["app/admin/orders/page.tsx", ["ORDER_SORTS"]],
  ["app/admin/enquiries/page.tsx", ["ENQUIRY_SORTS"]],
  ["app/admin/data/page.tsx", ["MEDIA_SORTS", "ViewToggle"]],
  ["app/admin/customers/page.tsx", ["CUSTOMER_SORTS"]],
] as const) {
  const src = readFileSync(join(process.cwd(), file), "utf8");
  for (const c of consts) check(`${file} uses ${c}`, src.includes(c));
  // The whole point: the chosen ordering has to reach the query, not just the
  // menu. A screen that draws the control and ignores it is worse than none.
  if (consts[0] !== "CUSTOMER_SORTS") {
    check(`${file} passes the ordering to the query`, /orderBy: sort\.orderBy/.test(src));
  }
  check(`${file} no longer hardcodes an order`, !/orderBy: \{ createdAt: "desc" \},\s*\n\s*skip/.test(src));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
