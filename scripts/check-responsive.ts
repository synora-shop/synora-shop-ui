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
// It used to be sticky, which it had to be while the page itself scrolled.
// Nothing outside the main container scrolls now — the header is simply the
// first row of a shell exactly one screen tall — so sticky would be a rule
// with nothing to do, and `relative` is what the glow at its bottom edge is
// positioned against.
check("the header is the top row and does not scroll away", /relative z-0 h-\[calc\(var\(--header-h\)/.test(topbar));
// It is taller than the bar it holds, and the extra strip is load-bearing: it
// is the indigo showing through behind the background block's rounded corners.
// Without it the grey meets the indigo in a straight seam, which is the
// difference between the two screens that reads first and is hardest to name.
check(
  "and it is taller than its bar by the background's corner",
  /\+var\(--radius-page\)/.test(topbar) && /h-\[var\(--header-h\)\]/.test(topbar),
  "the background overlaps the header; there has to be something behind the curve"
);
{
  const layout = readFileSync(join(process.cwd(), "app/admin/layout.tsx"), "utf8");
  check(
    "the background tucks under it",
    /-mt-\[var\(--radius-page\)\][\s\S]{0,200}rounded-t-\[var\(--radius-page\)\]/.test(layout)
  );
  check(
    "and the glow belongs to the background, not to the bar",
    /shadow-glow-page/.test(layout) && !/shadow-glow-page/.test(topbar),
    "it is the background that glows; what it lands on is the header above it"
  );
}
// The mark sits at the left of the header, where the design puts it. It was
// centred on the window for as long as the header was colourless — the centre
// was the only place it could sit without reading as a heading — and centring
// it cost two bugs: a `fixed` version that floated free when `overflow-x:
// hidden` made the bar's stickiness a no-op, and an absolute version needing a
// hand-computed offset of half a sidebar. Neither problem exists at the left.
check("the header is 80 design pixels", /h-\[var\(--header-h\)\]/.test(topbar));
check("the mark is 30", /h-\[var\(--logo-h\)\]/.test(topbar));
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
// The whole point: a literal px anywhere in the frame is the artboard leaking
// onto every other screen. Tailwind's own scale (p-2.5, gap-1) is left alone —
// those are small paddings inside a control, not drawn measurements.
check(
  "and no frame file pins a drawn measurement to literal pixels",
  (() => {
    const frame = [layout, topbar, sidebar, navbar];
    return frame.every((src) => !/(?:^|[^a-z-])(?:w|h|text|gap|px|py|p)-\[\d[\d.]*px\]/.test(src));
  })(),
  "every drawn number goes through --u"
);

console.log("\nSPACING IS THE DOCUMENT'S, AND STEPS DOWN ON A PHONE");
// The panel used a gutter that scaled with the window. The global design
// document gives one number instead — 30px from every edge — so the fluid
// gutter and the fluid page title are both gone rather than left unused.
check("nothing is left using the old fluid gutter", !/gutter-fluid/.test(layout + topbar));
check("the document's 30 is what the frame uses", /p-\[var\(--gap-lg\)\]/.test(layout));
check(
  "the gap between sidebar and content is one margin, not two",
  /gap-\[var\(--gap-lg\)\]/.test(layout),
  "30 meeting 30 is 30; counting both gives 60 and pulls the layout apart"
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
