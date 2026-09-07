/**
 * Checks the panel's motion is safe and is actually used — `npm run check:motion`.
 *
 * Motion in this product reports; it does not decorate. Two ways that goes
 * wrong, and both are invisible until someone is hurt by them:
 *
 *   A merchant who has asked their system for less movement is shown nothing.
 *   Every animation here starts from opacity 0, zero height, or both. Turning
 *   the animation off without restoring the resting state does not calm the
 *   interface down — it deletes the error message, the dialog and the toast
 *   outright, for exactly the people least able to work out what happened.
 *
 *   An error nobody can hear. Seventeen screens had written their own error
 *   paragraph and most carried no `role`, so a screen reader announced
 *   nothing at all: the save appeared to do nothing, twice, forever. They all
 *   go through FieldError now, and this stops them coming back.
 *
 * What is checked:
 *
 *   1. Every animation class in globals.css is named in a
 *      `prefers-reduced-motion` block.
 *   2. Every class whose keyframes start hidden is restored to visible there.
 *   3. No screen hand-writes an error paragraph instead of using FieldError.
 *   4. The toast's exit timer matches the CSS animation it is waiting for.
 *   5. The "look here" animation exists and is spelled the same in both files.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

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

// Comments stripped first. globals.css explains itself at length, and a
// comment sitting between two rules is otherwise read as part of the next
// rule's selector list — which made every grouped reduced-motion rule in the
// file look absent.
const css = readFileSync(join(ROOT, "app/globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  ""
);

// The reduced-motion block(s), as one string.
const reduced = [...css.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/g)]
  .map((m) => {
    // Brace-match from the opening brace so a nested rule does not end it early.
    let depth = 0;
    for (let i = m.index! + m[0].length - 1; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}" && --depth === 0) {
        // The rules inside, without the @media wrapper. Kept out because the
        // selector matcher below would otherwise read the prelude itself as a
        // selector and everything up to the first `}` as its body, which
        // matches nothing and silently passes every check in this file.
        return css.slice(m.index! + m[0].length, i);
      }
    }
    return "";
  })
  .join("\n");

check("globals.css has a reduced-motion block", reduced.length > 0);
check(
  "the reduced-motion block was unwrapped, not read as one selector",
  !reduced.includes("prefers-reduced-motion"),
  "the brace matcher above is returning the @media prelude too"
);

// ---------------------------------------------------------------------------
// 1. Every animating class is turned off under reduced motion
// ---------------------------------------------------------------------------

/** Classes declared with `animation:` — `.foo { animation: shp-bar ... }`. */
const animated = [
  ...css.matchAll(/\.([a-z][\w-]*)\s*\{[^}]*\banimation:\s*(shp-[\w-]+)/g),
].map((m) => ({ cls: m[1], frames: m[2] }));

check("globals.css declares animation classes", animated.length >= 8, `found ${animated.length}`);

for (const { cls } of animated) {
  check(
    `.${cls} is switched off under reduced motion`,
    new RegExp(`\\.${cls}\\b`).test(reduced),
    "add it to the prefers-reduced-motion block in globals.css"
  );
}

// ---------------------------------------------------------------------------
// 2. Anything that starts hidden is restored when its animation is off
// ---------------------------------------------------------------------------

/** The body of one @keyframes block. */
function frames(name: string): string {
  const at = css.indexOf(`@keyframes ${name}`);
  if (at < 0) return "";
  let depth = 0;
  for (let i = css.indexOf("{", at); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(at, i + 1);
  }
  return "";
}

/** The `from` / `0%` step of a keyframes block — where the animation begins. */
function openingState(block: string): string {
  const re = /(^|[{}\s])(from|0%)\s*\{([^}]*)\}/g;
  let out = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out += m[3] + "\n";
  return out;
}

/**
 * The declarations that apply to a class inside the reduced-motion block,
 * including the ones it shares with other selectors in a grouped rule.
 */
function reducedRulesFor(cls: string): string {
  const out: string[] = [];
  const re = /([^{}]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(reduced))) {
    const selectors = m[1].split(",").map((s) => s.trim());
    if (selectors.some((s) => s === `.${cls}` || s.startsWith(`.${cls}:`))) out.push(m[2]);
  }
  return out.join("\n");
}

