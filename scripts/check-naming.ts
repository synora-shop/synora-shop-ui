/**
 * Checks the product calls itself one thing — run with `npm run check:naming`.
 *
 * Two names have been retired and both kept turning up months later, in
 * comments, in storage keys, and once in a live database row that pointed a
 * merchant's store preview at a domain nobody owns.
 *
 *   bettershp   Gone. Not a brand, not a URL, not a localStorage prefix.
 *   Your SHOP   The section is "Your App" — that is what the drawing calls it,
 *               and the icon file is literally named "Your App icon.svg".
 *
 * Applied migrations are exempt and must stay that way: their checksums are
 * recorded, and editing one makes `prisma migrate deploy` refuse to run. A
 * migration is a record of what happened, not a description of how things are.
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
const SKIP = new Set([
  "node_modules", ".git", ".next", ".claude", "generated", "migrations",
]);
const EXT = /\.(ts|tsx|css|md|json)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXT.test(entry)) out.push(full);
  }
  return out;
}

const files = walk(ROOT);
check("the tree was walked", files.length > 100, `found ${files.length} files`);

const RETIRED: [RegExp, string][] = [
  [/bettershp/i, "bettershp is retired — not a brand, not a URL, not a storage key"],
  [/Your SHOP/, 'the section is "Your App"'],
  [/Shop by Synora Digitals/, "the product is APP by Synora Digitals"],
  // Two marks means two products. There is one, and SynoraAppMark draws it.
  [/components\/ui\/wordmark/, "the wordmark is retired — use SynoraAppMark"],
];

for (const [pattern, why] of RETIRED) {
  const hits = files.filter((f) => {
    // This file names them in order to ban them.
    if (f === join(ROOT, "scripts", "check-naming.ts")) return false;
    return pattern.test(readFileSync(f, "utf8"));
  });
  check(
    `no "${pattern.source}" outside applied migrations — ${why}`,
    hits.length === 0,
    hits.map((f) => relative(ROOT, f)).join(", ")
  );
}

/* -------------------------------------------------------------------------- */
/* The sidebar wears the drawn icons                                          */
/* -------------------------------------------------------------------------- */

const nav = readFileSync(join(ROOT, "lib/admin-nav.ts"), "utf8");
check(
  "the navigation uses the drawn glyphs",
  /from "@\/components\/admin\/nav-icons"/.test(nav)
);
// A stock set gets you a house and a gear; it does not get you these six, at
// these weights, sized against each other the way a designer sized them.
check(
  "and not a general-purpose icon set",
  !/from "lucide-react"/.test(nav),
  "lucide crept back into the sidebar"
);

const icons = readFileSync(join(ROOT, "components/admin/nav-icons.tsx"), "utf8");
check("all six glyphs are exported", (icons.match(/^export function/gm) ?? []).length === 6);
// The source files carry their own fills, which would ignore the active pill
// and leave a dark glyph sitting on the brand colour. Matched on the attribute
// rather than on the text, so the comment explaining this does not trip it.
check(
  "they take their colour from the state",
  /fill="currentColor"/.test(icons) && !/fill="#/.test(icons) && !/class="cls-/.test(icons)
);

/* -------------------------------------------------------------------------- */
/* One mark, drawn in one place                                               */
/* -------------------------------------------------------------------------- */

// The sign-in page carried a separate "shop / synoradigitals" lockup while the
// admin bar carried "synora app" — the same product introducing itself by two
// different names, one screen apart.
for (const file of [
  "app/(platform)/layout.tsx",
  "app/merchant/layout.tsx",
  "components/admin/admin-topbar.tsx",
]) {
  check(
    `${file} uses the one product mark`,
    /SynoraAppMark/.test(readFileSync(join(ROOT, file), "utf8"))
  );
}

/* -------------------------------------------------------------------------- */
/* One text box                                                               */
/* -------------------------------------------------------------------------- */

