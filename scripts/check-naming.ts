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

/* -------------------------------------------------------------------------- */
/* One text box                                                               */
/* -------------------------------------------------------------------------- */

// The panel shipped three heights and two type sizes as one control, because
// .input owned the border and the colour but callers restated the rest —
// "input mt-1 h-9 text-sm" a dozen times, and two screens with a field of
// their own. Everything a text box needs lives in .input now.
const restating = files.filter((f) => {
  const src = readFileSync(f, "utf8");
  return /className="[^"]*\binput\b(?![-\w])[^"]*\b(h-\d|text-(xs|sm|base|lg)|px-\d|py-\d|rounded)/.test(src);
});
check(
  "no screen restates what .input already owns",
  restating.length === 0,
  restating.map((f) => relative(ROOT, f)).join(", ")
);

// A field built out of utility classes is a fourth text box nobody will
// remember to keep in step.
const handRolled = files.filter((f) => {
  const src = readFileSync(f, "utf8");
  return /const (field|inputClass) =\s*\n?\s*"[^"]*border[^"]*px-/.test(src);
});
check(
  "no screen builds a text box of its own",
  handRolled.length === 0,
  handRolled.map((f) => relative(ROOT, f)).join(", ")
);

const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
check("the shared text box sets its own height", /\.input \{[^}]*height:/.test(css));
check("a textarea is exempt from that height", /textarea\.input[\s\S]{0,120}height: auto/.test(css));
// Two sizes, both declared. A field inside a row needs to be shorter than one
// in a form — that is a real difference, and it belongs in the stylesheet
// rather than as h-8 written at each site.
check("the compact size is declared once", /\.input-sm \{[^}]*height:/.test(css));

/* -------------------------------------------------------------------------- */
/* Space                                                                      */
/* -------------------------------------------------------------------------- */

const side = readFileSync(join(ROOT, "components/admin/admin-sidebar.tsx"), "utf8");
// Six links that never change should not take a sixth of the screen.
check("the sidebar rows are 40px, not 48", /"h-10"/.test(side) && !/"h-12"/.test(side));
check("the sidebar is narrower than 15rem", /lg:w-\[13rem\]/.test(side));

// Twenty-five different buttons shipped while a Button primitive sat unused in
// half the panel — five paddings for the primary alone. A button built out of
// utilities is a twenty-sixth nobody will remember to keep in step.
const rolledButtons = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  const src = readFileSync(f, "utf8");
  return /className="[^"]*rounded-(full|pill)[^"]*(border border-border|bg-brand-500)[^"]*px-\d/.test(src);
});
check(
  "no screen builds a button out of utilities",
  rolledButtons.length === 0,
  rolledButtons.map((f) => relative(ROOT, f)).join(", ")
);

// Every admin screen is dynamic, so a navigation waits on the server. Without a
// loading state the old screen sits there and the panel appears to have ignored
// the click.
check("the panel has a loading state", existsSync(join(ROOT, "app/admin/loading.tsx")));
// A list skeleton drawn over a page of tiles is the wrong shape, and the page
// jumps when the real thing lands.
check("analytics has its own", existsSync(join(ROOT, "app/admin/analytics/loading.tsx")));
// A page of throbbing blocks is what someone who turned animation off turned it
// off to avoid.
check(
  "the skeleton pulse respects reduced motion",
  /motion-safe:animate-pulse/.test(readFileSync(join(ROOT, "components/ui/skeleton.tsx"), "utf8"))
);

// A gap is not a divider — on a page of stacked cards it reads as more list.
check(
  "there is a named section divider",
  /export function SectionDivider/.test(readFileSync(join(ROOT, "components/ui/primitives.tsx"), "utf8"))
);

