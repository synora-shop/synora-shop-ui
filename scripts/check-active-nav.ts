/**
 * Checks that exactly one navigation link ever reads as active — run with
 * `npm run check:nav`.
 *
 * The bug this exists for: /admin is a prefix of every page in the panel, so
 * "active if the path starts with the href" lit Home on every screen, beside
 * whichever link was really current. Two highlighted links, and two elements
 * claiming aria-current="page", which is invalid.
 *
 * It is the kind of mistake that comes back, because the broken rule is the one
 * that reads correctly, so the hrefs are asserted here rather than the words.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { activeHref } from "../lib/active-nav";
import { resolveNav, sections } from "../lib/admin-nav";

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

/* -------------------------------------------------------------------------- */
/* The rule                                                                   */
/* -------------------------------------------------------------------------- */

const nav = ["/admin", "/admin/settings", "/admin/products", "/admin/theme"];

check("a link matches its own page", activeHref(nav, "/admin/settings") === "/admin/settings");
// The one that started this: the landing page is a prefix of everything.
check(
  "the landing page does not win on a deeper page",
  activeHref(nav, "/admin/settings") !== "/admin",
  "Home lit up on every screen in the panel"
);
check("the landing page wins on itself", activeHref(nav, "/admin") === "/admin");
check(
  "a child page activates its parent link",
  activeHref(nav, "/admin/products/new") === "/admin/products"
);
check(
  "the deeper of two matches wins",
  activeHref(["/admin", "/admin/products"], "/admin/products/abc/edit") === "/admin/products"
);
check("a path under nothing matches nothing", activeHref(nav, "/merchant/login") === null);
check("an empty navigation matches nothing", activeHref([], "/admin") === null);
// A near-miss must not count: /admin/product is not /admin/products.
check(
  "a partial segment is not a match",
  activeHref(["/admin/products"], "/admin/products-archive") === null,
  "startsWith without the slash would match this"
);

/* -------------------------------------------------------------------------- */
/* Exactly one, against the real navigation                                   */
/* -------------------------------------------------------------------------- */

// Read from lib/admin-nav.ts rather than from the sidebar component: the
// sidebar draws six section names now, and every address in the panel lives in
// the navigation model beside them.
const source = readFileSync(join(process.cwd(), "lib/admin-nav.ts"), "utf8");

const entries = [...source.matchAll(/\{ href: "(\/admin[^"]*)"[^}]*\}/g)].map((m) => ({
  href: m[1],
  gated: /onlyFor|hideFor/.test(m[0]),
}));
check("the navigation's hrefs were found", entries.length > 15, `found ${entries.length}`);

// The same address may legitimately appear twice — a blog files its posts where
// a shop files its products — but only if each copy is gated to a business
// type, or both would render at once.
const byHref = new Map<string, typeof entries>();
for (const e of entries) byHref.set(e.href, [...(byHref.get(e.href) ?? []), e]);
for (const [href, copies] of byHref) {
  if (copies.length === 1) continue;
  check(
    `${href} appears ${copies.length} times, and every copy is gated by business type`,
    copies.every((c) => c.gated),
    "two ungated links to one page would both render"
  );
}

const hrefs = [...byHref.keys()];
for (const path of hrefs) {
  const winner = activeHref(hrefs, path);
  check(`${path} activates itself and nothing longer`, winner === path, `activated ${winner}`);
}

// Nothing in the sidebar or the navigation bar may prefix-match per link: that
// is the rule that lit two links at once.
for (const file of ["components/admin/admin-sidebar.tsx", "components/admin/admin-navbar.tsx"]) {
  check(
    `${file} does not prefix-match per link`,
    !/pathname\.startsWith/.test(readFileSync(join(process.cwd(), file), "utf8"))
  );
}

/* -------------------------------------------------------------------------- */
/* Every tab is a real screen                                                 */
/* -------------------------------------------------------------------------- */

