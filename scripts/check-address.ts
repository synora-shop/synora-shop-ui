/**
 * Checks a shop's address can move without breaking anything —
 * `npm run check:address`.
 *
 * A store's free address is derived from its name, so renaming the shop moves
 * the storefront's public URL. That is three dangerous things at once: it can
 * take a live site off the air, it can break every link anyone has shared, and
 * it can collide with somebody else's address.
 *
 * The rules, and what each is protecting against:
 *
 *   A merchant's own domain is never touched. Someone who connected acme.com
 *   has an address with nothing to do with their store's name, and renaming the
 *   shop must not deactivate it or move the canonical URL off it. The free
 *   address moves underneath it.
 *
 *   The question is not skippable. There is no sensible default for the old
 *   address: keeping it would hold names forever on behalf of shops that did
 *   not want them, dropping it would break shared links silently. So the dialog
 *   has two answers, no cancel, and no way to click past it.
 *
 *   A retired address still resolves, when that is what was chosen. Otherwise
 *   every bookmark, shared link and search result pointing at the old name dies
 *   the moment somebody renames their shop.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { subdomainProblem, suggestSubdomain } from "../lib/shop-context";

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
// The address a name suggests
// ---------------------------------------------------------------------------

for (const [name, expected] of [
  ["Bashinda", "bashinda"],
  ["Bashinda Studio", "bashinda-studio"],
  ["  Bashinda  ", "bashinda"],
  ["Café Ünïcode", "cafe-unicode"],
  ["Shop &&& Co", "shop-co"],
  ["A", ""],
  ["", ""],
] as const) {
  check(`"${name}" suggests "${expected}"`, suggestSubdomain(name) === expected, suggestSubdomain(name));
}

check(
  "a suggestion is never something the rules would refuse",
  ["Bashinda", "Bashinda Studio", "My Great Shop", "Étoile"].every((n) => {
    const s = suggestSubdomain(n);
    return s === "" || subdomainProblem(s) === null;
  }),
  "the form would offer an address and then refuse to save it"
);

check("a reserved word is not suggested", suggestSubdomain("Admin") === "");
check("an address cannot be reserved", subdomainProblem("admin") !== null);
check("an address cannot be all digits", subdomainProblem("12345") !== null);
check("an address cannot start with a hyphen", subdomainProblem("-shop") !== null);
check("an address cannot hold two hyphens in a row", subdomainProblem("a--b") !== null);
check("an ordinary address is fine", subdomainProblem("bashinda") === null);

// ---------------------------------------------------------------------------
// The move itself
// ---------------------------------------------------------------------------

const domains = read("lib/data/domains.ts");

check("there is a function that moves the address", /export async function moveFreeAddress/.test(domains));
check(
  "it refuses an address another shop holds",
  /That address is taken/.test(domains),
  "the unique index would otherwise surface as a constraint violation"
);
check(
  "it checks retired rows as well as live shops",
  /prisma\.domain\.findUnique\(\{\s*where: \{ hostname: to \}/.test(domains),
  "an address left behind by somebody else's rename is still taken"
);
check(
  "the whole move is one transaction",
  /await prisma\.\$transaction\(async \(tx\) => \{[\s\S]*?tx\.shop\.update/.test(domains),
  "a shop renamed without its domain row is a store with no address"
);
check(
  "a kept address stops being the platform one",
  /isPlatform: false, isPrimary: false/.test(domains),
  "ensurePlatformDomain would otherwise find two and repair the wrong one"
);
check(
  "the new address inherits primary rather than assuming it",
  /isPrimary: old\.isPrimary/.test(domains),
  "assuming true would move the canonical URL off a merchant's own domain"
);

// ---------------------------------------------------------------------------
// The way back
// ---------------------------------------------------------------------------

check(
  "moving onto an address that already exists reuses its row",
  /const target = await tx\.domain\.findUnique/.test(domains),
  "reverting is exactly this case, and creating a second row for one hostname violates the unique index — which is what happened the first time, and only showed when the button was pressed"
);
check(
  "the row being moved onto is promoted, not duplicated",
  /if \(target\) \{\s*await tx\.domain\.update\(\{ where: \{ id: target\.id \}/.test(domains)
);
check(
  "and on a move that keeps nothing, the stale row is removed first",
  /if \(target\) await tx\.domain\.delete/.test(domains),
  "otherwise the rename collides with it"
);
check(
  "the old address is demoted before the new one is promoted",
  domains.indexOf("isPlatform: false, isPrimary: false") <
    domains.indexOf("isPrimary: old.isPrimary"),
  "the database refuses two primaries for one shop, even mid-transaction"
);

const actions = read("app/admin/domain-actions.ts");
check("there is a revert action", /export async function revertToAddress/.test(actions));
check(
  "it only accepts an address this shop used to have",
  /isFormerAddress\(target\)/.test(actions),
  "a custom domain is not something to 'go back' to"
);
check(
  "and reverting keeps the address it is leaving",
  /moveFreeAddress\(me\.shop\.id, sub, \{ keepOld: true \}\)/.test(actions),
  "time passed and links were made on the newer name; reverting is not undoing"
);
check("the revert is recorded", /shop\.address\.revert/.test(actions));

const manager = read("components/admin/domain-manager.tsx");
check("a former address is marked as one", /previous address/.test(manager));
check("and offers the way back", /Use this again/.test(manager));
check(
  "a former address is not offered DNS records",
  /!domain\.isPlatform && !former && \(/.test(manager),
  "records for a hostname on our own zone are nonsense to show a merchant"
);
check(
  "nor made the main address",
  /!domain\.isPrimary && !former &&/.test(manager),
  "a former address as the canonical one, while the shop sits on another name, is a contradiction"
);

const helpers = read("lib/domains.ts");
check("a former address is told apart by shape", /export function isFormerAddress/.test(helpers));
check(
  "and never confused with the current free one",
  /if \(domain\.isPlatform\) return false;/.test(helpers)
);
check(
  "its subdomain can be read back out",
  /export function subdomainOf/.test(helpers)
);

// ---------------------------------------------------------------------------
// A retired address still resolves
// ---------------------------------------------------------------------------

const shopData = read("lib/data/shop.ts");
check(
  "an unmatched subdomain falls back to the domain table",
  /retired/.test(shopData) && /prisma\.domain\.findFirst/.test(shopData),
  "without it every link shared before a rename 404s"
);
check(
  "and only for domains that are actually serving",
  /status: \{ in: \["VERIFIED", "ACTIVE"\] \}/.test(shopData)
);

// ---------------------------------------------------------------------------
// The question cannot be waved away
// ---------------------------------------------------------------------------

const dialog = read("components/ui/confirm-dialog.tsx");
check("a dialog can refuse to be dismissed", /dismissable\?: boolean/.test(dialog));
check(
  "the scrim does nothing on one that refuses",
  /pending\.dismissable === false \|\| close\("cancel"\)/.test(dialog)
);
check(
  "and it offers no cancel",
  /pending\.dismissable !== false && \(/.test(dialog),
  "a cancel button is a way to skip a question that has no default"
);

const form = read("components/admin/store-identity-form.tsx");
check("the address question is asked", /What should happen to your old address/.test(form));
check("and cannot be dismissed", /dismissable: false/.test(form));
check(
  "availability is checked before the question, not after",
  form.indexOf("checkAddressAvailable") < form.indexOf("What should happen to your old address"),
  "nobody should answer a dialog about an address they were never going to get"
);
check(
  "the address follows the name until the merchant edits it",
  /addressTouched/.test(form),
  "otherwise a hand-picked address is overwritten by the next rename"
);
check(
  "the form says what saving will do before it is pressed",
  /Saving moves your store to/.test(form),
  "the change should be visible on screen, not sprung in a dialog"
);
check(
  "a live custom domain is named in the question",
  /is your own domain and is not affected/.test(form)
);

const identity = read("app/admin/identity-actions.ts");
check(
  "the address is written before anything else",
  identity.indexOf("moveFreeAddress") < identity.indexOf("prisma.$transaction"),
  "it is the one field that can fail for a reason the merchant cannot see coming"
);
check("the choice reaches the action", /keepOldAddress/.test(identity));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
