/**
 * Checks the rule every `"use server"` file lives under, run with
 * `npm run check:actions`.
 *
 * Everything exported from such a file becomes callable over the network. Next
 * therefore refuses any export that is not an async function, and it refuses it
 * at build time — not at typecheck, not at lint. A synchronous helper exported
 * beside its action is a green local run and a failed deploy, which is what
 * happened when the opening-hours screen shipped a time parser next to the
 * action that used it.
 *
 * The fix is always the same: a helper belongs in `lib/`, where it can also be
 * imported by anything else and tested on its own.
 *
 * Dependency free; exits non zero on failure.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";

const root = process.cwd();

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.log(`  FAIL  ${name}  ${detail}`);
  }
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "generated" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** Strips comments and strings so an export mentioned in prose is not counted. */
function code(source: string): string {
  return source
    .replace(/\/\/.*$/gm, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
}

const files = [...walk(join(root, "app")), ...walk(join(root, "lib"))];
let serverFiles = 0;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  // The directive has to be the first statement, so anything further down is a
  // string that happens to say it.
  if (!/^\s*(["'])use server\1/.test(source)) continue;
  serverFiles++;

  const where = relative(root, file);
  const body = code(source);

  // `export async function x` and `export const x = async (...) =>` are fine.
  // Everything else exported is not.
  for (const match of body.matchAll(/^export\s+(?!type\b|interface\b|default\b)(.+)$/gm)) {
    const line = match[1].trim();

    if (/^async\s+function\s/.test(line)) continue;
    if (/^const\s+\w+\s*(:[^=]+)?=\s*async\s*\(/.test(line)) continue;
    // A re-export carries nothing of its own; whatever it names is checked
    // wherever it is declared.
    if (/^\{[^}]*\}\s*from\s/.test(line) || /^\*\s*from\s/.test(line)) continue;

    check(
      `${where} exports only async functions`,
      false,
      `"export ${line.slice(0, 60)}" — move it to lib/`
    );
  }

  check(`${where} has at least one export`, /^export\s/m.test(body), "a server file with none");
}

console.log(`\nchecked ${serverFiles} "use server" files`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
