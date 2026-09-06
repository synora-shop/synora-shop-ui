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
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { activeHref } from "../lib/active-nav";
import { resolveNav, sectionsFor } from "../lib/admin-nav";

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

for (const type of ["ECOMMERCE", "RESTAURANT", "BLOG"] as const) {
  const sections = sectionsFor(type);
  check(`${type}: the sidebar has sections`, sections.length > 0);
  for (const section of sections) {
    // Clicking a sidebar item must land inside that item, or the sidebar would
    // light one thing and the navigation bar another.
    const resolved = resolveNav(section.href, type);
    check(
      `${type}: ${section.label} lands on itself`,
      resolved.section.key === section.key,
      `landed on ${resolved.section.label}`
    );
    check(
      `${type}: ${section.label} starts at its first tab`,
      section.href === section.tabs[0].href
    );
  }
  // A section of one draws no navigation bar — a bar with a single tab is
  // furniture, not navigation.
  for (const section of sections) {
    const { tabs } = resolveNav(section.href, type);
    check(
      `${type}: ${section.label} draws a bar only when it has somewhere to go`,
      section.tabs.length > 1 ? tabs.length === section.tabs.length : tabs.length === 0
    );
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
