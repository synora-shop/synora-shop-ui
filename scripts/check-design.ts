/**
 * Checks the design standards are the ones written down — `npm run check:design`.
 *
 * docs/DESIGN.md names the rules this panel is built to, and names the check
 * that holds each one up. A document that names a check that does not exist is
 * worse than no document: it is a promise nobody is keeping, and the README
 * spent a month describing a vocabulary layer that had been deleted.
 *
 * So this asserts the document's own references. It does not judge the design
 * — the other checks do that — it makes sure the map matches the ground.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
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

const SKIP = new Set(["node_modules", ".git", ".next", ".claude", "generated", "migrations"]);
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}
const doc = join(ROOT, "docs/DESIGN.md");
check("the design standards exist", existsSync(doc));
if (!existsSync(doc)) {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(1);
}

const design = readFileSync(doc, "utf8");

/* Every check the document names by its printed assertion must be a check that
   actually prints it. */
const naming = readFileSync(join(ROOT, "scripts/check-naming.ts"), "utf8");
// The document wraps its lines, so an assertion may be split across two of
// them. Whitespace is collapsed before matching.
const flat = design.replace(/\s+/g, " ");
const quoted = [...flat.matchAll(/`check:naming`, "([^"]+)"/g)].map((m) => m[1]);
check("the document quotes at least one assertion", quoted.length > 0);
for (const assertion of quoted) {
  check(`check:naming really asserts "${assertion}"`, naming.includes(`"${assertion}"`));
}

/* Every file the document points at must be there. */
for (const path of [
  "app/globals.css",
  "components/ui/primitives.tsx",
  "components/admin/list-empty.tsx",
  "components/admin/nav-icons.tsx",
  "lib/order-status-style.ts",
  "lib/store-type-switch.ts",
  "lib/money.ts",
  "scripts/sweep/README.md",
  "scripts/sweep/sweep-a11y.mjs",
  "scripts/check-responsive.ts",
  "docs/QUEUE.md",
]) {
  if (!design.includes(path)) continue;
  check(`${path} exists, as the document says`, existsSync(join(ROOT, path)));
}

/* The four colours are the four colours. A fifth in .admin-shell would make the
   document wrong before anybody noticed the screen had changed. */
const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
for (const colour of ["#d2d2d2", "#e0e0e0", "#fafafa", "#6666ff"]) {
  check(`${colour} is still one of the four`, css.includes(colour) && design.includes(colour));
}

/* Named components and helpers the document leans on. */
const primitives = readFileSync(join(ROOT, "components/ui/primitives.tsx"), "utf8");
check("Fieldset is a real primitive", /export function Fieldset/.test(primitives));
check("SectionDivider is a real primitive", /export function SectionDivider/.test(primitives));
const shell = readFileSync(join(ROOT, "components/merchant/form-shell.tsx"), "utf8");
check("Field and FieldLabel are the two label components", /export function Field\(/.test(shell) && /export function FieldLabel\(/.test(shell));
const toggle = readFileSync(join(ROOT, "components/ui/toggle-switch.tsx"), "utf8");
check("the switch has the hugging variant the document describes", /inline\?: boolean/.test(toggle));
const statuses = readFileSync(join(ROOT, "lib/order-status-style.ts"), "utf8");
check("statusLabel and paymentLabel exist", /export function statusLabel/.test(statuses) && /export function paymentLabel/.test(statuses));

/* Reduced motion turns off everything that moves, and leaves it visible. */
check(
  "every animation the document names is off under reduced motion",
  /prefers-reduced-motion[\s\S]*\.rise,[\s\S]*\.bulk-rise/.test(css)
);

/* The deleted vocabulary layer must stay deleted: the document says the panel
   is e-commerce only, and this is the file that would make that untrue. */
check("there is still no renaming layer", !existsSync(join(ROOT, "lib/themes/vocabulary.ts")));

/* -------------------------------------------------------------------------- */
/* One way to name a thing                                                    */
/* -------------------------------------------------------------------------- */

// A section is named by SectionDivider, a card by a 13px semibold line and a
// group of rows inside a card by an 11px uppercase label. That was the rule
// before this check existed and only Fieldset followed it. An audit of every
// screen found four styles doing the job — 14px medium, 14px semibold, 12px
// semibold uppercase and 12px medium uppercase — two of them a few hundred
// pixels apart on the same screen, and five more headings written as <p> so
// nothing in the page outline knew they named anything.
//
// The primitives are CardTitle and GroupLabel. This stops the four coming back.
{
  const screens = [...walk(join(ROOT, "components/admin")), ...walk(join(ROOT, "app/admin"))];

  for (const file of screens) {
    const rel = relative(ROOT, file);
    // A dialog's own title is not a card title; it sits in a different frame.
    if (/dialog\.tsx$/.test(rel)) continue;
    const src = readFileSync(file, "utf8");

    check(
      `${rel} does not hand-write a card title`,
      !/className="[^"]*text-\[13px\] font-semibold text-ink[^"]*"/.test(src),
      "use <CardTitle>"
    );
    check(
      `${rel} does not hand-write a group label`,
      !/className="[^"]*text-xs[^"]*uppercase[^"]*text-ink-faint[^"]*"/.test(src),
      "use <GroupLabel>"
    );
    check(
      `${rel} does not use a paragraph as a heading`,
      !/<p className="text-sm font-(medium|semibold) text-ink">/.test(src),
      "a heading written as <p> is invisible to the page outline — use <CardTitle>"
    );
  }
}

/* -------------------------------------------------------------------------- */
/* One gap between sections                                                   */
/* -------------------------------------------------------------------------- */

// Every screen's outermost container used a different value — 2.5, 3, 4, 5, 6
// and 8 across thirty-three screens, depending on when each was built. Mostly
// invisible, because most screens have one section; the cost was that the next
// section added to any of them landed at a distance nobody chose.
{
  const pages = walk(join(ROOT, "app/admin")).filter((f) => /page\.tsx$/.test(f));
  for (const file of pages) {
    const rel = relative(ROOT, file);
    const src = readFileSync(file, "utf8");
    const root = /<div className="(space-y-[\d.]+)"/.exec(src)?.[1];
    if (!root) continue; // A screen with a single block needs no rhythm.
    check(
      `${rel} uses the standard gap between sections`,
      root === "space-y-2.5",
      `it uses ${root}`
    );
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