// The panel shipped three heights and two type sizes as one control, because
// .input owned the border and the colour but callers restated the rest —
// "input mt-1 h-9 text-sm" a dozen times, and two screens with a field of
// their own. Everything a text box needs lives in .input now.
const restating = files.filter((f) => {
  const src = readFileSync(f, "utf8");
  return /className="[^"]*\binput\b(?![-\w])[^"]*\b(h-\d|text-(xs|sm|base|lg)|px-\d|py-\d|rounded)/.test(src);
});
check(
  "no screen restates what .input already owns",
  restating.length === 0,
  restating.map((f) => relative(ROOT, f)).join(", ")
);

// A field built out of utility classes is a fourth text box nobody will
// remember to keep in step.
const handRolled = files.filter((f) => {
  const src = readFileSync(f, "utf8");
  return /const (field|inputClass) =\s*\n?\s*"[^"]*border[^"]*px-/.test(src);
});
check(
  "no screen builds a text box of its own",
  handRolled.length === 0,
  handRolled.map((f) => relative(ROOT, f)).join(", ")
);

const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
check("the shared text box sets its own height", /\.input \{[^}]*height:/.test(css));
check("a textarea is exempt from that height", /textarea\.input[\s\S]{0,120}height: auto/.test(css));
// Two sizes, both declared. A field inside a row needs to be shorter than one
// in a form — that is a real difference, and it belongs in the stylesheet
// rather than as h-8 written at each site.
check("the compact size is declared once", /\.input-sm \{[^}]*height:/.test(css));

/* -------------------------------------------------------------------------- */
/* Space                                                                      */
/* -------------------------------------------------------------------------- */

const side = readFileSync(join(ROOT, "components/admin/admin-sidebar.tsx"), "utf8");
// Six links that never change should not take a sixth of the screen.
check("the sidebar rows are 40px, not 48", /"h-10"/.test(side) && !/"h-12"/.test(side));
check("the sidebar is narrower than 15rem", /lg:w-\[13rem\]/.test(side));

// Twenty-five different buttons shipped while a Button primitive sat unused in
// half the panel — five paddings for the primary alone. A button built out of
// utilities is a twenty-sixth nobody will remember to keep in step.
const rolledButtons = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  const src = readFileSync(f, "utf8");
  // Only inside a <button> or <a> tag. It used to test the whole file, which
  // flagged any pill-shaped *container* — the bulk bar is one — and the fix for
  // a false positive is to distort the markup, which is worse than no check.
  const tags = src.match(/<(?:button|a)\s[^>]*>/g) ?? [];
  return tags.some((tag) =>
    /className="[^"]*rounded-(full|pill)[^"]*(border border-border|bg-brand-500)[^"]*px-\d/.test(tag)
  );
});
check(
  "no screen builds a button out of utilities",
  rolledButtons.length === 0,
  rolledButtons.map((f) => relative(ROOT, f)).join(", ")
);

// Every admin screen is dynamic, so a navigation waits on the server. Without a
// loading state the old screen sits there and the panel appears to have ignored
// the click.
check("the panel has a loading state", existsSync(join(ROOT, "app/admin/loading.tsx")));
// A list skeleton drawn over a page of tiles is the wrong shape, and the page
// jumps when the real thing lands.
check("analytics has its own", existsSync(join(ROOT, "app/admin/analytics/loading.tsx")));
// A page of throbbing blocks is what someone who turned animation off turned it
// off to avoid.
check(
  "the skeleton pulse respects reduced motion",
  /motion-safe:animate-pulse/.test(readFileSync(join(ROOT, "components/ui/skeleton.tsx"), "utf8"))
);

// A gap is not a divider — on a page of stacked cards it reads as more list.
check(
  "there is a named section divider",
  /export function SectionDivider/.test(readFileSync(join(ROOT, "components/ui/primitives.tsx"), "utf8"))
);

