/**
 * Checks the admin chrome holds together at every width — run with
 * `npm run check:responsive`.
 *
 * The panel's shell is two levels now: a sidebar that names six destinations
 * and never changes, and a navigation bar that changes completely with it. The
 * failures worth guarding are the ones that only show up on a real window —
 * a drawer that cannot be opened on a phone, two things pinned to the top of
 * the viewport fighting over the same 56 pixels, a tab row that wraps and
 * pushes the page down as you move between sections.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";

const read = (...p: string[]) => readFileSync(join(process.cwd(), ...p), "utf8");

/** Source with comments stripped, so a comment quoting a class is not a match. */
function sourceOf(...p: string[]): string {
  return read(...p)
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name}  ${detail}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};

const sidebar = sourceOf("components", "admin", "admin-sidebar.tsx");
const topbar = sourceOf("components", "admin", "admin-topbar.tsx");
const layout = sourceOf("app", "admin", "layout.tsx");
const css = sourceOf("app", "globals.css");
const store = sourceOf("lib", "admin-nav-store.ts");

console.log("\nTHE SIDEBAR IS A DRAWER ON A PHONE AND A COLUMN ON A DESKTOP");
check("a drawer below lg", /-translate-x-full/.test(sidebar));
check("a column from lg", /lg:sticky/.test(sidebar) && /lg:translate-x-0/.test(sidebar));
check("the drawer is named so the toggle can point at it", /id="admin-nav"/.test(sidebar));
// The icon rail is gone with the nesting that made it necessary. Six flat items
// fit at 15rem on any laptop, and a control that hides the words on a
// navigation this short costs more than it saves.
check("there is no icon rail left behind", !/4\.5rem/.test(sidebar), "the rail width");
check("and no stored preference for one", !/collapsed/i.test(store) && !/collapsed/i.test(sidebar));

console.log("\nONLY ONE THING IS PINNED TO THE TOP OF THE VIEWPORT");
// Anything else fixed at top-0 in the admin chrome is either hidden underneath
// the top bar or hiding it.
const sidebarTopBars = (sidebar.match(/fixed[^"]*top-0/g) ?? []).length;
check("the sidebar declares no bar of its own", sidebarTopBars === 0, `found ${sidebarTopBars}`);
check("the topbar is the sticky one", /sticky top-0/.test(topbar));
// The mark sits at the left of the header, where the design puts it. It was
// centred on the window for as long as the header was colourless — the centre
// was the only place it could sit without reading as a heading — and centring
// it cost two bugs: a `fixed` version that floated free when `overflow-x:
// hidden` made the bar's stickiness a no-op, and an absolute version needing a
// hand-computed offset of half a sidebar. Neither problem exists at the left.
check("the header is 80px", /h-20/.test(topbar));
check("the mark is 30px", /h-\[30px\]/.test(topbar));
check(
  "and it is not centred on the window any more",
  !/absolute left-1\/2 top-0/.test(topbar),
  "centring it needed an offset nobody could derive from the drawing"
);

console.log("\nTHE NAVIGATION CAN BE OPENED ON A PHONE");
check("the topbar owns the toggle", /aria-controls="admin-nav"/.test(topbar));
check("the toggle is hidden once the sidebar is visible", /lg:hidden/.test(topbar));
check("both read the same state", /useAdminNav/.test(topbar) && /useAdminNav/.test(sidebar));

console.log("\nTHE TAB ROW SCROLLS RATHER THAN WRAPPING");
// A wrapped tab row changes height as you move between sections, and
// everything below it jumps by a line. The bar is back as of 22 September, so
// this is the original hazard again rather than a stand-in for it.
const navbar = readFileSync(join(process.cwd(), "components/admin/admin-navbar.tsx"), "utf8");
check("the tab row scrolls rather than wrapping", /overflow-x-auto/.test(navbar));
check("and draws no scrollbar inside 55px of bar", /scrollbar-none/.test(navbar));
check("a section of one screen draws no bar", /tabs\.length === 0\) return null/.test(navbar));
check("a sidebar label does not break mid-word", /truncate/.test(sidebar));
check("and the sidebar can scroll if it ever outgrows the screen", /overflow-y-auto/.test(sidebar));

console.log("\nBOTH LEVELS COME FROM ONE PLACE");
check("the sidebar reads the navigation model", /@\/lib\/admin-nav"/.test(sidebar));
check("so does the heading bar", /@\/lib\/admin-nav"/.test(topbar));
// A hardcoded href here is how the sidebar and the bar came to disagree about
// where a section starts.
check("no screen hardcodes an admin address", !/href="\/admin\//.test(sidebar));

console.log("\nTHE PANEL'S GREYS ARE DEFINED ONCE");
check("the shell tokens exist", /\.admin-shell\s*\{[\s\S]*?--color-panel/.test(css));
check("and the panel opts into them", /admin-shell/.test(layout));
// One palette, whatever the trade. Colour in this panel means "selected"; a
// permanently coloured bar was competing with the one thing that needed to
// say it.
check(
  "no per-business-type palette survives",
  !/\[data-business-type="restaurant"\]\s*\{[\s\S]{0,80}--color-brand/.test(css)
);

console.log("\nSPACING IS THE DOCUMENT'S, AND STEPS DOWN ON A PHONE");
// The panel used a gutter that scaled with the window. The global design
// document gives one number instead — 30px from every edge — so the fluid
// gutter and the fluid page title are both gone rather than left unused.
check("nothing is left using the old fluid gutter", !/gutter-fluid/.test(layout + topbar));
check("the document's 30px is what the frame uses", /p-\[30px\]/.test(layout));
check(
  "the gap between sidebar and content is one margin, not two",
  /gap-\[30px\]/.test(layout),
  "30px meeting 30px is 30px; counting both gives 60 and pulls the layout apart"
);
check(
  "and it steps down below the sidebar's breakpoint",
  /max-lg:p-4/.test(layout),
  "30px of every edge of a phone is most of the phone"
);
check(
  "the body no longer steps its padding at one width",
  !/px-4[^"]*lg:px-8/.test(layout)
);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
