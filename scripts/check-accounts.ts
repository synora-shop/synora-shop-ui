/**
 * Checks the account and access rules — `npm run check:accounts`.
 *
 * These are the rules that decide who can get into a store. A mistake here is
 * not a bug a merchant works around; it is somebody in an account that is not
 * theirs. So the properties are pinned rather than assumed: tokens are random
 * and hashed, limits actually refuse, and no message reveals whether an address
 * is registered.
 *
 * Dependency-free and offline — no database, so it runs in CI on every push.
 */
import { readFileSync } from "fs";
import { join } from "path";
import { sourceOf } from "./source-text";
import {
  createToken,
  hashToken,
  tokensMatch,
  expiryFor,
  createNumericCode,
  TOKEN_TTL,
} from "../lib/tokens";
import { LIMITS, humanise } from "../lib/rate-limit";
import { diff } from "../lib/audit";
import { ROLE_RANK, type MemberRole } from "../lib/roles";
import {
  canAcceptInvite,
  canChangeRole,
  canGrant,
  canRemove,
  canTransferOwnership,
  type Actor,
  type Target,
} from "../lib/staff-rules";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};

console.log("\nTOKENS ARE UNGUESSABLE");
const a = createToken();
const b = createToken();
check("two tokens differ", a.token !== b.token);
check("a token is long enough to be unguessable", a.token.length >= 40, String(a.token.length));
check("it is url-safe", /^[A-Za-z0-9_-]+$/.test(a.token), a.token.slice(0, 12));
// 1000 samples is not proof of randomness, but a generator that repeats or
// falls into a small space fails it immediately.
check("1000 tokens are all distinct", (() => {
  const seen = new Set<string>();
  for (let i = 0; i < 1000; i++) seen.add(createToken().token);
  return seen.size === 1000;
})());

console.log("\nONLY THE HASH IS EVER STORED");
check("the hash is not the token", a.tokenHash !== a.token);
check("hashing is deterministic", hashToken(a.token) === a.tokenHash);
check("the hash is sha-256 shaped", /^[0-9a-f]{64}$/.test(a.tokenHash));
check("a different token hashes differently", hashToken("x") !== hashToken("y"));
// The point of hashing at rest: a database dump must not yield working links.
check("the token cannot be recovered from the hash", !a.tokenHash.includes(a.token.slice(0, 8)));

console.log("\nCOMPARISON DOES NOT LEAK");
check("identical hashes match", tokensMatch(a.tokenHash, a.tokenHash));
check("different hashes do not", !tokensMatch(a.tokenHash, b.tokenHash));
check("different lengths do not throw", tokensMatch("short", "much longer value") === false);

console.log("\nLINKS EXPIRE, AND SOONER WHEN THEY MATTER MORE");
const now = Date.now();
check("verification expiry is in the future", expiryFor("EMAIL_VERIFICATION").getTime() > now);
// A reset link is the dangerous one: it is the window in which a stolen inbox
// becomes a stolen account.
check("a reset link expires sooner than a verification link",
  TOKEN_TTL.PASSWORD_RESET < TOKEN_TTL.EMAIL_VERIFICATION);
check("a reset link lasts at most an hour", TOKEN_TTL.PASSWORD_RESET <= 60 * 60 * 1000);
check("an invite outlives both, since people forward them",
  TOKEN_TTL.STAFF_INVITE > TOKEN_TTL.EMAIL_VERIFICATION);
check("nothing lasts more than a week", Object.values(TOKEN_TTL).every((t) => t <= 7 * 24 * 3600 * 1000));

console.log("\nNUMERIC CODES");
check("a code is six digits", /^\d{6}$/.test(createNumericCode()));
check("length is configurable", createNumericCode(4).length === 4);
check("leading zeros are kept", (() => {
  for (let i = 0; i < 500; i++) if (createNumericCode().length !== 6) return false;
  return true;
})());
check("codes vary", new Set(Array.from({ length: 200 }, () => createNumericCode())).size > 150);

console.log("\nEVERY LIMIT ACTUALLY LIMITS");
for (const [name, limit] of Object.entries(LIMITS)) {
  check(`${name} allows a finite number of attempts`, limit.max > 0 && limit.max <= 20, String(limit.max));
  check(`${name} has a window`, limit.windowMs > 0);
  check(`${name} blocks for a while after tripping`, limit.blockMs > 0);
}
// Sign-in is the one an attacker grinds. It allows more attempts than the
// mail-sending limits because people genuinely mistype passwords — what
// matters is that the rate makes online guessing pointless, not that it is the
// smallest number on the list.
const loginPerHour = LIMITS.login.max * (3600_000 / LIMITS.login.windowMs);
check("login allows far too few attempts per hour to guess a password",
  loginPerHour <= 40, `${loginPerHour}/hour`);