// A tab pointing at a route that does not exist is a door to nowhere, and the
// navigation bar makes those far easier to add than the old sidebar did: one
// line in a list, and it renders beside five that work.
for (const href of hrefs) {
  const segments = href.replace(/^\//, "").split("/");
  const dir = join(process.cwd(), "app", ...segments);
  check(`${href} has a page`, existsSync(join(dir, "page.tsx")), `no app${href}/page.tsx`);
}

/* -------------------------------------------------------------------------- */
/* The two levels agree                                                       */
/* -------------------------------------------------------------------------- */

const all = sections();

// A ceiling, not a count. The sidebar exists in this shape because it replaced
// seven collapsible groups with links nested inside them, where reaching Orders
// meant finding the right group, opening it, and reading past six siblings. The
// rule being held up is "flat and short enough to read at a glance", so the
// check is a limit — and one that has to be raised deliberately, by someone who
// has thought about whether the new section earns a permanent row.
//
// Raised from 6 to 7 on 8 September 2026, when Customers left Products.
// Raised from 7 to 10 on 11 September 2026, when Data, Discounts and Account
// were promoted out of tab rows and the list was split into three bands. Ten
// is the whole panel on screen at once with nothing nested — the bands are
// spacing, not folders, so none of the cost the old groups had came back.
check("the sidebar stays short", all.length <= 10, `found ${all.length}`);

/* -------------------------------------------------------------------------- */
/* The bands                                                                  */
/* -------------------------------------------------------------------------- */

// Three, and every section in one of them. A fourth band, or a section with no
// band, would draw a gap nobody decided on.
const groups = all.map((s) => s.group);
check("every section is in a band", groups.every((g) => g === 1 || g === 2 || g === 3));
check("there are three bands", new Set(groups).size === 3);

// Contiguous, or the sidebar draws the same band twice with a gap through the
// middle of it. The renderer starts a new gap wherever the band changes from
// the row above, so an out-of-order section does not sort itself — it splits.
check(
  "each band is one unbroken run",
  (() => {
    const seen: number[] = [];
    for (const g of groups) if (seen[seen.length - 1] !== g) seen.push(g);
    return seen.length === new Set(seen).size;
  })(),
  `order was ${groups.join(",")}`
);

// The bands are drawn as space and nothing else. A heading or a rule creeping
// into the sidebar is the old collapsible groups starting to grow back.
{
  const sidebar = readFileSync(join(process.cwd(), "components/admin/admin-sidebar.tsx"), "utf8");
  check(
    "a band is a gap, not a heading",
    !/border-t|<hr|role="separator"|uppercase/.test(sidebar),
    "groups are spacing; a label or a rule is a different decision and needs making on purpose"
  );
}
check("the sidebar has more than one section", all.length > 1);

for (const section of all) {
  // Clicking a sidebar item must land inside that item, or the sidebar would
  // light one thing and the navigation bar another.
  const resolved = resolveNav(section.href);
  check(`${section.label} lands on itself`, resolved.section.key === section.key,
    `landed on ${resolved.section.label}`);
  check(`${section.label} starts at its first tab`, section.href === section.tabs[0].href);
  // A section of one draws no navigation bar — a bar with a single tab in it is
  // furniture, not navigation.
  check(`${section.label} draws a bar only when it has somewhere to go`,
    section.tabs.length > 1
      ? resolved.tabs.length === section.tabs.length
      : resolved.tabs.length === 0);
}

/* -------------------------------------------------------------------------- */
/* One panel, one set of words                                                */
/* -------------------------------------------------------------------------- */

// APP.ai and the documentation were drawn for a shop that sells products. A
// restaurant is not this panel with "Dishes" written over "Products" — it gets
// its own design. Half-renaming put "Dishes" in the sidebar above a screen
// still built on SKUs, variants and shipping.
const navSource = readFileSync(join(process.cwd(), "lib/admin-nav.ts"), "utf8");
for (const banned of ["vocabularyFor", "wordFor", "onlyFor", "hideFor", "RESTAURANT:", "BLOG:"]) {
  check(`the navigation does not branch on business type (${banned})`,
    !navSource.includes(banned));
}
check("resolveNav takes only a path", /export function resolveNav\(pathname: string\)/.test(navSource));

/* -------------------------------------------------------------------------- */
/* No admin route that nothing links to                                       */
/* -------------------------------------------------------------------------- */

// The other half of "every tab has a page": every page is reachable. A route
// with nothing pointing at it renders under whatever heading resolveNav falls
// back to, and is found only by someone typing a URL — which is how a screen
// ends up live, broken, and unnoticed for months.
function routes(dir: string, prefix = "/admin"): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const here = `${prefix}/${entry.name}`;
    if (existsSync(join(dir, entry.name, "page.tsx"))) out.push(here);
    out.push(...routes(join(dir, entry.name), here));
  }
  return out;
}

const adminRoutes = routes(join(process.cwd(), "app", "admin"));
check("admin routes were found", adminRoutes.length > 15, `found ${adminRoutes.length}`);

/** Routes reached from within a tab rather than from the navigation itself. */
const CHILD_OF_A_TAB = /^\/admin\/[a-z-]+\/(\[[a-z]+\]|new)$/;
/**
 * Screens deliberately outside this design, which redirect rather than render.
 * They belong to business types whose panels have not been drawn.
 */
const REDIRECTS_OUT = ["/admin/blog", "/admin/hours", "/admin/locations"];
/** Its own flow, entered before a shop has a panel to show. */
const OWN_FLOW = ["/admin/welcome"];

for (const route of adminRoutes) {
  if (hrefs.includes(route)) continue;
  if (CHILD_OF_A_TAB.test(route)) continue;
  if (OWN_FLOW.some((f) => route.startsWith(f))) continue;
  if (REDIRECTS_OUT.includes(route)) {
    const src = readFileSync(join(process.cwd(), "app", route.replace("/admin/", "admin/"), "page.tsx"), "utf8");
    check(`${route} redirects rather than rendering`, /redirect\("\/admin"\)/.test(src));
    continue;
  }
  check(`${route} is reachable from the navigation`, false, "nothing links to it");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
