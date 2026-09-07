/**
 * Checks the holding page tells the truth — `npm run check:holding`.
 *
 * The screen has one job: say what a customer will see when the store is shut.
 * Every fault it can have is a fault of honesty rather than of rendering, and
 * none of them look wrong on screen:
 *
 *   Two switches, one write. maintenanceMode moved from Preferences to this
 *   screen. If the visibility form still carried it, saving a blocked country
 *   would silently turn a merchant's store back on, because that form writes
 *   every field it holds.
 *
 *   Words the merchant may not write. "Closed" and "suspended" are ours: a
 *   store that has shut for good must not tell someone waiting on an order to
 *   check back later, and a suspension is not the merchant's to explain away.
 *
 *   A promise nobody can keep. "Tell me when you reopen" must not appear on a
 *   permanently closed store, or on the page shown to a blocked country, where
 *   the store is open and simply will not serve them.
 *
 *   Defaults in two places. The column defaults in the schema and the ones the
 *   app falls back on for a shop with no settings row must agree, or two
 *   identical shops render different pages depending on whether either has
 *   ever pressed save.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  DEFAULT_WORDS,
  HOLDING_PAGE_COLUMN_DEFAULTS,
  MERCHANT_WRITABLE,
  resolveHolding,
  emailProblem,
  normaliseEmail,
} from "../lib/holding-page";

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
// One switch, in one place
// ---------------------------------------------------------------------------

const visibility = read("lib/visibility.ts");
const prefsAction = read("app/admin/preferences/actions.ts");
const visibilityForm = read("components/admin/visibility-form.tsx");

check(
  "the Visibility type no longer carries maintenanceMode",
  !/^\s*maintenanceMode/m.test(visibility),
  "it moved to the maintenance screen; a copy here would be overwritten on every visibility save"
);
check(
  "saveVisibility does not write maintenanceMode",
  !/maintenanceMode:/.test(prefsAction),
  "saving a blocked country would turn the store back on"
);
check(
  "the visibility form has no maintenance toggle",
  !/maintenanceMode/.test(visibilityForm)
);
check(
  "the maintenance action is the only thing that writes it",
  /maintenanceMode/.test(read("app/admin/maintenance-actions.ts"))
);

// ---------------------------------------------------------------------------
// Whose words are whose
// ---------------------------------------------------------------------------

const page = {
  heading: "MERCHANT HEADING",
  message: "MERCHANT MESSAGE",
  logoUrl: "https://example.com/merchant.png",
  showLogo: true,
  signups: true,
};

for (const reason of ["maintenance", "paused"] as const) {
  const out = resolveHolding(reason, page, "https://example.com/theme.png");
  check(`${reason} shows the merchant's heading`, out.heading === "MERCHANT HEADING");
  check(`${reason} shows the merchant's message`, out.message === "MERCHANT MESSAGE");
  check(`${reason} may offer the signup box`, out.offerSignup === true);
  check(`${reason} may show a logo`, out.logoUrl === "https://example.com/merchant.png");
}

for (const reason of ["closed", "suspended", "blocked"] as const) {
  const out = resolveHolding(reason, page, "https://example.com/theme.png");
  check(
    `${reason} keeps our heading`,
    out.heading === DEFAULT_WORDS[reason].heading,
    `got "${out.heading}"`
  );
  check(`${reason} keeps our message`, out.message === DEFAULT_WORDS[reason].message);
  check(
    `${reason} never offers to tell them when we reopen`,
    out.offerSignup === false,
    "a closed store cannot keep that promise, and a blocked visitor has no event to wait for"
  );
  check(`${reason} shows no merchant logo`, out.logoUrl === null);
  check(`${reason} is not in MERCHANT_WRITABLE`, !MERCHANT_WRITABLE.has(reason));
}

// ---------------------------------------------------------------------------
// Falling back per field, not per page
// ---------------------------------------------------------------------------

const headingOnly = { ...page, message: "   " };
const both = resolveHolding("paused", headingOnly, "");
check("a written heading survives an empty message", both.heading === "MERCHANT HEADING");
check(
  "an empty message falls back to ours",
  both.message === DEFAULT_WORDS.paused.message,
  "the fallback is per field, so half-written is not all-lost"
);

const whitespace = resolveHolding("paused", { ...page, heading: "  \n " }, "");
check("a heading of only whitespace counts as empty", whitespace.heading === DEFAULT_WORDS.paused.heading);

check(
  "no logo falls back to the theme's",
  resolveHolding("paused", { ...page, logoUrl: "" }, "https://t/logo.png").logoUrl ===
    "https://t/logo.png"
);
check(
  "turning the logo off beats both",
  resolveHolding("paused", { ...page, showLogo: false }, "https://t/logo.png").logoUrl === null
);

// ---------------------------------------------------------------------------
// The defaults agree with the schema
// ---------------------------------------------------------------------------

const schema = read("prisma/schema.prisma");
const EXPECTED: Record<string, string> = {
  maintenanceMode: "false",
  maintenanceHeading: '""',
  maintenanceMessage: '""',
  maintenanceLogoUrl: '""',
  maintenanceShowLogo: "true",
  maintenanceSignups: "false",
};

for (const [column, expected] of Object.entries(EXPECTED)) {
  const declared = new RegExp(`${column}\\s+\\w+\\s+@default\\(([^)]*)\\)`).exec(schema)?.[1];
  check(`${column} is declared in the schema`, declared !== undefined);
  if (declared === undefined) continue;
  check(
    `${column}'s fallback matches its column default`,
    declared.trim() === expected.trim(),
    `schema says ${declared}, the app falls back on ${expected}`
  );
  check(
    `${column} has a fallback for a shop with no settings row`,
    column in HOLDING_PAGE_COLUMN_DEFAULTS,
    "otherwise a shop that never pressed save renders a different page"
  );
}

// The words the merchant never sees are still the words we ship.
const storefront = read("app/(storefront)/maintenance/page.tsx");
check(
  "the storefront page resolves rather than hard-coding",
  /resolveHolding/.test(storefront) && !/We'll be right back/.test(storefront),
  "the wording lives in lib/holding-page.ts so both the page and the preview read the same copy"
);

// ---------------------------------------------------------------------------
// The public endpoint is gated
// ---------------------------------------------------------------------------

const action = read("app/(storefront)/maintenance/actions.ts");
for (const [what, present] of [
  ["checks the store is actually shut", /storefrontClosure/.test(action)],
  ["refuses reasons the merchant cannot write for", /"maintenance" && reason !== "paused"|reason !== "maintenance"/.test(action)],
  ["requires the merchant to have turned it on", /maintenanceSignups/.test(action)],
  ["carries the honeypot", /looksAutomated/.test(action)],
  ["is rate limited", /rateLimit\("reopenSignup"/.test(action)],
  ["stores the address lowercased", /normaliseEmail/.test(action)],
  ["does not create a second row for the same address", /upsert/.test(action)],
] as const) {
  check(`the signup action ${what}`, present);
}

check(
  "signing up twice does not move the consent time",
  /update: \{\}/.test(action),
  "an empty update is what keeps the original createdAt"
);

// ---------------------------------------------------------------------------
// Addresses
// ---------------------------------------------------------------------------

for (const [value, shouldPass] of [
  ["", false],
  ["   ", false],
  ["a@b", false],
  ["no-at-sign.com", false],
  ["a@b.c", true],
  ["someone@example.com", true],
] as const) {
  check(
    `"${value}" is ${shouldPass ? "accepted" : "refused"}`,
    (emailProblem(value) === null) === shouldPass
  );
}
check("addresses are stored lowercase", normaliseEmail("  A.B@Example.COM ") === "a.b@example.com");

// ---------------------------------------------------------------------------
// The screen is reachable
// ---------------------------------------------------------------------------

const nav = read("lib/admin-nav.ts");
check("Maintenance is a tab under Your App", /\/admin\/maintenance/.test(nav));
check(
  "it sits inside the Your App section",
  nav.indexOf("/admin/maintenance") > nav.indexOf('label: "Your App"') &&
    nav.indexOf("/admin/maintenance") < nav.indexOf('label: "Preferences"'),
  "it is a page on the storefront, not a preference"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
