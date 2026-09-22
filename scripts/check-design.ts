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
   document wrong before anybody noticed the screen had changed.
   
   Asserted against the *declarations*, not the file text. The first version
   searched the whole stylesheet, so when the palette was lightened it went on
   passing — the old values were still there, in a comment explaining that they
   had been replaced. A check that a colour is mentioned is not a check that it
   is used. */
/**
 * Source with its comments removed.
 *
 * Every probe in this file that looks for a colour or a word has to call this
 * first. Two have been written without it and both failed on the comment that
 * explained why the thing they were banning was banned — the guard reading the
 * argument for itself as a violation of itself.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
const PANEL_COLOURS: [string, string][] = [
  ["--color-shell", "#f5f5f5"],
  ["--color-panel", "#ffffff"],
  ["--color-control", "#f5f5f5"],
  ["--color-brand-500", "#5050ea"],
  ["--color-header", "#5050ea"],
  ["--color-section", "#f5f5f5"],
  ["--color-selected", "#e9e9ff"],
];
for (const [token, colour] of PANEL_COLOURS) {
  check(
    `${token} is ${colour}`,
    new RegExp(`${token}:\\s*${colour};`).test(css),
    "the panel's palette and the document have to say the same thing"
  );
  check(`${colour} is named in the design document`, design.includes(colour));
}

/* Containers are white on a near-white page, so tone cannot separate them and
   a shadow has to. Without this the panel is one flat sheet. */
check(
  "a container is lifted off the page",
  /--shadow-panel:/.test(css),
  "the page and the containers are a hair apart now; light carries the depth that tone used to"
);
check(
  "and the chrome actually uses it",
  (() => {
    const users = walk(join(ROOT, "components"))
      .concat(walk(join(ROOT, "app")))
      .filter((f) => /\.tsx$/.test(f) && readFileSync(f, "utf8").includes("shadow-panel"));
    return users.length >= 5;
  })(),
  "a token nothing applies is a token that does nothing"
);

/* A control at rest is outlined #86868b and the same control active is
   outlined #5050ea. The panel reads its own state off the edge of a control,
   so a third grey creeping in anywhere — a Tailwind border-gray-200, a one-off
   hex — breaks that reading without breaking anything a test would otherwise
   notice.

   A section's outline is not part of that pair: #2e2e2e at 0.25px, a boundary
   rather than a state, which is why it is darker, thinner and never changes. */
