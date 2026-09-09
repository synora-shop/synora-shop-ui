/**
 * Checks the guided route out of a refusal — `npm run check:spotlight`.
 *
 * A merchant who tries to change what their store sells is told to pause it
 * first. That is true and useless on its own, because the pause button is on
 * another screen under a heading they have never opened. So the refusal
 * carries a link, the link lights the control up on arrival, and pausing
 * offers the holding page it has just put in front of every customer.
 *
 * Three chains, and each has a way of quietly coming apart:
 *
 *   The link goes nowhere useful. It points at a path and a target name; if
 *   either drifts, the merchant lands on the right screen with nothing
 *   highlighted and no idea they were meant to be shown something.
 *
 *   The hint is offered when it cannot help. A closed or suspended store is
 *   refused for a reason pausing does not fix, so pointing at the pause button
 *   would send someone to press a control that changes nothing.
 *
 *   The loudest animation in the product spreads. `.attention` works because
 *   it is rare — five seconds of a control growing and pulsing, in answer to
 *   "where?". A second user of it turns an answer into decoration.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { SPOTLIGHT_MS, SPOTLIGHT_PARAM, SPOTLIGHT_TARGETS, spotlightHref } from "../lib/spotlight";
import { typeSwitchGate } from "../lib/store-type-switch";

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

// ---------------------------------------------------------------------------
// The gate decides, and it decides the same thing in both places
// ---------------------------------------------------------------------------

check("an open store cannot change type", !typeSwitchGate("ACTIVE").allowed);
check("a trialling store cannot either", !typeSwitchGate("TRIAL").allowed);
check("a paused store can", typeSwitchGate("PAUSED").allowed);

for (const status of ["ACTIVE", "TRIAL", "PAST_DUE"] as const) {
  const gate = typeSwitchGate(status);
  check(
    `${status} is offered the pause route`,
    !gate.allowed && gate.canPause,
    "pausing is what would unblock it, so the refusal must say where"
  );
}

for (const status of ["CLOSED", "SUSPENDED"] as const) {
  const gate = typeSwitchGate(status);
  check(
    `${status} is not offered the pause route`,
    !gate.allowed && !gate.canPause,
    "pausing does not fix either, and pointing at the button would send someone to press a control that changes nothing"
  );
}

// ---------------------------------------------------------------------------
// The link, and what it lands on
// ---------------------------------------------------------------------------

const dialog = read("components/admin/business-type-dialog.tsx");
const lifecycle = read("components/admin/store-lifecycle.tsx");

check(
  "the refusal builds its link with spotlightHref",
  /spotlightHref\("\/admin\/theme", "pause"\)/.test(dialog),
  "hand-writing the query string is how the two halves drift apart"
);
check(
  "the link is only shown when pausing would help",
  /gate\.canPause &&/.test(dialog),
  "it must sit behind the same condition the gate decides"
);
check(
  "the href it produces is the one the theme screen reads",
  spotlightHref("/admin/theme", "pause") === `/admin/theme?${SPOTLIGHT_PARAM}=pause`
);
check("the pause target is declared", "pause" in SPOTLIGHT_TARGETS);

check(
  "the pause button asks to be spotlit",
  /useSpotlight<HTMLButtonElement>\("pause"\)/.test(lifecycle)
);
check(
  "and the ref actually reaches the button",
  /ref=\{pauseRef\}/.test(lifecycle),
  "a hook whose ref is never attached highlights nothing and says nothing about it"
);

// ---------------------------------------------------------------------------
// Pausing offers the page it has just put in front of customers
// ---------------------------------------------------------------------------

check(
  "the pause confirmation names the holding page",
  /holding page/.test(lifecycle),
  "a merchant who does not know a page exists will never edit it"
);
check(
  "it offers a third answer that goes on to edit it",
  /also: \{ label: "Pause and edit the page" \}/.test(lifecycle)
);
check(
  "cancelling pauses nothing",
  /if \(choice === "cancel"\) return;/.test(lifecycle)
);
check(
  "the trip to the editor only happens if the pause worked",
  /choice === "also" \? "\/admin\/maintenance" : undefined/.test(lifecycle) &&
    /if \(!result\.ok\)/.test(lifecycle),
  "otherwise a merchant edits a page nobody is being shown"
);

const confirmDialog = read("components/ui/confirm-dialog.tsx");
check(
  "the third button is a button, not a link",
  !/<Link|href=/.test(confirmDialog),
  "a link inside a confirmation navigates away and abandons what was being confirmed"
);

// ---------------------------------------------------------------------------
// The hint fires once, cleans up after itself, and stays rare
// ---------------------------------------------------------------------------

const hook = read("components/admin/use-spotlight.ts");
check("it scrolls the control into view", /scrollIntoView/.test(hook));
check("centred, not merely on screen", /block: "center"/.test(hook));
check(
  "it removes the parameter afterwards",
  /searchParams\.delete\(SPOTLIGHT_PARAM\)/.test(hook),
  "left in the URL, a reload replays a hint about a job already done"
);
check(
  "with replaceState, not the router",
  /history\.replaceState/.test(hook),
  "a router navigation would re-render the tree and interrupt the animation it just started"
);
check(
  "it reads the parameter once, on arrival",
  /askedOnArrival/.test(hook) && /\}, \[\]\);/.test(hook),
  "an effect that re-runs when the parameter clears strips the class off a control mid-animation"
);
check(
  "the class comes off on unmount as well as on the timer",
  /lit\?\.classList\.remove\("attention"\)/.test(hook),
  "cancelling only the timer leaves one control outlined for the life of the screen"
);
check(
  "reduced motion gets an instant scroll",
  /prefers-reduced-motion/.test(hook),
  "a long smooth scroll is not the consolation prize for asking for less movement"
);

const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");

/** Duration × iteration count for one `animation:` shorthand. */
function runsFor(name: string): number | null {
  const decl = new RegExp(`animation: ${name} (\\d+)ms [^;]*;`).exec(css);
  if (!decl) return null;
  const ms = Number(decl[1]);
  const count = /\s(\d+)\s/.exec(decl[0]);
  return ms * (count ? Number(count[1]) : 1);
}