// A form label was written three ways: a wrapping <label> at text-sm, a bare
// uppercase text-xs, and a flex row with an info popover in it. On one screen
// all three were visible at once. Field and FieldLabel are the only two.
const strayLabels = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  const src = readFileSync(f, "utf8");
  return (
    /text-xs font-semibold uppercase text-ink-soft/.test(src) ||
    /className="flex items-center gap-1\.5 text-xs font-medium text-ink"/.test(src) ||
    /const label = "[^"]*text-ink"/.test(src)
  );
});
check(
  "no screen invents its own field label",
  strayLabels.length === 0,
  strayLabels.map((f) => relative(ROOT, f)).join(", ")
);

// The label has to reach the control. A wrapping <label> does it by containment
// and needs no id; anything else needs htmlFor, and a popover button cannot go
// inside a <label> because it would eat the click meant for the input.
const shell = readFileSync(join(ROOT, "components/merchant/form-shell.tsx"), "utf8");
check("the wrapping label exists", /export function Field\(/.test(shell));
check("the explicit one takes htmlFor", /export function FieldLabel\([\s\S]{0,600}htmlFor\?: string/.test(shell));
check(
  "the info popover sits outside the label element",
  /<\/label>\s*\) : \([\s\S]{0,120}\)\}\s*\{info &&/.test(shell)
);

// Settings is where a merchant meets the most controls at once, so it is where
// an inconsistency is loudest. Every block on it is one primitive.
const settings = readFileSync(join(ROOT, "app/admin/settings/page.tsx"), "utf8");
check("settings builds no ad-hoc panel", !/<section className="[^"]*rounded-xl/.test(settings));
check("settings is divided, not just spaced", /<SectionDivider/.test(settings));
for (const f of [
  "components/admin/global-edits-form.tsx",
  "components/admin/store-defaults-form.tsx",
  "components/admin/store-settings-form.tsx",
  "components/admin/business-type-form.tsx",
  "components/admin/visibility-form.tsx",
]) {
  const src = readFileSync(join(ROOT, f), "utf8");
  check(`${f.split("/").pop()} uses the shared fieldset`, /<Fieldset/.test(src));
  check(`${f.split("/").pop()} declares no serif heading`, !/font-serif/.test(src));
}

// A lone switch in a column as wide as a text field ends up an inch of empty
// white away from its own label. Inside a fieldset it goes first, and hugs.
const toggle = readFileSync(join(ROOT, "components/ui/toggle-switch.tsx"), "utf8");
check("the switch has a hugging variant", /inline\?: boolean/.test(toggle));
const marooned = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  const src = readFileSync(f, "utf8");
  if (!/<Fieldset/.test(src)) return false;
  // every ToggleSwitch inside a fieldset screen must ask for the inline form
  const opens = src.match(/<ToggleSwitch\b/g)?.length ?? 0;
  const inlines = src.match(/<ToggleSwitch\s+inline\b/g)?.length ?? 0;
  return opens !== inlines;
});
check(
  "no switch is marooned in a fieldset",
  marooned.length === 0,
  marooned.map((f) => relative(ROOT, f)).join(", ")
);

// The panel is sans-serif. The serif face belongs to the storefront and to a
// full-screen message (an error, a locked door) — never to a heading inside a
// screen, where it read as a different product bolted on. Sections are named by
// SectionDivider, cards by a 13px semibold line.
const serif = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  if (/(access-denied|error)\.tsx$/.test(f)) return false;
  return /font-serif/.test(readFileSync(f, "utf8"));
});
check(
  "no serif heading inside a screen",
  serif.length === 0,
  serif.map((f) => relative(ROOT, f)).join(", ")
);

// A switch with no accessible name is a nameless button to a screen reader.
const namelessSwitch = files.filter(
  (f) => /\/components\//.test(f) && /<ToggleSwitch[\s\S]{0,80}label=""/.test(readFileSync(f, "utf8"))
);
check(
  "every switch is named",
  namelessSwitch.length === 0,
  namelessSwitch.map((f) => relative(ROOT, f)).join(", ")
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
