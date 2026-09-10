/**
 * Checks the cache is invalidated by whoever writes it — `npm run check:cache`.
 *
 * Every storefront page reads the same handful of rows, so they are cached per
 * shop for five minutes and dropped by tag when a merchant saves. The danger is
 * that the two halves drift: a writer that forgets its tag leaves a merchant
 * editing a screen that will not change, which is the worst bug this admin has
 * had — twice. lib/cache-tags.ts has claimed since it was written that this
 * script asserts the pairing. Until today it did not exist.
 *
 * What is checked:
 *
 *   1. Every cached kind has at least one reader and at least one invalidator.
 *   2. Readers live in the data layer, not in a screen.
 *   3. Every server action that writes a cached model invalidates something.
 *   4. Changing the business type drops the whole of that shop's cache, because
 *      every one of these rows is partitioned by business type.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { CACHE_KINDS } from "../lib/cache-tags";

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

const files = walk(ROOT).filter((f) => !f.includes("/scripts/"));
const source = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

/**
 * Which files call `fn` with this cache kind.
 *
 * Matching up to the closing bracket does not work: the first argument is
 * usually `await currentShopId()`, whose own bracket ends the match before the
 * kind is reached. So this reads to the end of the line instead.
 */
function callers(fn: string, kind: string): string[] {
  const re = new RegExp(`${fn}\\(.{0,160}?["'\`]${kind}["'\`]`);
  return files.filter((f) => re.test(source.get(f)!));
}

for (const kind of CACHE_KINDS) {
  const readers = callers("cachedForShop", kind);
  const writers = callers("invalidateShop", kind);
  check(`"${kind}" is read somewhere`, readers.length > 0);
  check(
    `"${kind}" is dropped somewhere`,
    writers.length > 0,
    writers.length === 0 ? "nothing calls invalidateShop for it" : ""
  );
  // A cached read in a screen is a read nobody can find when the tag is wrong.
  const stray = readers.filter((f) => !/\/lib\//.test(f));
  check(
    `"${kind}" is only read from the data layer`,
    stray.length === 0,
    stray.map((f) => relative(ROOT, f)).join(", ")
  );
}

// A server action that writes one of the cached models and drops nothing is the
// exact shape of the bug: the save works, and the storefront does not change.
const CACHED_MODELS = [
  ["storeSettings", "settings"],
  ["menu", "menus"],
  ["siteText", "site-text"],
  ["themeSettings", "theme"],
  ["stickyButton", "buttons"],
] as const;

for (const [model, kind] of CACHED_MODELS) {
  const write = new RegExp(`\\.${model}\\.(create|createMany|update|updateMany|upsert|delete|deleteMany)`);
  const forgetful = files.filter((f) => {
    if (!/\/app\/.*actions?[^/]*\.ts$/.test(f) && !/\/app\/.*-actions\.ts$/.test(f)) return false;
    const src = source.get(f)!;
    return write.test(src) && !/invalidateShop\(/.test(src);
  });
  check(
    `whoever writes ${model} drops "${kind}"`,
    forgetful.length === 0,
    forgetful.map((f) => relative(ROOT, f)).join(", ")
  );
}

// Every one of these rows is partitioned by business type, so all of them are
// the wrong rows the moment it changes.
// Both doors into the switch are read: Settings delegates to the top bar's
// action, and the check must follow the write rather than the file it used to
// be in.
const typeSwitch =
  readFileSync(join(ROOT, "app/admin/business-type-actions.ts"), "utf8") +
  readFileSync(join(ROOT, "app/admin/settings/business-type-actions.ts"), "utf8");
check(
  "changing the business type drops the whole of that shop's cache",
  /for \(const kind of CACHE_KINDS\) invalidateShop\(/.test(typeSwitch)
);

// The theme row is keyed by shop *and* business type. Reading it without the
// type served a restaurant's colours to a shop that used to be one.
const themeData = readFileSync(join(ROOT, "lib/data/theme.ts"), "utf8");
check(
  "the theme is read for the shop's own business type",
  // The type is passed in rather than read inline now, because both the tokens
  // and the layout need the same answer and a cached function may not read
  // headers. What matters is unchanged: the settings row is never looked up
  // without it.
  /themeSettings\.findFirst\([\s\S]{0,160}businessType/.test(themeData) &&
    /themeForRequest\(shop\.id, shop\.businessType\)/.test(themeData),
  "reading it without the type served a restaurant's colours to a shop that used to be one"
);
check(
  "the theme's settings and its edits come from one cached read",
  (themeData.match(/cachedForShop\(shopId, "theme"/g) ?? []).length === 1,
  "cachedForShop keys on shop and kind alone, so two callbacks under one kind collide and the second gets the wrong shape"
);
check(
  "and a theme's edits are read for that theme alone",
  /installed\.find\(\(r\) => r\.themeKey === key\)/.test(themeData),
  "otherwise a draft's colours would leak onto the live storefront"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