check("a tripped login lock lasts long enough to matter",
  LIMITS.login.blockMs >= 10 * 60 * 1000);

console.log("\nWAITS ARE EXPLAINED IN WORDS, NOT SECONDS");
check("under a minute reads in seconds", humanise(30) === "30 seconds");
check("a minute reads as one", humanise(60) === "1 minute");
check("plurals are right", humanise(120) === "2 minutes" && humanise(7200) === "2 hours");
check("an hour reads as one", humanise(3600) === "1 hour");

/**
 * The single most important property in this file.
 *
 * Any message that differs depending on whether an address is registered is a
 * free membership check against a leaked address list. Signup, reset and resend
 * must all answer identically either way.
 */
console.log("\nNOTHING REVEALS WHETHER AN ACCOUNT EXISTS");
const accountsRaw = readFileSync(join(process.cwd(), "app", "merchant", "actions.ts"), "utf8");
// Comments are stripped first: this file *explains* the leak it avoids, and
// matching that explanation would fail the check for saying the right thing.
const accounts = sourceOf("app", "merchant", "actions.ts");
for (const phrase of [
  "No account", "no account", "not registered", "doesn't exist", "does not exist",
  "unknown email", "Unknown email", "not found",
]) {
  check(`never says "${phrase}"`, !accounts.includes(phrase));
}
check("reset speaks conditionally", accounts.includes("If there's an account"));
check("resend speaks conditionally", accounts.includes("If that address needs confirming"));
check("signup answers the same when the address is taken",
  accounts.includes("Check your email to finish setting up your store."));

console.log("\nPASSWORD RULES FAVOUR LENGTH OVER SYMBOLS");
check("a minimum length is set", accountsRaw.includes("MIN_PASSWORD = 10"));
// Character-class rules push people to "Password1!" and away from passphrases.
check("no character-class requirements are imposed",
  !/must contain.*uppercase|\[A-Z\].*required/i.test(accounts));
check("changing a password invalidates other sessions",
  accounts.includes("sessionsValidFrom"));
check("resetting a password invalidates other sessions",
  (accounts.match(/sessionsValidFrom/g) ?? []).length >= 3);
check("changing a password requires the current one",
  accounts.includes("That's not your current password."));

console.log("\nSTAFF RULES");
// Exercised rather than grepped for. Checking that the source contains a
// sentence proves the words exist, not that the rule holds; these are the
// combinations somebody will eventually try on a real shop.
const ROLES: MemberRole[] = ["OWNER", "ADMIN", "STAFF", "VIEWER"];
const owner: Actor = { userId: "u-owner", role: "OWNER" };
const admin: Actor = { userId: "u-admin", role: "ADMIN" };
const staffer: Actor = { userId: "u-staff", role: "STAFF" };
const viewer: Actor = { userId: "u-viewer", role: "VIEWER" };
const other = (role: MemberRole): Target => ({ userId: `u-other-${role}`, role });

console.log("  · nobody can grant access above their own");
check("an admin cannot appoint an owner", canGrant(admin, "OWNER") !== null);
check("even an owner cannot appoint a second owner", canGrant(owner, "OWNER") !== null);
check("an admin cannot appoint another admin", canGrant(admin, "ADMIN") !== null);
check("an admin can appoint staff", canGrant(admin, "STAFF") === null);
check("staff cannot appoint staff", canGrant(staffer, "STAFF") !== null);
check("a viewer can appoint nobody", ROLES.every((r) => canGrant(viewer, r) !== null));
// The general form of the rule, over every combination rather than the few
// worth naming: no actor below owner may ever produce a peer or a superior.
check("no non-owner can ever grant at or above their own level",
  [admin, staffer, viewer].every((actor) =>
    ROLES.filter((r) => ROLE_RANK[r] >= ROLE_RANK[actor.role]).every(
      (r) => canGrant(actor, r) !== null
    )
  ));

console.log("  · the owner is protected");
check("the owner's role cannot be edited",
  ROLES.every((r) => canChangeRole(owner, other("OWNER"), r) !== null));
check("an admin cannot remove the owner", canRemove(admin, other("OWNER")) !== null);
// Losing the owner is the one change with no route back that doesn't involve
// support, so it is refused from every direction, including their own.
check("nobody at all can remove an owner",
  [owner, admin, staffer, viewer].every((a) => canRemove(a, other("OWNER")) !== null));
