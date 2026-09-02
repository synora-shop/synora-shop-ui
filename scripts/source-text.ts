import { readFileSync } from "fs";
import { join } from "path";

/**
 * A source file with its comments removed, for checks that scan code.
 *
 * Several checks assert that a file does or does not contain a phrase. Those
 * files also *explain*, in prose, the bugs they were written to avoid — the
 * account actions describe the enumeration leak they don't have, the sitemap
 * names the unscoped query it no longer makes. Scanning raw text fails a file
 * for documenting the mistake it corrects.
 *
 * Line comments are removed **before** block comments, and that order is the
 * whole subtlety. A line comment can contain `/*` — `// proxy.ts gates
 * /admin/​*, this re-checks` does — and stripping block comments first treats
 * that as the start of one, deleting everything up to the next `*​/`. It cost
 * about forty lines of app/admin/layout.tsx, and the checks that read them
 * failed with no hint why. The reverse order would have been worse: silently
 * deleting a region can just as easily make a "this file never says X" check
 * pass because X was thrown away.
 *
 * Still not a parser. A `/*` inside a string literal would fool it. Nothing in
 * this codebase has one, and a check that reads code is a smell to be kept
 * cheap rather than made clever — where a rule can be exercised directly
 * instead, it should be.
 */
export function sourceOf(...parts: string[]): string {
  return readFileSync(join(process.cwd(), ...parts), "utf8")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/[ \t]+\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}
