/**
 * Checks the domain rules — `npm run check:domains`.
 *
 * A domain is how a store is found, so the failures here are not cosmetic: a
 * hostname accepted that shouldn't be is a store served under a name its owner
 * doesn't control, and one refused that should be accepted is a merchant who
 * cannot launch. Both are pinned below.
 *
 * Dependency-free and offline — no DNS, no database, so it runs in CI.
 */
import { sourceOf } from "./source-text";
import {
  DNS_TARGET,
  MAX_AUTOMATIC_CHECKS,
  VERIFICATION_RECORD,
  backoffMs,
  domainProblem,
  domainUrl,
  isApex,
  parseDomain,
  requiredRecords,
} from "../lib/domains";
import { PLATFORM_DOMAIN, classifyHost, normaliseHost } from "../lib/shop-context";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};


console.log("\nREAL DOMAINS ARE ACCEPTED");
for (const good of [
  "example.com",
  "shop.example.com",
  "eu.shop.example.com",
  "example.co.uk",
  "my-store.example.com",
  "xn--80ak6aa92e.com",
  "a.io",
  "store123.example.org",
]) {
  check(`${good} is accepted`, domainProblem(good) === null, domainProblem(good) ?? "");
}

console.log("\nTHE INPUT IS CLEANED UP RATHER THAN REFUSED");
// People paste what's in their address bar. Refusing that is pedantry.
const pasted = parseDomain("https://shop.example.com/products?a=1");
check("a pasted URL yields just the hostname",
  pasted.ok && pasted.value === "shop.example.com",
  pasted.ok ? pasted.value : pasted.error);
const shouty = parseDomain("  SHOP.Example.COM  ");
check("case and padding are normalised", shouty.ok && shouty.value === "shop.example.com",
  shouty.ok ? shouty.value : shouty.error);
const trailing = parseDomain("example.com.");
check("a trailing dot is dropped", trailing.ok && trailing.value === "example.com",
  trailing.ok ? trailing.value : trailing.error);
const ported = parseDomain("example.com:443");
check("a port is dropped", ported.ok && ported.value === "example.com",
  ported.ok ? ported.value : ported.error);

console.log("\nNONSENSE IS REFUSED");
for (const [bad, why] of [
  ["", "empty"],
  ["example", "no dot"],
  ["*.example.com", "wildcard"],
  ["exam ple.com", "space"],
  ["under_score.com", "underscore"],
  [".example.com", "leading dot"],
  ["example..com", "double dot"],
  ["-example.com", "leading hyphen"],
  ["example-.com", "trailing hyphen"],
  ["localhost", "local only"],
  ["shop.local", "local only"],
  ["192.168.1.1", "an IP"],
  ["example.c", "one-letter TLD"],
  ["café.com", "non-ascii"],
] as const) {
  check(`${bad || "(empty)"} is refused — ${why}`, domainProblem(bad) !== null);
}
check("a label over 63 characters is refused",
  domainProblem(`${"a".repeat(64)}.com`) !== null);
check("a hostname over 253 characters is refused",
  domainProblem(`${"a".repeat(60)}.${"b".repeat(60)}.${"c".repeat(60)}.${"d".repeat(60)}.${"e".repeat(20)}.com`) !== null);

/**
 * The rule that matters most in this file.
 *
 * Proving you control a name is not the same as being allowed to serve it here.
 * Anyone who could claim the platform's own apex — or anything under it — could
 * put a sign-in page inside our certificate and collect merchants' passwords.
 */
console.log("\nNOBODY CAN CLAIM THE PLATFORM'S OWN NAMES");
check(`${PLATFORM_DOMAIN} itself is refused`, domainProblem(PLATFORM_DOMAIN) !== null);
check("a subdomain of it is refused", domainProblem(`acme.${PLATFORM_DOMAIN}`) !== null);
check("www of it is refused", domainProblem(`www.${PLATFORM_DOMAIN}`) !== null);
check("a deep subdomain of it is refused", domainProblem(`a.b.${PLATFORM_DOMAIN}`) !== null);
check("the refusal explains rather than just says no",
  (domainProblem(PLATFORM_DOMAIN) ?? "").includes("already set up"));
// A lookalike is somebody else's domain and is theirs to use, so it must not be
// refused — the rule is about *our* names, not names that resemble them.
check("a lookalike domain is somebody's real property and is allowed",
  domainProblem(`${PLATFORM_DOMAIN.replace(".", "-")}.com`) === null);

console.log("\nAPEX AND SUBDOMAIN ARE TOLD APART");
check("example.com is an apex", isApex("example.com"));
check("shop.example.com is not", !isApex("shop.example.com"));
check("a.b.example.com is not", !isApex("a.b.example.com"));

console.log("\nTHE RECORDS WE HAND OUT ARE THE ONES DNS NEEDS");
const apexRecords = requiredRecords("example.com", "token-abc");
check("an apex gets exactly two records", apexRecords.length === 2, String(apexRecords.length));
check("an apex gets an A record, because a CNAME is not legal there",
  apexRecords.some((r) => r.type === "A" && r.name === "@" && r.value === DNS_TARGET.a));
check("its TXT record sits at the root", apexRecords.some(
  (r) => r.type === "TXT" && r.name === VERIFICATION_RECORD && r.value === "token-abc"));

const subRecords = requiredRecords("shop.example.com", "token-def");
check("a subdomain gets a CNAME",
  subRecords.some((r) => r.type === "CNAME" && r.name === "shop" && r.value === DNS_TARGET.cname));
