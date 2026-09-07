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
import { existsSync, readFileSync } from "fs";
import { join } from "path";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const ROOT = process.cwd();
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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
