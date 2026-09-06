/**
 * Checks how long lists are broken into pages — run with `npm run check:paging`.
 *
 * The documented behaviour is small but exact, and every part of it is easy to
 * get subtly wrong: the merchant picks the page size, "all" turns paging off
 * entirely and takes the bar off the screen, and a page number past the end
 * comes back as the last real page rather than as an empty list — which is what
 * happens on its own the moment somebody on page four deletes enough rows to
 * leave three.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  DEFAULT_PER_PAGE,
  pageHref,
  pageWindow,
  perPageHref,
  readPaging,
  readPerPage,
  totalPages,
} from "../lib/paging";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

/* -------------------------------------------------------------------------- */
/* Page size                                                                  */
/* -------------------------------------------------------------------------- */

check("no choice means the default", readPerPage({}) === DEFAULT_PER_PAGE);
check("a choice is honoured", readPerPage({ per: "50" }) === 50);
check('"all" turns paging off', readPerPage({ per: "all" }) === null);
// A hand-edited ?per=100000 is a way to ask the database for everything while
// still drawing a bar that promises otherwise.
check("an unoffered size falls back", readPerPage({ per: "100000" }) === DEFAULT_PER_PAGE);
check("rubbish falls back", readPerPage({ per: "banana" }) === DEFAULT_PER_PAGE);
check("a negative size falls back", readPerPage({ per: "-25" }) === DEFAULT_PER_PAGE);

/* -------------------------------------------------------------------------- */
/* How many pages                                                             */
/* -------------------------------------------------------------------------- */

check("an empty list is one page", totalPages(0, 25) === 1);
check("an exact fit does not gain a page", totalPages(100, 25) === 4);
check("a remainder gains one", totalPages(101, 25) === 5);
check('"all" is always one page', totalPages(10_000, null) === 1);

/* -------------------------------------------------------------------------- */
/* Where the list starts                                                      */
/* -------------------------------------------------------------------------- */

check("page one starts at nothing", readPaging({}, 100).skip === 0);
check("page three skips two pages", readPaging({ page: "3" }, 100).skip === 50);
check("the take is the page size", readPaging({ page: "3" }, 100).take === 25);
// The one that bites in practice: deleting rows while on a late page.
check(
  "a page past the end lands on the last real page",
  readPaging({ page: "9" }, 60).page === 3,
  "an empty screen with no way back"
);
check("page zero is page one", readPaging({ page: "0" }, 60).page === 1);
check("a nonsense page is page one", readPaging({ page: "banana" }, 60).page === 1);
check("a fractional page is page one", readPaging({ page: "2.7" }, 60).page === 2);
check('"all" takes everything', readPaging({ per: "all" }, 999).take === undefined);
check('"all" starts at nothing', readPaging({ per: "all", page: "4" }, 999).skip === 0);

/* -------------------------------------------------------------------------- */
/* The addresses                                                              */
/* -------------------------------------------------------------------------- */

// One screen, one URL. ?page=1 and no parameter must not be two addresses for
// the same list.
check("page one is spelled by omission", pageHref("/admin/products", {}, 1) === "/admin/products");
check(
  "another page says so",
  pageHref("/admin/products", {}, 3) === "/admin/products?page=3"
);
check(
  "paging keeps the filters",
  pageHref("/admin/products", { status: ["DRAFT"] }, 2) ===
    "/admin/products?status=DRAFT&page=2"
);
check(
  "paging keeps a search",
  pageHref("/admin/products", { q: "shirt" }, 2) === "/admin/products?q=shirt&page=2"
);
// Showing more rows moves everything, so staying on page 3 would land the
// merchant somewhere they did not ask to be.
check(
  "changing the page size returns to the first page",
  perPageHref("/admin/products", { page: "3" }, 50) === "/admin/products?per=50"
);
check(
  "the default size is spelled by omission",
  perPageHref("/admin/products", { per: "50" }, DEFAULT_PER_PAGE) === "/admin/products"
);
check(
  '"all" is spelled out',
  perPageHref("/admin/products", {}, null) === "/admin/products?per=all"
);
check(
  "the page size keeps the filters",
  perPageHref("/admin/products", { status: ["DRAFT"] }, 50) ===
    "/admin/products?status=DRAFT&per=50"
);

/* -------------------------------------------------------------------------- */
/* Which numbers get drawn                                                    */
/* -------------------------------------------------------------------------- */

check("a short list draws every page", pageWindow(1, 4).join() === "1,2,3,4");
const many = pageWindow(50, 200);
check("a long list always offers the first", many[0] === 1);
check("and always offers the last", many[many.length - 1] === 200);
check("and stays short", many.length <= 9, `drew ${many.length}`);
check("and includes where you are", many.includes(50));
check("the start of a long list needs no leading gap", pageWindow(1, 200)[1] !== 0);
const end = pageWindow(200, 200);
check("the end of a long list needs no trailing gap", end[end.length - 2] !== 0);

/* -------------------------------------------------------------------------- */
/* The bar disappears when it should                                          */
/* -------------------------------------------------------------------------- */

const bar = readFileSync(join(process.cwd(), "components/admin/pagination-bar.tsx"), "utf8");
check('"all" hides the bar', /perPage === null\) return null/.test(bar));
check("one page hides the bar", /pages <= 1\) return null/.test(bar));
// A disabled anchor is still clickable and still focusable, so "previous" on
// page one would quietly reload the page the merchant is already looking at.
check("the ends are not links", /if \(disabled\) \{[\s\S]{0,200}<span/.test(bar));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
