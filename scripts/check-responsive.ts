/**
 * Checks the admin chrome adapts across widths — run with `npm run check:responsive`.
 *
 * Two failures live here, and both are the kind nobody notices in review
 * because the page looks correct at the one width the author had open.
 *
 * The first is a layout that steps once. The admin was written against `sm:`
 * and `lg:` only: below 1024px a drawer, above it a 15rem sidebar, and nothing
 * after that. A 1080px window and a 2560px one got identical treatment. The
 * width a laptop actually lands at once a browser sidebar is open is right in
 * the middle of that dead zone, so opening Safari's sidebar squeezed the page
 * instead of letting it reflow.
 *
 * The second is two things pinned to the top of the same viewport. The sidebar
 * carried its own fixed bar holding the only control that opened the
 * navigation drawer; the topbar was sticky at the same offset and a layer
 * above, and painted straight over it. The button rendered, passed every type
 * and lint check, and could not be reached on a phone.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (...p: string[]) => readFileSync(join(root, ...p), "utf8");

/** Source with comments stripped, so prose about a rule never satisfies it. */
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

console.log("\nTHE SIDEBAR SHOWS ITS LABELS UNLESS ASKED NOT TO");
check("a drawer below lg", /-translate-x-full/.test(sidebar));
check("the labelled sidebar is the default width", /lg:w-60/.test(sidebar));
check("a rail width exists for when it is collapsed", /lg:w-\[4\.5rem\]/.test(sidebar));
// The rail was briefly automatic, between lg and xl. A laptop window sits in
// that band most of the time, so the labels disappeared during ordinary work
// with no control to bring them back. Width must not decide this.
check("no breakpoint hides the labels by itself", !/xl:not-sr-only/.test(sidebar));
check("the width comes from the stored choice", /collapsed \? "lg:w-\[4\.5rem\]" : "lg:w-60"/.test(sidebar));
check("the store starts expanded", /collapsed: false/.test(store));
check(
  "a collapsed label is still announced, not removed",
  // sr-only keeps the text for a screen reader; `hidden` would strip the only
  // name an icon-only link has.
  /lg:sr-only/.test(sidebar) && !/railed\("lg:hidden"\)\}>\{item\.label\}/.test(sidebar)
);
check("icons centre themselves once collapsed", /lg:justify-center/.test(sidebar));
check("group headings give way to a rule once collapsed", /lg:border-t/.test(sidebar));

console.log("\nCOLLAPSING IS A CHOICE, AND IT IS REMEMBERED");
check("there is a control", /aria-label=\{collapsed \? "Expand navigation" : "Collapse navigation"\}/.test(sidebar));
check("the control is desktop-only", /lg:flex/.test(sidebar));
check("the choice is written down", /localStorage\.setItem/.test(store));
check("and read back after mount, not during render", /useEffect\(\(\) => \{\s*setCollapsed\(readCollapsedPreference\(\)\)/.test(sidebar));
// Private browsing and blocked site data both throw on localStorage. Losing a
// preference is acceptable; failing to render the admin is not.
check("storage failures cannot break the panel", /try \{[\s\S]{0,200}localStorage[\s\S]{0,200}\} catch/.test(store));

console.log("\nONLY ONE THING IS PINNED TO THE TOP OF THE VIEWPORT");
// The topbar is the one bar. Anything else fixed at top-0 in the admin chrome
// is either hidden underneath it or hiding it.
const sidebarTopBars = (sidebar.match(/fixed[^"]*top-0/g) ?? []).length;
check("the sidebar declares no bar of its own", sidebarTopBars === 0, `found ${sidebarTopBars}`);
check("the topbar is the sticky one", /sticky top-0/.test(topbar));

console.log("\nTHE NAVIGATION CAN BE OPENED ON A PHONE");
check("the topbar owns the toggle", /aria-controls="admin-nav"/.test(topbar));
check("the toggle is hidden once the sidebar is visible", /lg:hidden/.test(topbar));
check("the drawer is what it points at", /id="admin-nav"/.test(sidebar));
check(
  "both read the same state",
  /useAdminNav/.test(topbar) && /useAdminNav/.test(sidebar)
);

console.log("\nSPACING AND TYPE SCALE WITH THE WINDOW");
check("a fluid gutter is defined", /\.gutter-fluid\s*\{[^}]*clamp\(/.test(css));
check("a fluid page title is defined", /\.text-page-title\s*\{[^}]*clamp\(/.test(css));
check("the page body uses the fluid gutter", /gutter-fluid/.test(layout));
check("the topbar uses the same gutter, so they line up", /gutter-fluid/.test(topbar));
check(
  "the body no longer steps its padding at one width",
  !/px-4[^"]*lg:px-8/.test(layout)
);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
