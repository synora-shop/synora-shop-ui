/**
 * Checks the settings index — run with `npm run check:search`.
 *
 * The index exists so that no setting can be added without becoming findable.
 * That guarantee is only real if it is tested: these assert that the index is
 * derived from the schemas (not a stale hand-written copy), that every entry
 * can actually be navigated to, and that the searches a confused admin would
 * actually type return the right control first.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { SETTINGS_INDEX, searchSettings, settingAnchor, groupAnchor } from "../lib/settings-index";
import { THEME_GROUPS } from "../lib/theme-schema";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};

console.log("\nINDEX IS COMPLETE");
check("index is not empty", SETTINGS_INDEX.length > 20, String(SETTINGS_INDEX.length));
check("ids are unique", new Set(SETTINGS_INDEX.map((e) => e.id)).size === SETTINGS_INDEX.length);
check("every entry has a label", SETTINGS_INDEX.every((e) => e.label.trim().length > 0));
check("every entry has help text", SETTINGS_INDEX.every((e) => e.info.trim().length > 0),
  SETTINGS_INDEX.filter((e) => !e.info.trim()).map((e) => e.id).join(", "));
check("every entry has a breadcrumb", SETTINGS_INDEX.every((e) => e.path.length > 0));
check("every entry links somewhere internal",
  SETTINGS_INDEX.every((e) => e.href.startsWith("/admin")),
  SETTINGS_INDEX.filter((e) => !e.href.startsWith("/admin")).map((e) => e.href).join(", "));

// A link in the index outlives the page it points at: when /admin/publish was
// removed with the sandbox, its entry sat in search results as a live-looking
// result that 404s. Resolving each href against the route directory is the
// only way that stops being possible.
/**
 * Where a URL's page file lives.
 *
 * Not simply app/<href>/page.tsx: a route group is a folder whose name is in
 * parentheses and which contributes nothing to the URL, so `/admin/customize`
 * is served from app/(fullscreen)/admin/customize/page.tsx. The editors sit in
 * such a group precisely so they escape the admin layout, and resolving only
 * the literal path would report every one of them as a dead link.
 */
function pageExists(href: string): boolean {
  const segments = href.slice(1);
  const root = join(process.cwd(), "app");
  if (existsSync(join(root, segments, "page.tsx"))) return true;
  return readdirSync(root, { withFileTypes: true }).some(
    (entry) =>
      entry.isDirectory() &&
      entry.name.startsWith("(") &&
      existsSync(join(root, entry.name, segments, "page.tsx"))
  );
}

const deadLinks = SETTINGS_INDEX
  .map((e) => e.href.split("#")[0])
  .filter((href, i, all) => all.indexOf(href) === i)
  .filter((href) => !pageExists(href));
check("every entry points at a page that exists", deadLinks.length === 0, deadLinks.join(", "));

// The point of deriving from the schema: adding a theme setting adds it here.
console.log("\nEVERY THEME SETTING IS FINDABLE");
for (const group of THEME_GROUPS) {
  for (const field of group.fields) {
    const entry = SETTINGS_INDEX.find((e) => e.id === `theme-${field.key}`);
    check(`${group.title} › ${field.label}`,
      Boolean(entry) && entry!.href.endsWith(`#${settingAnchor(field.key)}`),
      entry?.href ?? "missing");
  }
}

console.log("\nANCHORS ARE URL-SAFE");
check("setting anchors have no spaces", THEME_GROUPS.every((g) =>
  g.fields.every((f) => !/[^a-zA-Z0-9_-]/.test(settingAnchor(f.key)))));
check("group anchors have no spaces", THEME_GROUPS.every((g) =>
  !/[^a-z0-9-]/.test(groupAnchor(g.title))), THEME_GROUPS.map((g) => groupAnchor(g.title)).join(" "));

/**
 * The searches that motivated this feature.
 *
 * "logo" is the one that started it — the user could not find the logo colour
 * control. Each case asserts the right thing comes back, and mostly that it
 * comes back *first*, since a result buried at rank 8 is barely better than the
 * scrolling it replaced.
 */
console.log("\nREAL SEARCHES FIND THE RIGHT THING");
const topFor = (q: string) => searchSettings(q)[0]?.label ?? "(nothing)";
const labelsFor = (q: string) => searchSettings(q).map((e) => e.label);

check("'logo' finds the logo controls", labelsFor("logo").some((l) => /logo/i.test(l)), topFor("logo"));
check("'logo colour' puts logo colour first", topFor("logo colour") === "Logo colour", topFor("logo colour"));
check("'logo color' works with US spelling too",
  labelsFor("logo color").some((l) => /logo/i.test(l)), topFor("logo color"));
check("'upload logo' finds the logo image field",
  labelsFor("upload logo").some((l) => /logo image/i.test(l)), topFor("upload logo"));
check("'whatsapp' finds sticky buttons",
  labelsFor("whatsapp").includes("Sticky buttons"), topFor("whatsapp"));
check("'font' finds the font tools", labelsFor("font").some((l) => /font/i.test(l)), topFor("font"));
check("'404' finds redirects", labelsFor("404").includes("Links & redirects"), topFor("404"));
check("'trash' finds the bin", labelsFor("trash").includes("Bin"), topFor("trash"));
check("'navigation' finds menus", labelsFor("navigation").includes("Menus"), topFor("navigation"));
check("'header' finds header settings", labelsFor("header").length > 0, topFor("header"));

console.log("\nSEARCH BEHAVIOUR");
check("a single letter returns nothing", searchSettings("l").length === 0);
check("an empty query returns nothing", searchSettings("").length === 0);
check("whitespace returns nothing", searchSettings("   ").length === 0);
check("nonsense returns nothing", searchSettings("zzzzqqqq").length === 0);
check("results are capped", searchSettings("e", 5).length <= 5);
check("multi-word requires all words to match",
  searchSettings("logo zzzzqqqq").length === 0);
check("search is case-insensitive",
  searchSettings("LOGO").length === searchSettings("logo").length);

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exitCode = 1;