const held = runsFor("shp-attention");
check("the attention animation declares its length", held !== null);
if (held !== null) {
  check(
    "the animation and the class timer are the same length",
    Math.abs(held - SPOTLIGHT_MS) < 50,
    `the CSS runs ${held}ms, SPOTLIGHT_MS is ${SPOTLIGHT_MS}ms — a shorter timer cuts it off, a longer one holds a finished highlight`
  );
}

// The two halves do different jobs, and the difference is the whole design.
const ping = runsFor("shp-attention-ping");
check("there is a sweep as well as a ring", ping !== null, "motion catches the eye; the ring answers the question");
if (ping !== null && held !== null) {
  check(
    "the sweep finishes before the ring does",
    ping <= held,
    `sweep ${ping}ms, ring ${held}ms — a sweep still going when the mark has gone is pointing at nothing`
  );
}
check(
  "the sweep is drawn around the control, not on it",
  /\.attention::after\s*\{[\s\S]{0,700}pointer-events: none/.test(css),
  "it sits over the control, which still has to be clickable"
);

/*
 * The control itself does not move.
 *
 * The first version of this animation scaled the button — 1.08, 0.98, 1.05,
 * three times. On a pill that is a wobble rather than a pointer: the label
 * distorts, the shape stops matching its neighbours, and a control that is
 * changing size is harder to fix the eye on, not easier. The rewrite moves a
 * halo around the control and leaves the control alone, and this is the
 * assertion that keeps it that way.
 */
const attentionBlock = /@keyframes shp-attention \{[\s\S]*?\n\}/.exec(css);
check(
  "reduced motion keeps the ring and drops the sweep",
  /\.attention \{[\s\S]{0,200}box-shadow/.test(css.slice(css.indexOf("prefers-reduced-motion"))) &&
    /\.attention::after \{[\s\S]{0,120}(animation: none|display: none)/.test(css),
  "the ring was never the moving part, so it is the part that survives"
);
check(
  "the highlighted control is never scaled",
  attentionBlock !== null && !/transform:\s*scale/.test(attentionBlock[0]),
  "scaling a button distorts its label and reads as a glitch"
);

// It has to stay the only one.
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

/** Source with its comments removed, so prose about attention is not code. */
function code(file: string): string {
  return readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

// Only the class actually being applied counts: added to a classList, or
// written into a className. The first version of this matched the word
// anywhere and reported a comment on the analytics screen about a number
// competing for attention.
const users = [...walk(join(ROOT, "components")), ...walk(join(ROOT, "app"))].filter((f) => {
  const src = code(f);
  return (
    /classList\.(add|remove|toggle)\(\s*"attention"/.test(src) ||
    /className=(?:"[^"]*\battention\b|\{[^}]*"[^"]*\battention\b)/.test(src)
  );
});
const allowed = new Set(["components/admin/use-spotlight.ts"]);
for (const file of users) {
  const rel = relative(ROOT, file);
  check(
    `${rel} does not use .attention directly`,
    allowed.has(rel),
    "it is the loudest thing in the product and only works while it is rare — go through useSpotlight, and add a target to lib/spotlight.ts"
  );
}
check("only one file plays it", users.length <= 1, `${users.length} do`);
check("the number of targets is still small", Object.keys(SPOTLIGHT_TARGETS).length <= 3);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
