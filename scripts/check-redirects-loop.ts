/**
 * Checks that no layout redirects into itself, run with `npm run check:loops`.
 *
 * A nested layout in Next *adds* to its parent, it cannot remove one. So a
 * layout that redirects somewhere, and a page filed underneath it at that very
 * address, is an infinite redirect: the target renders the layout, which
 * redirects to the target.
 *
 * This is not hypothetical. app/admin/layout.tsx sends a shop that has not been
 * welcomed to /admin/welcome, and the welcome flow was filed at
 * app/admin/welcome — so it inherited the layout that had just sent it there
 * and the whole admin became unreachable. The fix is the (fullscreen) group,
 * which is a sibling of app/admin rather than a child, and whose own comment
 * states the rule I had reasoned my way past.
 *
 * Dependency free; exits non zero on failure.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const root = process.cwd();
const appDir = join(root, "app");

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

/** Every layout.tsx under app/. */
function layouts(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) layouts(full, out);
    else if (entry === "layout.tsx") out.push(full);
  }
  return out;
}

/**
 * The URL a directory serves.
 *
 * Route groups are the whole point here: `(fullscreen)` costs nothing in the
 * URL, which is exactly why a page can share an address with a folder under
 * app/admin and still escape its layout.
 */
function urlFor(dir: string): string {
  const rel = relative(appDir, dir).split("/").filter(Boolean);
  return "/" + rel.filter((part) => !part.startsWith("(")).join("/");
}

const found = layouts(appDir);
check("there are layouts to check", found.length > 0);

for (const file of found) {
  const dir = join(file, "..");
  const source = readFileSync(file, "utf8");
  const owns = urlFor(dir);
  const where = relative(root, file);

  for (const match of source.matchAll(/redirect\(\s*["'`]([^"'`?]+)/g)) {
    const target = match[1];
    if (!target.startsWith("/")) continue;

    // Does a page for this target sit *inside* this layout's own folder? If it
    // does, reaching the target renders this layout, which redirects again.
    const inside = owns === "/" ? target : target.startsWith(owns + "/") ? target.slice(owns.length) : null;
    if (inside === null) continue;

    const page = join(dir, inside, "page.tsx");
    check(
      `${where} does not redirect into itself (${target})`,
      !existsSync(page),
      `${relative(root, page)} inherits this layout, so ${target} would redirect for ever`
    );
  }
}

console.log(`\nchecked ${found.length} layouts`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
