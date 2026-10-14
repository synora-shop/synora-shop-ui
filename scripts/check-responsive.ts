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

console.log("\nTHE RAIL IS A DRAWER ON A PHONE AND A COLUMN ON A DESKTOP");
// New admin (15 October): the black rail. On a phone it is a full-screen
// drawer the top bar opens; from lg it is a column that stays put while the
// sheet beside it scrolls.
check("a drawer below lg", /id="admin-nav" className="fixed inset-0[^"]*lg:hidden/.test(sidebar));
check("a column from lg", /<aside[\s\S]{0,120}sticky top-0 hidden h-dvh[^"]*lg:block/.test(sidebar));
check("the drawer is named so the toggle can point at it", /id="admin-nav"/.test(sidebar));
// It folds to icons on a desktop, and remembers that in this browser rather
// than on the server: a preference about one screen is not the shop's.
check("the rail can fold to icons", /w-\[4\.5rem\]/.test(sidebar) && /w-\[15\.5rem\]/.test(sidebar));
check("and the fold is remembered in this browser", /localStorage/.test(sidebar) && /useSyncExternalStore/.test(sidebar));
check("and nothing else stores it", !/collapsed|folded/i.test(store));

console.log("\nONLY ONE THING IS PINNED TO THE TOP OF THE SHEET");
const sidebarTopBars = (sidebar.match(/fixed[^"]*top-0/g) ?? []).length;
check("the rail declares no bar of its own", sidebarTopBars === 0, `found ${sidebarTopBars}`);
{
  const layout = readFileSync(join(process.cwd(), "app/admin/layout.tsx"), "utf8");
  check(
    "the top bar stays over the page as it scrolls",
    /<header className="sticky top-0 z-30/.test(topbar),
    "a merchant deep in a long list still needs search, Create and the account"
  );
  check(
    "and carries an opaque fill",
    /<header[^>]*bg-white /.test(topbar) && !/<header[^>]*backdrop-blur/.test(topbar),
    "a blurred bar makes a containing block, and the search overlay inside it would be trapped in the bar"
  );
  check(
    "the window is one screen tall and the sheet is what scrolls",
    /h-screen overflow-hidden/.test(layout) && /overflow-y-auto/.test(layout)
  );
  check(
    "the save bar sits under the top bar, not over it",
    /sticky top-\[3\.6rem\] z-20/.test(readFileSync(join(process.cwd(), "components/admin/editor-bar.tsx"), "utf8"))
  );
}

console.log("\nTHE NAVIGATION CAN BE OPENED ON A PHONE");
check("the topbar owns the toggle", /aria-controls="admin-nav"/.test(topbar));
check("the toggle is hidden once the sidebar is visible", /lg:hidden/.test(topbar));
check("both read the same state", /useAdminNav/.test(topbar) && /useAdminNav/.test(sidebar));

console.log("\nTHE RAIL HOLDS ITS ROWS");
check("a rail label does not break mid-word", /truncate/.test(sidebar));
check("and the rail can scroll if it ever outgrows the screen", /overflow-y-auto/.test(sidebar));

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

console.log("\nTHE DRAWING SCALES; IT IS NOT PINNED TO 1920");
// The panel is drawn on a 1920 x 1080 artboard and every number in the design
// document is a number on that artboard. Written as literal pixels they are
// right on that one screen and wrong on every other — reported from a 13"
// MacBook, whose browser is about 1470 x 830, where a 260px sidebar takes 18%
// of the width instead of the 13.5% it was drawn as.
//
// --u is one pixel of the drawing. Everything is expressed in it, so the panel
// is the same composition at any size rather than a fixed drawing with the
// furniture sliding about inside it.
check("one design pixel is defined", /--u:\s*clamp\(/.test(css));
check(
  "it reads both axes, not just the width",
  /--u:[^;]*100vw \/ 1920[^;]*100vh \/ 1080/.test(css),
  "scaling on width alone fits the columns and pushes the last section off a short window"
);
check(
  "it is allowed to scale up as well as down",
  (() => {
    const m = css.match(/--u:\s*clamp\(([^,]+),[\s\S]*?,\s*([^)]+)\)\s*;/);
    if (!m) return false;
    return parseFloat(m[1]) < 1 && parseFloat(m[2]) > 1;
  })(),
  "a larger display should get the drawing larger — the design is a proportion, not a maximum"
);
check("the frame's measurements are named once", /--sidebar-w:\s*calc\(260 \* var\(--u\)\)/.test(css));
// The new admin's frame (15 October) is drawn in fixed sizes, not scaled
// off the 1920 artboard: the rail is 15.5rem, the type is the design's own.
// What must still hold is that it steps down on a phone rather than keeping
// a desktop's margins on a 390px screen.
console.log("\nSPACING STEPS DOWN ON A PHONE");
check("nothing is left using the old fluid gutter", !/gutter-fluid/.test(layout + topbar));
check(
  "the page's padding steps down below the rail's breakpoint",
  /p-4 sm:p-6 lg:p-8/.test(layout),
  "a desktop's 32px of every edge is most of a phone"
);
check("so does the top bar's", /px-4[^"]*sm:px-6/.test(topbar));
check(
  "the content has a reading width",
  /max-w-\[76rem\]/.test(layout),
  "a table stretched across a 2560px display is a table nobody can follow along a row"
);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