const RGB_86868B = "134 134 139";
check(
  "the inactive outline is #86868b",
  new RegExp(`--color-border:\\s*rgb\\(${RGB_86868B}`).test(css.slice(css.indexOf(".admin-shell {"))),
  "an element at rest is outlined #86868b; that is half of how a control says what it is"
);
check(
  "a control's own edge is the same grey, held harder",
  new RegExp(`--color-control-line:\\s*rgb\\(${RGB_86868B}`).test(css),
  "a control is the thing you aim at, so its edge is firmer — but it is not a different colour"
);
check(
  "the outline is a hairline, not a drawn border",
  (() => {
    const m = css.match(/--color-border:\s*rgb\([\d ]+\/\s*([\d.]+)\)/g) ?? [];
    return m.some((d) => {
      const a = Number(d.match(/\/\s*([\d.]+)\)/)?.[1] ?? 1);
      return a > 0 && a < 0.5;
    });
  })(),
  "depth is the shadow's job; an outline at full strength gives a container two depth cues and it reads as neither"
);
check(
  "#86868b is named in the design document",
  design.includes("#86868b")
);
check(
  "nothing outlines itself with a colour of its own",
  (() => {
    const files = walk(join(ROOT, "app/admin"))
      .concat(walk(join(ROOT, "components/admin")))
      .filter((f) => /\.tsx$/.test(f));
    return files.every((f) => {
      const src = readFileSync(f, "utf8");
      return !/border-(?:gray|slate|zinc|neutral|stone)-\d{2,3}|border-\[#/.test(src)
        && !/outline-(?:gray|slate|zinc|neutral|stone)-\d{2,3}|outline-\[#/.test(src);
    });
  })(),
  "the two outline colours are tokens; a hardcoded one is a third state nobody asked for"
);
check(
  "the active outline is one colour everywhere",
  (() => {
    const files = walk(join(ROOT, "app/admin"))
      .concat(walk(join(ROOT, "components/admin")))
      .filter((f) => /\.tsx$/.test(f));
    // brand-700 was used on the refresh button because its *fill* is brand-500;
    // the outline sits 2px outside it, on the page, where brand-500 is visible.
    return files.every((f) => !/outline-brand-(?!500)/.test(readFileSync(f, "utf8")));
  })(),
  "focus is #5050ea; a second shade of it is a second meaning"
);

/* #6666ff was the active colour until 22 September and left the palette with
   the global design document. Two indigos one step apart is a distinction
   nobody can make, so there is one — and a stray #6666ff anywhere in the panel
   would be the old one growing back where nothing would notice. */
check(
  "#6666ff is gone from the panel",
  (() => {
    // Comments stripped first, and that is not a detail. The palette guard and
    // the manifest guard have each failed on the sentence explaining them —
    // a probe that reads prose is testing the documentation, not the code.
    const files = walk(join(ROOT, "app/admin"))
      .concat(walk(join(ROOT, "components/admin")))
      .filter((f) => /\.tsx?$/.test(f));
    const shell = stripComments(css.slice(css.indexOf(".admin-shell {")));
    return (
      !/#6666ff/i.test(shell) &&
      files.every((f) => !/#6666ff/i.test(stripComments(readFileSync(f, "utf8"))))
    );
  })(),
  "active is #5050ea everywhere now — see docs/PANEL.md §6"
);
/* The same colour written the other way.
 *
 * The first version of this guard looked for the hex and passed while the
 * attention ring's halo was rgb(102 102 255) — spelled out in a keyframe,
 * outside .admin-shell, so neither half of the search reached it. It shipped,
 * and drew a #6666ff halo around a #5050ea border.
 *
 * Anything that wants the brand takes it from the token. A literal is a value
 * that cannot follow the scope it is used in, which is what went wrong. */
check(
  "and is not spelled out as rgb either",
  (() => {
    const clean = stripComments(css);
    // Inside .admin-shell, and inside any @keyframes or reduced-motion block.
    //
    // Those last two are where it actually went wrong: a keyframe has no
    // scope, so a literal in one is the same colour in the panel, the
    // storefront and the marketing site at once — which is how a #6666ff halo
    // ended up around a #5050ea border, and how the reduced-motion ring, the
    // only indicator some people get, ended up the wrong indigo.
    //
    // .sd-mark is left alone deliberately: it is the Synora Digitals mark in
    // the marketing footer, its colour was asked for by name, and it is not
    // the panel.
    // The rule block itself, not everything up to the next scope in the file.
    // Slicing by file position put .sd-mark — which sits between the two —
    // inside "the panel", and the guard failed on a colour that is not the
    // panel's. Where a rule sits in a file is not what scopes it.
    const shell = (clean.match(/\.admin-shell\s*\{[\s\S]*?\n\}/) ?? [""])[0];
    const blocks = clean.match(/@(?:keyframes|media)[^{]*\{[\s\S]*?\n\}/g) ?? [];
    return (
      !/rgb\(\s*102\s+102\s+255/.test(shell) &&
      blocks.every((b) => !/rgb\(\s*102\s+102\s+255/.test(b))
    );
  })(),
  "the brand comes from --color-brand-500 so it follows whatever scope it is in"
);

/* The header is flat. What lightens it in the drawing is the page's own white
   glow falling across it, which is a different thing that behaves differently:
   a painted gradient would not move when the content beneath it does. */
/* The header, measured off the artboard rather than guessed.
 *
 * Every one of these was wrong by eye and is now read from APP themes.ai's own
 * content stream: the search field was a translucent tint at 360 wide, the
 * avatar was a black circle with initials and a status dot, and the bell was
 * lucide's with a red mark pinned to the corner of its button. */
{
  const topbarSrc = stripComments(
    readFileSync(join(ROOT, "components/admin/admin-topbar.tsx"), "utf8")
  );
  const declared = (css.match(/\.admin-shell\s*\{[\s\S]*?\n\}/) ?? [""])[0];
  check("the search field is #0c0c4a", /--color-header-field:\s*#0c0c4a/.test(declared));
  check("and it is 390.5 wide by 50", /390\.5\*var\(--u\)/.test(topbarSrc));
  check("the avatar is #aa4cc1", /--color-avatar:\s*#aa4cc1/.test(declared));
  check(
    "and a rounded square rather than a circle",
    /--radius-avatar:\s*37\.15%/.test(declared) &&
      /rounded-\[var\(--radius-avatar\)\]/.test(topbarSrc) &&
      !/rounded-full[^"]*var\(--color-avatar\)/.test(topbarSrc)
  );
  // The initials belong on it. The drawing shows an empty plate because a
  // drawing has no store to name — reading that absence as a decision is how
  // they came off in the first place.
  check("it carries the store's initials", /initials\(storeName\)/.test(topbarSrc));
  check(
    "and no status dot",
    !/ring-ink/.test(topbarSrc),
    "that one really was invented; whether the store is live is said in words in the menu, where it can be acted on"
  );
  check(
    "the bell is the drawn one",
    /<NotificationIcon/.test(topbarSrc) && !/<Bell/.test(topbarSrc),
    "there is no bell in Assestz — it is read out of the artboard, and lucide's is a different drawing"
  );
  check(
    "and its mark is green, inside the glyph",
    /--color-unread:\s*#39b54a/.test(declared) &&
      /circle[^>]*var\(--color-unread\)/.test(
        readFileSync(join(ROOT, "components/admin/nav-icons.tsx"), "utf8")
      ),
    "a dot pinned to the button's corner is a different place at every scale"
  );
  check(
    "the background's corner is the drawn 24.4, not a guess",
    /--radius-page:[^;]*24\.4/.test(declared)
  );
}

/* Every radius and every light, read off the artboard's vector paths.
 *
 * These were judged by eye and most were wrong: containers at 16 where the
 * drawing says 20, sections at 16 where it says 25.6, and the store card at 16
 * where it says 46. The shadows were worse — the document's "10% opacity,
 * 10px blur" is an Illustrator outer glow, which spreads that 10% across the
 * whole blur, while a CSS box-shadow's alpha is the value *at the edge*.
 * Sampling the drawing one pixel outside a container gives 5/245, gone by
 * sixteen. Every container was carrying about five times the shadow it was
 * drawn with, and the store card was carrying a 45% drop shadow the drawing
 * does not have at all. */
{
  const declared = (css.match(/\.admin-shell\s*\{[\s\S]*?\n\}/) ?? [""])[0];
  const drawn: [string, string][] = [
    ["--radius-container", "20"],
    ["--radius-section", "25.6"],
    ["--radius-card", "46"],
    ["--radius-plate", "12.5"],
    ["--radius-thumb", "16.36"],
    ["--radius-row-button", "18.75"],
    ["--row-button-h", "47"],
  ];
  for (const [token, value] of drawn) {
    check(
      `${token} is the drawn ${value}`,
      new RegExp(`${token}:[^;]*${value.replace(".", "\\.")}`).test(declared),
      "measured off the artboard, not judged by eye"
    );
  }
  check(
    "the container glow is the light the drawing casts, not the document's arithmetic",
    /--shadow-container:[^;]*0\.0[45]\)/.test(declared),
    "Illustrator spreads its 10% across the blur; a box-shadow puts it at the edge"
  );
  check(
    "and the store card has no drop shadow of its own",
    /--shadow-card:\s*var\(--shadow-container\)/.test(declared),
    "sampling below the card in the drawing returns the page colour at one pixel out and at forty"
  );
}

check(
  "the header is one flat colour, not a gradient",
  (() => {
    const topbar = stripComments(
      readFileSync(join(ROOT, "components/admin/admin-topbar.tsx"), "utf8")
    );
    return /bg-header/.test(topbar) && !/gradient/i.test(topbar);
  })(),
  "the lightening is --glow-page, not a fill"
);
check(
  "the three lights the document specifies are all declared",
  /--shadow-container:/.test(css) && /--shadow-section:/.test(css) && /--glow-page:/.test(css)
);
check(
  "and all three are actually applied to something",
  (() => {
    const src = walk(join(ROOT, "app/admin"))
      .concat(walk(join(ROOT, "components/admin")))
      .filter((f) => /\.tsx$/.test(f))
      .map((f) => readFileSync(f, "utf8"))
      .join("");
    // By the class each one is reached through, not by the variable name —
    // the variable being present in a file proves nothing about whether any
    // element wears it.
    return ["shadow-container", "shadow-section", "shadow-glow-page"].every((c) =>
      src.includes(c)
    );
  })(),
  "--glow-page was declared, documented, and used by nothing for a day"
);

/* A class Tailwind never generated.
 *
 * `@theme inline` is what makes a utility exist. A --color-* declared in
 * .admin-shell is a variable and nothing more; `bg-x` is generated only for the
 * names registered in that block.
 *
 * Six tokens were added on 22 September without being registered — header,
 * selected, section, section-line and the two shadows — so bg-header,
 * bg-selected, bg-section, border-section-line, shadow-container and
 * shadow-section were classes that did not exist. Every element wearing one got
 * no style at all: the header was not indigo, active rows had no plate, and a
 * section was white with a hard black border instead of #f5f5f5 with a
 * hairline. Nothing errored, no check failed, and it took a screenshot from the
 * merchant to find.
 *
 * So: every token the panel declares must be registered, and this fails on the
 * one that is not. */
check(
  "every panel token is registered as a Tailwind utility",
  (() => {
    const shellBlock = (css.match(/\.admin-shell\s*\{[\s\S]*?\n\}/) ?? [""])[0];
    const themeBlock = (css.match(/@theme inline\s*\{[\s\S]*?\n\}/) ?? [""])[0];
    const declared = Array.from(
      shellBlock.matchAll(/(--(?:color|shadow)-[a-z0-9-]+)\s*:/g)
    ).map((m) => m[1]);
    const missing = declared.filter((t) => !themeBlock.includes(`var(${t})`));
    if (missing.length) console.log(`        ${missing.join(", ")}`);
    return declared.length > 0 && missing.length === 0;
  })(),
  "a utility Tailwind never generated is a style that silently does nothing"
);

/* One typeface, loaded one way.
   
   DM Sans, because the design files are drawn in it — the panel and the
   drawings have to measure the same or a number taken off one does not apply
   to the other.
   
   Loaded through next/font rather than a <link> to a font CDN: next fetches it
   at build time and serves it from this app's own domain, so no request leaves
   for someone else's server and nothing about a merchant's visit is told to
   one. A stylesheet link to fonts.googleapis.com would undo that quietly. */
{
  const layout = readFileSync(join(ROOT, "app/layout.tsx"), "utf8");
  check("the typeface is DM Sans", /DM_Sans\(/.test(layout));
  check("and the figures are DM Mono", /DM_Mono\(/.test(layout));
  check(
    "the whole variable font is loaded, not a few cut weights",
    /weight:\s*"variable"/.test(layout),
    "the panel asks for 500 in 278 places and 600 in 136; a packaged subset is how one of those gets synthesised"
  );
  check(
    "with the optical size axis",
    /axes:\s*\["opsz"\]/.test(layout),
    "13px labels and 30px headings want different drawings of the same face"
  );
  check(
    "no font is fetched from somebody else's server",
    !/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(
      readFileSync(join(ROOT, "app/globals.css"), "utf8") + layout
    ),
    "next/font serves it from this domain; a CDN link tells a third party who visited a merchant's shop"
  );
}

/* What colour a phone paints around the status bar.
   
   The manifest decides it, and nothing on any screen does — which is how it
   went unnoticed that it was still #4c100f, a maroon from a palette this
   product stopped using and one that belongs to a different business. Every
   check passed and every screen was right; the strip above the page was
   maroon on a phone for as long as nobody opened it on one.
   
   Held to the panel's own ground, because the manifest's start_url is the
   panel. A site that wants different chrome declares its own themeColor —
   see app/(platform)/layout.tsx. */
{
  const manifest = readFileSync(join(ROOT, "app/manifest.ts"), "utf8");
  check(
    "the installed app is painted in the panel's own colour",
    /theme_color:\s*"#f5f5f5"/.test(manifest) && /background_color:\s*"#f5f5f5"/.test(manifest),
    "a phone paints its chrome from this, and no screen shows it"
  );
  // Declarations, not file text. The first version searched the whole file
  // and failed on the comment that explains why #4c100f is banned — the same
  // trap the panel's palette check fell into, and for the same reason: a
  // colour being *mentioned* is not a colour being used.
  check(
    "no retired palette declared in the manifest",
    !/(?:theme_color|background_color):\s*"(?:#4c100f|#f8f5f1)"/.test(manifest),
    "#4c100f is not this product's colour"
  );
  check(
    "and it calls the product by its name",
    /name:\s*"APP by Synora Digitals"/.test(manifest) && !/Shop Admin/.test(manifest),
    "it said Shop Admin, which the naming guard never looked at"
  );
  // The marketing site opens and closes on night, so a light strip above it
  // reads as a different page bolted on top.
  const platform = readFileSync(join(ROOT, "app/(platform)/layout.tsx"), "utf8");
  check(
    "the front page declares its own chrome colour",
    /themeColor:\s*"#0c0c1e"/.test(platform),
    "otherwise it inherits the panel's light one from the manifest"
  );
}

/* Text is black now, and the greys under it are neutral. Against true black a
   navy-tinted grey reads as purple rather than as quieter text. */
check("body text is black", /--color-ink:\s*#000000;/.test(css));
check("and the panel's own text matches it", /--color-control-ink:\s*#000000;/.test(css));
for (const [token, colour] of [["--color-ink-soft", "#454545"], ["--color-ink-faint", "#707070"]] as [string, string][]) {
  check(
    `${token} is a neutral grey`,
    new RegExp(`${token}:\\s*${colour};`).test(css),
    "a tinted grey beside pure black reads as a colour, not as quieter text"
  );
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

/* -------------------------------------------------------------------------- */
/* The documents point at things that exist                                   */
/* -------------------------------------------------------------------------- */

// Every path a document names in backticks, checked. Documentation that names
// a file which has moved is worse than none: it sends the next person to the
// wrong place with confidence. Deliberate references to *deleted* files are
// exempt by name — the renaming layer is described as gone, and check 103
// asserts it stays gone.
{
  const DELETED_ON_PURPOSE = new Set(["lib/themes/vocabulary.ts"]);
  const DOCS = [
    "README.md",
    "docs/DESIGN.md",
    "docs/ARCHITECTURE.md",
    "docs/FLOWS.md",
    "docs/CHECKS.md",
    "docs/QUEUE.md",
    "docs/SESSION-2026-09-07.md",
    "scripts/sweep/README.md",
  ];

  const REF = /`((?:docs|scripts|lib|components|app|prisma)\/[\w./()\[\]-]+\.(?:ts|tsx|mjs|md|sql|prisma))`/g;

  for (const rel of DOCS) {
    const full = join(ROOT, rel);
    check(`${rel} exists`, existsSync(full));
    if (!existsSync(full)) continue;

    const text = readFileSync(full, "utf8");
    const missing = [...text.matchAll(REF)]
      .map((m) => m[1])
      .filter((path) => !DELETED_ON_PURPOSE.has(path) && !existsSync(join(ROOT, path)));

    check(
      `${rel} only points at files that exist`,
      missing.length === 0,
      [...new Set(missing)].join(", ")
    );
  }

  // Every guard is listed, and every listing is a guard.
  //
  // The assertion *counts* in that document are a snapshot and will drift —
  // saying so is honest, and asserting them would fail the build every time
  // somebody added a check. The list is what must not drift: a guard added and
  // never written down is one nobody knows exists, and a guard named in the
  // document but deleted from package.json sends the next person looking for
  // something that is not there.
  {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const scripts: string[] = Object.keys(pkg.scripts ?? {})
      .filter((k) => k.startsWith("check:"))
      .sort();
    const checksDoc = readFileSync(join(ROOT, "docs/CHECKS.md"), "utf8");

    for (const name of scripts) {
      check(
        `docs/CHECKS.md lists ${name}`,
        checksDoc.includes(`\`${name}\``),
        "a guard nobody has written down is one nobody knows exists"
      );
    }

    const listed = [...checksDoc.matchAll(/`(check:[\w-]+)`/g)].map((m) => m[1]);
    for (const name of [...new Set(listed)]) {
      check(
        `${name} is a script that exists`,
        scripts.includes(name),
        "docs/CHECKS.md names a guard package.json does not have"
      );
    }
  }

  // The day records are the reasons behind the diff. Losing one loses the why.
  const records = readdirSync(join(ROOT, "docs")).filter((f) => /^SESSION-/.test(f));
  check("at least one day record is kept", records.length >= 1);
  check(
    "the README points at every day record",
    records.every((f) => readFileSync(join(ROOT, "README.md"), "utf8").includes(f)),
    records.filter((f) => !readFileSync(join(ROOT, "README.md"), "utf8").includes(f)).join(", ")
  );
}

/*
 * A heading inside a paragraph.
 *
 * `CardTitle` renders an `<h2>`, and an `<h2>` inside a `<p>` is invalid HTML.
 * The browser reparents it, so the server's tree and the client's stop matching
 * and React throws a hydration error on every load — which is invisible until
 * somebody opens the console, and then breaks the whole screen's interactivity.
 * Cost one screen a day to find; costs one regex to keep out.
 */
{
  const offenders = walk(join(ROOT, "components"))
    .concat(walk(join(ROOT, "app")))
    .filter((f) => /\.tsx$/.test(f))
    .filter((f) => {
      const src = readFileSync(f, "utf8");
      // A <p ...> whose next non-blank line opens a CardTitle or a heading tag.
      return /<p[^>]*>\s*\n\s*<(CardTitle|h[1-6])\b/.test(src);
    })
    .map((f) => f.replace(ROOT + "/", ""));

  check(
    "no heading is nested inside a paragraph",
    offenders.length === 0,
    offenders.join(", ") || "an h2 inside a p is a hydration error on every load"
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
