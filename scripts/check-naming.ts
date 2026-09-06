/**
 * Checks the product calls itself one thing — run with `npm run check:naming`.
 *
 * Two names have been retired and both kept turning up months later, in
 * comments, in storage keys, and once in a live database row that pointed a
 * merchant's store preview at a domain nobody owns.
 *
 *   bettershp   Gone. Not a brand, not a URL, not a localStorage prefix.
 *   Your SHOP   The section is "Your App" — that is what the drawing calls it,
 *               and the icon file is literally named "Your App icon.svg".
 *
 * Applied migrations are exempt and must stay that way: their checksums are
 * recorded, and editing one makes `prisma migrate deploy` refuse to run. A
 * migration is a record of what happened, not a description of how things are.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const ROOT = process.cwd();
const SKIP = new Set([
  "node_modules", ".git", ".next", ".claude", "generated", "migrations",
]);
const EXT = /\.(ts|tsx|css|md|json)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXT.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
check("the tree was walked", files.length > 100, `found ${files.length} files`);

const RETIRED: [RegExp, string][] = [
  [/bettershp/i, "bettershp is retired — not a brand, not a URL, not a storage key"],
  [/Your SHOP/, 'the section is "Your App"'],
  [/Shop by Synora Digitals/, "the product is APP by Synora Digitals"],
  // Two marks means two products. There is one, and SynoraAppMark draws it.
  [/components\/ui\/wordmark/, "the wordmark is retired — use SynoraAppMark"],
];

for (const [pattern, why] of RETIRED) {
  const hits = files.filter((f) => {
    // This file names them in order to ban them.
    if (f === join(ROOT, "scripts", "check-naming.ts")) return false;
    return pattern.test(readFileSync(f, "utf8"));
  });
  check(
    `no "${pattern.source}" outside applied migrations — ${why}`,
    hits.length === 0,
    hits.map((f) => relative(ROOT, f)).join(", ")
  );
}

/* -------------------------------------------------------------------------- */
/* The sidebar wears the drawn icons                                          */
/* -------------------------------------------------------------------------- */

const nav = readFileSync(join(ROOT, "lib/admin-nav.ts"), "utf8");
check(
  "the navigation uses the drawn glyphs",
  /from "@\/components\/admin\/nav-icons"/.test(nav)
);
// A stock set gets you a house and a gear; it does not get you these six, at
// these weights, sized against each other the way a designer sized them.
check(
  "and not a general-purpose icon set",
  !/from "lucide-react"/.test(nav),
  "lucide crept back into the sidebar"
);

const icons = readFileSync(join(ROOT, "components/admin/nav-icons.tsx"), "utf8");
check("all six glyphs are exported", (icons.match(/^export function/gm) ?? []).length === 6);
// The source files carry their own fills, which would ignore the active pill
// and leave a dark glyph sitting on the brand colour. Matched on the attribute
// rather than on the text, so the comment explaining this does not trip it.
check(
  "they take their colour from the state",
  /fill="currentColor"/.test(icons) && !/fill="#/.test(icons) && !/class="cls-/.test(icons)
);

/* -------------------------------------------------------------------------- */
/* One mark, drawn in one place                                               */
/* -------------------------------------------------------------------------- */

// The sign-in page carried a separate "shop / synoradigitals" lockup while the
// admin bar carried "synora app" — the same product introducing itself by two
// different names, one screen apart.
for (const file of [
  "app/(platform)/layout.tsx",
  "app/merchant/layout.tsx",
  "components/admin/admin-topbar.tsx",
]) {
  check(
    `${file} uses the one product mark`,
    /SynoraAppMark/.test(readFileSync(join(ROOT, file), "utf8"))
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