check("its TXT record is scoped to that subdomain",
  subRecords.some((r) => r.type === "TXT" && r.name === `${VERIFICATION_RECORD}.shop`));

// The registrar's name field is relative to the zone. Taking only the first
// label would put the record one level too high, where nothing would find it.
const deepRecords = requiredRecords("eu.shop.example.com", "token-ghi");
check("a multi-level subdomain keeps every label in the record name",
  deepRecords.some((r) => r.type === "CNAME" && r.name === "eu.shop"),
  deepRecords.find((r) => r.type === "CNAME")?.name);
check("and its TXT record too",
  deepRecords.some((r) => r.type === "TXT" && r.name === `${VERIFICATION_RECORD}.eu.shop`));

console.log("\nEVERY RECORD EXPLAINS ITSELF");
for (const record of [...apexRecords, ...subRecords]) {
  check(`the ${record.type} record for ${record.name} says what it's for`,
    record.purpose.length > 10 && record.purpose.endsWith("."));
}
check("the verification record is a TXT record",
  apexRecords.find((r) => r.name.startsWith(VERIFICATION_RECORD))?.type === "TXT");
check("the verification record name is underscore-prefixed, so it can't collide with a real host",
  VERIFICATION_RECORD.startsWith("_"));

console.log("\nCHECKING BACKS OFF RATHER THAN HAMMERING A REGISTRAR");
check("the first retry is soon", backoffMs(0) <= 60_000, String(backoffMs(0)));
check("each failure waits longer", backoffMs(3) > backoffMs(1));
check("it is capped", backoffMs(50) === backoffMs(9));
check("and the cap is hours, not days", backoffMs(50) <= 6 * 60 * 60 * 1000);
check("checking eventually stops altogether", MAX_AUTOMATIC_CHECKS > 0 && MAX_AUTOMATIC_CHECKS <= 50);

console.log("\nHOST CLASSIFICATION AGREES WITH THE DOMAIN RULES");
// If these two disagreed, a hostname could be accepted as a custom domain and
// then classified as a platform host, or the reverse — and the shop would be
// unreachable at an address the admin says is live.
check("a custom domain classifies as custom",
  classifyHost("example.com").kind === "custom");
check("a platform subdomain classifies as a subdomain",
  classifyHost(`acme.${PLATFORM_DOMAIN}`).kind === "subdomain");
check("every hostname the domain rules accept is classified custom",
  ["example.com", "shop.example.com", "example.co.uk"].every(
    (h) => domainProblem(h) === null && classifyHost(h).kind === "custom"
  ));
check("nothing the domain rules accept is classified as the platform",
  !["example.com", "shop.example.com"].some((h) => classifyHost(h).kind === "platform"));

console.log("\nURLS ARE HTTPS, ALWAYS");
check("a domain URL is https", domainUrl("example.com") === "https://example.com");
check("it normalises on the way out", domainUrl("  Example.COM  ") === "https://example.com");

console.log("\nTHE HOSTING SEAM STAYS A SEAM");
const hostingIndex = sourceOf("lib", "hosting", "index.ts");
// The whole point of the adapter is that nothing above it names a vendor.
check("the domain data layer names no vendor",
  !/vercel|cloudflare/i.test(sourceOf("lib", "data", "domains.ts")));
check("the admin actions name no vendor",
  !/vercel|cloudflare/i.test(sourceOf("app", "admin", "domains", "actions.ts")));
check("the provider is chosen by configuration", hostingIndex.includes("HOSTING_PROVIDER"));
check("an unconfigured production deploy warns rather than pretending",
  hostingIndex.includes("NODE_ENV") && hostingIndex.includes("console.warn"));

console.log("\nRESOLUTION ONLY SERVES PROVEN DOMAINS");
const shopData = sourceOf("lib", "data", "shop.ts");
// A PENDING row is nothing but somebody having typed a name into a box.
check("a pending domain does not resolve to a shop",
  shopData.includes('status: { in: ["VERIFIED", "ACTIVE"] }'));
check("the canonical host falls back to the free address, so it is never empty",
  shopData.includes("PLATFORM_DOMAIN"));

console.log("\nSEO IS PER SHOP, NOT PER PLATFORM");
const sitemap = sourceOf("app", "sitemap.ts");
// This one was a real cross-tenant leak: an unscoped findMany published every
// merchant's product slugs in every merchant's sitemap.
check("the sitemap is scoped to one shop", sitemap.includes("forShop("));
check("the sitemap never queries prisma directly", !/prisma\.\w+\.find/.test(sitemap));
check("the sitemap uses the shop's canonical URL", sitemap.includes("canonicalUrl"));
check("a shut store publishes no sitemap", sitemap.includes("isServingCustomers"));

const robots = sourceOf("app", "robots.ts");
check("robots keeps crawlers off non-canonical hosts", robots.includes("canonicalHost"));
check("robots keeps crawlers out of a shut store", robots.includes("isServingCustomers"));
check("robots hides the merchant sign-in", robots.includes("/merchant"));

console.log("\nNORMALISATION IS THE SAME EVERYWHERE");
// Two spellings of one host that normalise differently is how a domain gets
// verified under one form and looked up under another.
for (const host of ["Example.COM", "example.com.", "example.com:3000", "  example.com "]) {
  check(`${host} normalises to example.com`, normaliseHost(host) === "example.com",
    normaliseHost(host));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exitCode = 1;