check("an owner cannot remove themselves",
  canRemove(owner, { userId: owner.userId, role: "OWNER" }) !== null);

console.log("  · you cannot act on yourself");
check("you cannot change your own access",
  canChangeRole(admin, { userId: admin.userId, role: "ADMIN" }, "STAFF") !== null);
check("you cannot remove yourself",
  canRemove(admin, { userId: admin.userId, role: "ADMIN" }) !== null);

console.log("  · peers cannot act on peers");
check("an admin cannot demote another admin",
  canChangeRole(admin, other("ADMIN"), "VIEWER") !== null);
check("an admin cannot remove another admin", canRemove(admin, other("ADMIN")) !== null);
check("an owner can demote an admin", canChangeRole(owner, other("ADMIN"), "STAFF") === null);
check("an owner can remove an admin", canRemove(owner, other("ADMIN")) === null);
check("an admin can remove staff", canRemove(admin, other("STAFF")) === null);

console.log("  · handing over a shop");
const ready = {
  userId: "u-next",
  role: "ADMIN" as MemberRole,
  joined: true,
  emailVerified: true,
  email: "next@example.com",
};
check("an owner can hand over to a joined, confirmed member",
  canTransferOwnership(owner, ready) === null);
check("an admin cannot hand over a shop", canTransferOwnership(admin, ready) !== null);
check("you cannot hand it to yourself",
  canTransferOwnership(owner, { ...ready, userId: owner.userId }) !== null);
check("not to someone who never accepted their invitation",
  canTransferOwnership(owner, { ...ready, joined: false }) !== null);
// A typo in an invited address plus an unverified transfer equals a store
// handed to a stranger, with no way to get it back.
check("not to an address nobody has confirmed",
  canTransferOwnership(owner, { ...ready, emailVerified: false }) !== null);
check("and the refusal names the address, so the mistake is findable",
  canTransferOwnership(owner, { ...ready, emailVerified: false })?.includes(ready.email) === true);

console.log("  · an invitation is to an address, not to a link");
check("signed out, you cannot accept", canAcceptInvite(null, "a@example.com") !== null);
check("the invited address can accept", canAcceptInvite("a@example.com", "a@example.com") === null);
check("a forwarded link does not work for someone else",
  canAcceptInvite("b@example.com", "a@example.com") !== null);
check("case and stray spaces don't lock the right person out",
  canAcceptInvite("  A@Example.COM ", "a@example.com") === null);
check("the refusal says which address it was for",
  canAcceptInvite("b@example.com", "a@example.com")?.includes("a@example.com") === true);

console.log("  · the writes these rules guard");
const staff = sourceOf("app", "admin", "staff", "actions.ts");
// Ownership is two rows changing together. Halfway through, a shop has either
// two owners or none, and nothing else here is written to expect that.
check("ownership transfer moves both rows in one transaction", staff.includes("$transaction"));
check("accepting an invite is rate limited", staff.includes('rateLimit("inviteAccept"'));
check("the actions defer to the rules rather than restating them",
  staff.includes("@/lib/staff-rules") && !staff.includes("ROLE_RANK["));

console.log("\nPUBLIC ENDPOINTS ARE THROTTLED");
const enquiry = sourceOf("app", "enquiry", "actions.ts");
check("the enquiry form is rate limited", enquiry.includes('rateLimit("enquiry"'));
check("it is limited per shop as well as per address", enquiry.includes("currentShopId()}:${ip}"));
const authFile = sourceOf("auth.ts");
check("sign-in is rate limited", authFile.includes('rateLimit("login"'));
check("a successful sign-in clears the counter", authFile.includes('clearRateLimit("login"'));
check("sign-in is limited by address, not only by IP", authFile.includes('rateLimit("login", email)'));

console.log("\nAUDIT DIFFS STAY READABLE AND SAFE");
check("only changed fields are recorded",
  JSON.stringify(diff({ a: 1, b: 2 }, { a: 1, b: 3 })) === '{"b":{"from":2,"to":3}}');
check("an unchanged object yields nothing", Object.keys(diff({ a: 1 }, { a: 1 })).length === 0);
// A log that quietly captures a password hash is a second copy of the thing
// you were protecting.
check("password hashes are never logged",
  Object.keys(diff({ passwordHash: "x" }, { passwordHash: "y" })).length === 0);
check("timestamps are not noise in the log",
  Object.keys(diff({ updatedAt: 1 }, { updatedAt: 2 })).length === 0);
check("added and removed keys are both caught",
  "c" in diff({ a: 1 }, { a: 1, c: 3 }));

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exitCode = 1;