// A form label was written three ways: a wrapping <label> at text-sm, a bare
// uppercase text-xs, and a flex row with an info popover in it. On one screen
// all three were visible at once. Field and FieldLabel are the only two.
const strayLabels = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  const src = readFileSync(f, "utf8");
  // Any <label> wearing uppercase, and any local `label`/`labelClass` string.
  // The first version banned two exact class strings and a fourth idiom walked
  // straight past it — the Home screen was still shouting STORE NAME at people
  // while the check said the panel had one label style.
  const uppercaseLabel = (src.match(/<label[^>]*className="[^"]*"/g) ?? []).some((tag) =>
    /uppercase/.test(tag)
  );
  return (
    uppercaseLabel ||
    /const label(Class)? = "[^"]*(uppercase|text-ink)[^"]*"/.test(src) ||
    /className="flex items-center gap-1\.5 text-xs font-medium text-ink"/.test(src)
  );
});
check(
  "no screen invents its own field label",
  strayLabels.length === 0,
  strayLabels.map((f) => relative(ROOT, f)).join(", ")
);

// The label has to reach the control. A wrapping <label> does it by containment
// and needs no id; anything else needs htmlFor, and a popover button cannot go
// inside a <label> because it would eat the click meant for the input.
const shell = readFileSync(join(ROOT, "components/merchant/form-shell.tsx"), "utf8");
check("the wrapping label exists", /export function Field\(/.test(shell));
check("the explicit one takes htmlFor", /export function FieldLabel\([\s\S]{0,600}htmlFor\?: string/.test(shell));
check(
  "the info popover sits outside the label element",
  /<\/label>\s*\) : \([\s\S]{0,120}\)\}\s*\{info &&/.test(shell)
);

// Settings is where a merchant meets the most controls at once, so it is where
// an inconsistency is loudest. Every block on it is one primitive.
const settings = readFileSync(join(ROOT, "app/admin/settings/page.tsx"), "utf8");
check("settings builds no ad-hoc panel", !/<section className="[^"]*rounded-xl/.test(settings));
check("settings is divided, not just spaced", /<SectionDivider/.test(settings));
for (const f of [
  "components/admin/global-edits-form.tsx",
  "components/admin/store-defaults-form.tsx",
  "components/admin/store-settings-form.tsx",
  "components/admin/business-type-form.tsx",
  "components/admin/visibility-form.tsx",
]) {
  const src = readFileSync(join(ROOT, f), "utf8");
  check(`${f.split("/").pop()} uses the shared fieldset`, /<Fieldset/.test(src));
  check(`${f.split("/").pop()} declares no serif heading`, !/font-serif/.test(src));
}

// A lone switch in a column as wide as a text field ends up an inch of empty
// white away from its own label. Inside a fieldset it goes first, and hugs.
const toggle = readFileSync(join(ROOT, "components/ui/toggle-switch.tsx"), "utf8");
check("the switch has a hugging variant", /inline\?: boolean/.test(toggle));
const marooned = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  const src = readFileSync(f, "utf8");
  if (!/<Fieldset/.test(src)) return false;
  // every ToggleSwitch inside a fieldset screen must ask for the inline form
  const opens = src.match(/<ToggleSwitch\b/g)?.length ?? 0;
  const inlines = src.match(/<ToggleSwitch\s+inline\b/g)?.length ?? 0;
  return opens !== inlines;
});
check(
  "no switch is marooned in a fieldset",
  marooned.length === 0,
  marooned.map((f) => relative(ROOT, f)).join(", ")
);

