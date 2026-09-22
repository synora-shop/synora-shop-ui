/**
 * The lint rules whose failures a merchant can see — `npm run check:lint`.
 *
 * This exists because of one bug. A `//` comment placed between a JSX opening
 * tag and its first child is not a comment: it is text, and React rendered
 * four paragraphs of my own reasoning above the header on the live panel.
 *
 * ESLint has always caught it — `react/jsx-no-comment-textnodes`, one of the
 * rules `eslint-config-next` turns on by default. It was never run. There were
 * 3,201 assertions in this suite at the time and not one of them opened the
 * linter, so a rule that would have caught it in a second sat unused while the
 * check suite grew around it.
 *
 * So this is deliberately not "run the linter and fail on anything". It fails
 * on the rules that put something wrong in front of a merchant, and it counts
 * the rest so the debt is visible rather than silently tolerated. Widening the
 * fatal list is how that debt gets paid; see docs/QUEUE.md.
 */
import { execFileSync } from "node:child_process";

/** Rules that produce a visible defect, not a stylistic complaint. */
const FATAL = new Set([
  // A comment rendered as page text. The reason this file exists.
  "react/jsx-no-comment-textnodes",
  // An <img> that ignores the shop's own image pipeline, and a <head> that
  // fights the metadata API — both change what a visitor is served.
  "@next/next/no-img-element",
  "@next/next/no-head-element",
  // A hook rule that has actually broken a screen here rather than merely
  // offended a linter.
  "react-hooks/rules-of-hooks",
]);

type Message = { ruleId: string | null; line: number; column: number; message: string };
type Result = { filePath: string; messages: Message[] };

let raw = "";
try {
  raw = execFileSync(
    "npx",
    ["eslint", "app", "components", "lib", "--format", "json"],
    { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
  );
} catch (err) {
  // ESLint exits non-zero whenever it reports an error, which is the normal
  // case here — the report is on stdout either way.
  raw = (err as { stdout?: string }).stdout ?? "";
}

if (!raw.trim()) {
  console.log("  FAIL  the linter produced no report");
  process.exit(1);
}

const results = JSON.parse(raw) as Result[];
const root = process.cwd() + "/";
let fail = 0;
let other = 0;
const counts = new Map<string, number>();

for (const file of results) {
  for (const m of file.messages) {
    const rule = m.ruleId ?? "(parse)";
    counts.set(rule, (counts.get(rule) ?? 0) + 1);
    if (FATAL.has(rule)) {
      fail++;
      console.log(
        `  FAIL  ${rule}\n        ${file.filePath.replace(root, "")}:${m.line}:${m.column}\n        ${m.message}`
      );
    } else {
      other++;
    }
  }
}

if (fail === 0) {
  for (const rule of FATAL) console.log(`  PASS  no ${rule}`);
}

// Everything else, named and counted. Not fatal, not hidden.
if (other > 0) {
  console.log(`\n  ${other} other lint finding(s), by rule:`);
  for (const [rule, n] of [...counts].filter(([r]) => !FATAL.has(r)).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(n).padStart(3)}  ${rule}`);
  }
}

console.log(`\n${FATAL.size - fail} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
