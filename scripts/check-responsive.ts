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
const navbar = sourceOf("components", "admin", "admin-navbar.tsx");
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
// The mark is centred on the window rather than on the content column. It used
// to do that with `fixed`, and the sentence that stood here said it was "only
// safe because the bar it appears to belong to is always at the top of the
// viewport" — which was the assumption that broke. `overflow-x: hidden` on the
// page made the bar's sticky positioning a no-op, so the bar scrolled away and
// the mark stayed, floating over the page on its own. It is absolute inside
// the bar now, pulled left by half a sidebar to land on the window's centre.
check("the centred mark belongs to the bar", /absolute left-1\/2 top-0/.test(topbar));
check(
  "and is offset by half the sidebar to reach the window's centre",
  /-translate-x-\[calc\(50%\+6\.5rem\)\]/.test(topbar)
);
check("and cannot swallow clicks meant for the page", /pointer-events-none/.test(topbar));

console.log("\nTHE NAVIGATION CAN BE OPENED ON A PHONE");
check("the topbar owns the toggle", /aria-controls="admin-nav"/.test(topbar));
check("the toggle is hidden once the sidebar is visible", /lg:hidden/.test(topbar));
check("both read the same state", /useAdminNav/.test(topbar) && /useAdminNav/.test(sidebar));

console.log("\nTHE TAB ROW SCROLLS RATHER THAN WRAPPING");
// A wrapped tab row changes height as you move between sections, and
// everything below it jumps by a line.
check("the navigation bar scrolls sideways", /overflow-x-auto/.test(navbar));
check("its tabs do not break mid-label", /whitespace-nowrap/.test(navbar));
check("and it draws nothing for a section of one", /tabs\.length === 0/.test(navbar));

console.log("\nBOTH LEVELS COME FROM ONE PLACE");
check("the sidebar reads the navigation model", /@\/lib\/admin-nav"/.test(sidebar));
check("so does the navigation bar", /@\/lib\/admin-nav"/.test(navbar));
check("so does the heading bar", /@\/lib\/admin-nav"/.test(topbar));
// A hardcoded href here is how the sidebar and the bar came to disagree about
// where a section starts.
check("no screen hardcodes an admin address", !/href="\/admin\//.test(sidebar) && !/href="\/admin\//.test(navbar));

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

console.log("\nSPACING AND TYPE SCALE WITH THE WINDOW");
check("a fluid gutter is defined", /\.gutter-fluid\s*\{[^}]*clamp\(/.test(css));
check("a fluid page title is defined", /\.text-page-title\s*\{[^}]*clamp\(/.test(css));
check("the page body uses the fluid gutter", /gutter-fluid/.test(layout));
check("the topbar uses the same gutter, so they line up", /gutter-fluid/.test(topbar));
check("the heading bar uses the fluid title", /text-page-title/.test(topbar));
check(
  "the body no longer steps its padding at one width",
  !/px-4[^"]*lg:px-8/.test(layout)
);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