// The catalogue is shown in four places. A product that looks like a different
// object in each is four things to learn instead of one, so the thumbnail, the
// stock mark and the status mark are one set of components.
const elements = readFileSync(join(ROOT, "components/admin/product-elements.tsx"), "utf8");
check("the product thumbnail is shared", /export function Thumb/.test(elements));
check("so is the stock mark", /export function StockMark/.test(elements));
check("so is the status mark", /export function StatusMark/.test(elements));
// Out of stock and low stock are the two rows a merchant has to act on, and
// they were the same grey sentence as every other row.
check("out of stock is called out", /Out of stock/.test(elements) && /text-rose/.test(elements));
check("low stock is called out", /\{stock\} left/.test(elements) && /text-amber/.test(elements));
// Status colour never travels alone.
check(
  "the status mark carries a word, not just a colour",
  /Draft" : "Published/.test(elements)
);
const rolledThumb = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  if (/product-elements\.tsx$/.test(f)) return false;
  // The category picture is its own control — a bordered button you click to
  // edit — so it is not this. This is the product thumbnail's own tinted box.
  return /w-11[^"]*overflow-hidden[^"]*bg-brand-50/.test(readFileSync(f, "utf8"));
});
check(
  "no list draws its own product thumbnail",
  rolledThumb.length === 0,
  rolledThumb.map((f) => relative(ROOT, f)).join(", ")
);