for (const { cls, frames: name } of animated) {
  // Only the opening state matters. An animation that *ends* hidden — a toast
  // leaving — is not one that needs restoring; it is one whose element has to
  // be gone. Reading the whole block would call every exit animation a fault.
  const body = openingState(frames(name));
  const startsInvisible = /opacity:\s*0\b/.test(body);
  const startsCollapsed = /max-height:\s*0\b/.test(body);
  if (!startsInvisible && !startsCollapsed) continue;

  const rules = reducedRulesFor(cls);
  // A class whose whole job is to leave may answer by being removed instead.
  const removed = /display:\s*none/.test(rules);

  if (startsInvisible) {
    check(
      `.${cls} is still visible with motion off`,
      removed || /opacity:\s*1/.test(rules),
      `${name} starts at opacity 0; the reduced-motion rule must set opacity: 1`
    );
  }
  if (startsCollapsed) {
    check(
      `.${cls} is still open with motion off`,
      removed || /max-height:\s*(none|[1-9])/.test(rules),
      `${name} starts at max-height 0; the reduced-motion rule must release it`
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Errors go through FieldError, so they are announced and they arrive
// ---------------------------------------------------------------------------

const files = walk(join(ROOT, "components")).concat(walk(join(ROOT, "app")));

/**
 * A hand-written error line: a <p> or <span> whose only styling is rose text.
 * The primitive is components/ui/primitives.tsx itself, and the type-switch
 * banner is a filled panel rather than a line, so both are exempt.
 */
const EXEMPT = new Set([
  "components/ui/primitives.tsx",
  "components/admin/business-type-dialog.tsx",
]);

for (const file of files) {
  const rel = relative(ROOT, file);
  if (EXEMPT.has(rel)) continue;
  const source = readFileSync(file, "utf8");
  // A <p> in rose is an error line. A <span> in rose is only one when it
  // carries its own text size — that is what makes it a line of its own rather
  // than a red word inside a sentence, and rose words inside sentences are
  // ordinary: "12 cancelled" on the analytics screen, a slug problem named
  // mid-hint. Announcing those as alerts would be worse than leaving them.
  const handWritten = [
    ...source.matchAll(
      /<p\s+className="[^"]*\btext-rose\b[^"]*"\s*>\s*\{|<span\s+className="[^"]*\btext-(?:xs|sm|base|\[\d+px\])\b[^"]*\btext-rose\b[^"]*"\s*>\s*\{|<span\s+className="[^"]*\btext-rose\b[^"]*\btext-(?:xs|sm|base|\[\d+px\])\b[^"]*"\s*>\s*\{/g
    ),
  ];
  check(
    `${rel} uses FieldError rather than its own error line`,
    handWritten.length === 0,
    handWritten.length ? `${handWritten.length} hand-written` : ""
  );
}

// ---------------------------------------------------------------------------
// 4. The toast waits exactly as long as its animation runs
// ---------------------------------------------------------------------------

const toast = readFileSync(join(ROOT, "components/ui/toast.tsx"), "utf8");
const leaveMs = Number(toast.match(/const LEAVE_MS\s*=\s*(\d+)/)?.[1] ?? 0);
const cssOut = Number(
  css.match(/\.toast-out\s*\{[^}]*animation:\s*shp-toast-out\s+(\d+)ms/)?.[1] ?? -1
);
check("toast.tsx declares LEAVE_MS", leaveMs > 0);
check(
  "the toast's removal timer matches its exit animation",
  leaveMs === cssOut,
  `LEAVE_MS is ${leaveMs}ms, .toast-out runs ${cssOut}ms — a shorter timer blinks the toast out, a longer one holds its neighbours down`
);

// ---------------------------------------------------------------------------
// 5. "Look here" exists, and is used sparingly
// ---------------------------------------------------------------------------

check("the attention animation exists", /\.attention\s*\{/.test(css));
check(
  "attention has a still answer under reduced motion",
  /\.attention\b/.test(reduced) && /box-shadow/.test(reducedRulesFor("attention")),
  "a merchant who cannot be shown a pulse still has to be shown which control"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
