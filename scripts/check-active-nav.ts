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
import { readFileSync } from "fs";
import { join } from "path";
import { activeHref } from "../lib/active-nav";

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
/* Exactly one, against the real sidebar                                      */
/* -------------------------------------------------------------------------- */

const source = readFileSync(join(process.cwd(), "components/admin/admin-sidebar.tsx"), "utf8");

// Every href the sidebar actually offers, read from the file so this test
// cannot drift from the navigation it is about.
const entries = [...source.matchAll(/\{ href: "(\/admin[^"]*)"[^}]*\}/g)].map((m) => ({
  href: m[1],
  gated: /onlyFor|hideFor/.test(m[0]),
}));
check("the sidebar's hrefs were found", entries.length > 5, `found ${entries.length}`);

// The same address may legitimately appear twice — a blog files its enquiries
// under Pages where a shop files them under orders — but only if each copy is
// gated to a business type, or both would render at once.
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

// The sidebar must compare by equality against the winner, never re-derive the
// old rule per link.
check(
  "the sidebar no longer prefix-matches per link",
  !/pathname\.startsWith/.test(source),
  "that is the rule that lit two links at once"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