// The order screen printed the database's spelling at the merchant —
// BANK_TRANSFER, AWAITING_VERIFICATION — while the list beside it had had
// human labels for months.
const orderScreen = readFileSync(join(ROOT, "app/admin/orders/[id]/page.tsx"), "utf8");
check("the order screen names a status in words", /statusLabel\(/.test(orderScreen));
check("and a payment method in words", /paymentLabel\(/.test(orderScreen));
// It showed everything about an order except when it happened.
check("and says when the order was placed", /Placed \{placed}/.test(orderScreen));
// A date formatted in the browser disagrees with the server that rendered it.
check(
  "with the date formatted on the server",
  /Intl\.DateTimeFormat[\s\S]{0,160}timeZone/.test(orderScreen)
);
check("the order lines carry a picture", /<Thumb src={item\.product\?\.images\[0\]}/.test(orderScreen));
// Every other destructive action in the panel is the shared danger button.
const deleteOrder = readFileSync(join(ROOT, "components/admin/delete-order-button.tsx"), "utf8");
check(
  "moving an order to the Bin uses the shared button",
  /<Button variant="danger"/.test(deleteOrder)
);

// Ticking twelve products and doing one thing to them was twelve trips into a
// product and back. The bar that appears when rows are ticked is one component,
// and the rules it has to keep are these.
const bulkBar = readFileSync(join(ROOT, "components/admin/bulk-bar.tsx"), "utf8");
check("the bulk bar says how many are selected", /{count} {noun}/.test(bulkBar));
// A selection you cannot clear is a mode you are stuck in.
check("and carries its own way out", /onClear/.test(bulkBar));
// It floats: by the fifth tick the top of the list is above the fold.
check("and does not sit at the top of a list", /fixed inset-x-0 bottom-/.test(bulkBar));

const bulkActions = readFileSync(join(ROOT, "app/admin/products/actions.ts"), "utf8");
check("bulk work is one query, not a loop", /updateMany\(/.test(bulkActions));
// db() scopes the write, so an id from another shop matches nothing.
check("and goes through the tenant client", /await db\(\)\)\.product\.updateMany/.test(bulkActions));
check("and is capped", /BULK_LIMIT/.test(bulkActions));
// Postgres counts a no-op UPDATE as a row written, so "4 published" when two
// were already published is a small lie a merchant can catch.
check(
  "and reports what changed, not what was asked for",
  /status: { not: skip\.status }/.test(bulkActions)
);
const list = readFileSync(join(ROOT, "components/admin/product-list.tsx"), "utf8");
// A tick on a row that has been filtered away would be acted on invisibly.
check(
  "the selection is intersected with what is on screen",
  /rows\.filter\(\(p\) => picked\.has\(p\.id\)\)/.test(list)
);
// A circle means "pick one of these" to anybody who has used a form, and this
// design system's rounded-md is 14px, which on a 20px box is a circle.
check("the tick is square", /rounded-\[5px\]/.test(list));

// The Themes screen wrote themeKey and nothing read it, so activating a theme
// changed a database row and not one pixel of the storefront — while the screen
// said "only the layout changes".
const themeData = readFileSync(join(ROOT, "lib/data/theme.ts"), "utf8");
check("the chosen theme reaches the storefront", /themeFor\(/.test(themeData));
check("and the merchant's own colours still win", /\.\.\.themeFor\([\s\S]{0,80}\.\.\.\(\(row\?\.tokens/.test(themeData));
// Every link to a theme preview carried ?__theme= long before anything read it,
// so "View full" showed the theme you already had.
check("a theme can be previewed without activating it", /__theme/.test(themeData));
const gallery = readFileSync(join(ROOT, "components/admin/theme-gallery.tsx"), "utf8");
check("and each card shows the shop wearing it", /<StorefrontStill url={theme\.previewUrl}/.test(gallery));
// A preview must never outlive the request that asked for it.
check(
  "the preview is read from the request, and never written",
  /headers\(\)/.test(themeData) && !/\.(upsert|update|create|createMany)\(/.test(themeData)
);

// Fifteen buttons were on screen at once in the media library — three under
// every picture — all competing with the pictures, which are the content. The
// picture is the button now, and the rarer two recede until it is hovered.
const media = readFileSync(join(ROOT, "components/admin/media-library.tsx"), "utf8");
check("the picture itself copies its address", /aria-label={`Copy the address of/.test(media));
check("copying says so where it happened", /Copied" : "Copy link/.test(media));
check(
  "the rarer actions recede until hover",
  /lg:opacity-0 lg:group-hover:opacity-100/.test(media)
);
// A finger has no hover, so the hint that appears over the picture can be
// hover-only, but the action underneath it must not be: the tile is a button
// in its own right, and tapping it copies whether the hint showed or not.
check(
  "the tile is a button, not a hover target",
  /<button[\s\S]{0,200}onClick={\(\) => copy\(asset\)}[\s\S]{0,1600}<img/.test(media)
);

// An empty list is a sentence in a box on some screens and a proper empty
// state on others; the Bin was the last one telling the story in a grey line.
for (const f of ["components/admin/bin-product-list.tsx", "components/admin/bin-order-list.tsx"]) {
  check(`${f.split("/").pop()} has a real empty state`, /<EmptyState/.test(readFileSync(join(ROOT, f), "utf8")));
}

// "What have I started and not finished" was answerable only by someone who
// knew the Products list had a status filter.
const navList = readFileSync(join(ROOT, "lib/admin-nav.ts"), "utf8");
check("Drafts is a screen of its own", /href: "\/admin\/drafts"/.test(navList));
// Beside Products, because it is products — not beside Bin, which is what a
// product leaves by.
check(
  "and stands beside Products, not beside Bin",
  /\/admin\/products"[\s\S]{0,400}\/admin\/drafts"[\s\S]{0,200}\/admin\/categories"/.test(navList)
);
const drafts = readFileSync(join(ROOT, "app/admin/drafts/page.tsx"), "utf8");
check('it is drafts, and cannot be filtered into something else', /status: "DRAFT" as const/.test(drafts));
// A column whose every cell reads "Draft", on a screen called Drafts.
check("and does not repeat the word on every row", /showStatus={false}/.test(drafts));
// Everything else is the catalogue's own, so this is a place to stand rather
// than a second thing to learn.
for (const control of ["ListSearch", "SortMenu", "ViewToggle", "PaginationBar", "ProductList"]) {
  check(`it reuses ${control}`, new RegExp(`<${control}`).test(drafts));
}

// The three pages every shop is eventually asked for. Offered, not created:
// a blank privacy policy on a live storefront reads as a promise nobody made.
const policies = readFileSync(join(ROOT, "lib/policy-pages.ts"), "utf8");
check("returns, privacy and terms have starting drafts", /"returns"/.test(policies) && /"privacy"/.test(policies) && /"terms"/.test(policies));
// Written to be edited, not to look finished. A policy that reads as though a
// lawyer wrote it, when none did, is the dangerous kind of placeholder.
check("each one says it is a starting point", /not a finished policy/.test(policies));
check("and leaves every decision in brackets", /\[square brackets\]/.test(policies));
const policyAction = readFileSync(join(ROOT, "app/admin/pages/actions.ts"), "utf8");
check("a policy page arrives unpublished", /isPublished: false/.test(policyAction));
check("and cannot be added twice", /systemKey: policy\.key/.test(policyAction));
// A merchant may already have a page at /p/returns.
check("and does not take an address that is in use", /\$\{policy\.slug\}-policy/.test(policyAction));

// Switching what a shop sells changes what the merchant is asked to fill in.
// Letting someone switch while the store is open invites them to spend an
// evening on a catalogue the storefront is not selling — with customers
// browsing it while they do. So the store closes its doors first.
const gateRule = readFileSync(join(ROOT, "lib/store-type-switch.ts"), "utf8");
check("only a paused store may change type", /case "PAUSED":\s*\n\s*return { allowed: true }/.test(gateRule));
// Ours, not theirs: pausing out of a suspension would be a way to clear it.
check("and a suspension is not something to pause out of", /case "SUSPENDED"/.test(gateRule));
const headerSwitch = readFileSync(join(ROOT, "app/admin/business-type-actions.ts"), "utf8");
// A hidden control is not a rule. The rule is where the write happens.
check("the rule is enforced on the server", /typeSwitchGate\(/.test(headerSwitch));
check("and refuses before writing", /if \(!gate\.allowed\) return/.test(headerSwitch));
const settingsSwitch = readFileSync(join(ROOT, "app/admin/settings/business-type-actions.ts"), "utf8");
// Two actions that both write businessType is two rules waiting to disagree.
check("there is one door, not two", /switchBusinessType\(value\)/.test(settingsSwitch));
check(
  "and the second one writes nothing itself",
  !/prisma\.shop\.update/.test(settingsSwitch)
);
const typeDialog = readFileSync(join(ROOT, "components/admin/business-type-dialog.tsx"), "utf8");
check("the dialog says why, and offers the one thing that helps", /Pause my store/.test(typeDialog));
const typeForm = readFileSync(join(ROOT, "components/admin/business-type-form.tsx"), "utf8");
check("settings says the same thing", /typeSwitchGate\(/.test(typeForm));

// A page's address could not be changed at all, because the address *was* the
// identity: /about loaded the page whose slug was "about".
const pagesData = readFileSync(join(ROOT, "lib/data/pages.ts"), "utf8");
check("a default page is found by its key, not its address", /systemKey/.test(pagesData));
const pageActions = readFileSync(join(ROOT, "app/admin/pages/actions.ts"), "utf8");
check("the address can be edited", /slug: wanted/.test(pageActions));
// Every link anyone already has must keep working.
check("and the old address forwards", /redirect\s*\n?\s*\.upsert/.test(pageActions));
// A menu item carries a written-out href beside the page it links to, and only
// the link follows a move on its own.
check("and every menu that links to it follows", /menuItem\s*\n?\s*\.updateMany/.test(pageActions));
// A redirect that pointed at the old address would now send visitors nowhere.
check("and redirects pointing at it are re-pointed", /toPath: from/.test(pageActions));
const addressRules = readFileSync(join(ROOT, "lib/page-address.ts"), "utf8");
check("one slug rule, shared by the form and the action", /export function toSlug/.test(addressRules));
const pageForm = readFileSync(join(ROOT, "components/admin/page-settings-form.tsx"), "utf8");
check("the address follows the name as it is typed", /if \(!slugTouched && !isHome\) setSlug\(toSlug\(next\)\)/.test(pageForm));
// Once a merchant has written their own address, a typo in the title must not
// move a link they have already shared.
check("and stops the moment it is written by hand", /setSlugTouched\(true\)/.test(pageForm));
// The homepage is the site's front door: there is no part after the slash.
check("the homepage says why it has no address to edit", /front door/.test(pageForm));

// The panel could write a Shopify CSV and not read one, which meant a merchant
// could leave with their catalogue and not arrive with it.
const importDialog = readFileSync(join(ROOT, "components/admin/import-dialog.tsx"), "utf8");
const productsPage = readFileSync(join(ROOT, "app/admin/products/page.tsx"), "utf8");
check(
  "importing is offered beside exporting",
  /<ImportDialog/.test(productsPage) && /Export CSV/.test(productsPage)
);
// Reading a file and writing it are two clicks, because there is no undo for
// "the whole catalogue, slightly wrong".
check("the file is read before anything is written", /planProductImport/.test(importDialog));
check("and writing is a second, separate press", /applyProductImport/.test(importDialog));
check("the plan says what would be overwritten", /to overwrite/.test(importDialog));
const importActions = readFileSync(join(ROOT, "app/admin/products/import/actions.ts"), "utf8");
check("the plan writes nothing", !/planProductImport[\s\S]{0,1400}\.(create|update|createMany|deleteMany)\(/.test(importActions));
check("an import is capped", /MAX_PRODUCTS/.test(importActions) && /MAX_BYTES/.test(importActions));
check("and is scoped to this shop", /shopId,/.test(importActions));

// The search was the same field rendered inside the notifications dropdown —
// 288px wide with overflow:hidden, which clipped the results away entirely.
// Twelve results were found and rendered and not one was visible.
const search = readFileSync(join(ROOT, "components/admin/admin-search.tsx"), "utf8");
check("search is its own overlay", /role="dialog"/.test(search));
check("and nothing above it can clip it", !/overflow-hidden[\s\S]{0,400}<ul/.test(search));
check("and it takes the cursor when it opens", /inputRef\.current\?\.focus\(\)/.test(search));
const topbar = readFileSync(join(ROOT, "components/admin/admin-topbar.tsx"), "utf8");
check("the search button opens it", /setSearching\(true\)/.test(topbar));
check("so does a keyboard", /metaKey \|\| event\.ctrlKey/.test(topbar));

// overflow-x: hidden on html or body makes them a scroll container, and a
// scroll container breaks position: sticky for everything inside it — the top
// bar was declared sticky, computed sticky, and scrolled away regardless.
const pageCss = readFileSync(join(ROOT, "app/globals.css"), "utf8");
check(
  "the page clips sideways without becoming a scrollport",
  !/overflow-x:\s*hidden/.test(pageCss) && /overflow-x:\s*clip/.test(pageCss)
);
// And the mark belongs to the bar, not to the window: fixed left it floating
// over whatever happened to be underneath once the bar had scrolled.
check("the product mark sits inside the bar", !/fixed inset-x-0 top-0[^"]*z-50/.test(topbar));

// The panel is sans-serif. The serif face belongs to the storefront and to a
// full-screen message (an error, a locked door) — never to a heading inside a
// screen, where it read as a different product bolted on. Sections are named by
// SectionDivider, cards by a 13px semibold line.
const serif = files.filter((f) => {
  if (!/(components|app)\/admin\//.test(f)) return false;
  if (/(access-denied|error)\.tsx$/.test(f)) return false;
  return /font-serif/.test(readFileSync(f, "utf8"));
});
check(
  "no serif heading inside a screen",
  serif.length === 0,
  serif.map((f) => relative(ROOT, f)).join(", ")
);

// A switch with no accessible name is a nameless button to a screen reader.
const namelessSwitch = files.filter(
  (f) => /\/components\//.test(f) && /<ToggleSwitch[\s\S]{0,80}label=""/.test(readFileSync(f, "utf8"))
);
check(
  "every switch is named",
  namelessSwitch.length === 0,
  namelessSwitch.map((f) => relative(ROOT, f)).join(", ")
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
