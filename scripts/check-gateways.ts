/**
 * Checks the payment gateway engine cannot be talked into paying an order —
 * `npm run check:gateways`.
 *
 * A gateway's notification endpoint is public and unauthenticated. It has to
 * be: the provider's servers must reach it and cannot authenticate to us. So
 * everything arriving there is a claim by a stranger, and the widely-copied
 * integrations treat that claim as proof — the most-used PayFast library marks
 * an order paid on any POST carrying a transaction id, and the field PayFast
 * calls SIGNATURE is filled with random hex by its own reference SDKs.
 *
 * This file is the standing argument that we do not do that. What it holds up:
 *
 *   1. Sealed credentials really are sealed: a wrong key, a wrong owner or one
 *      altered byte all fail rather than opening.
 *   2. Only the verification path can mark a payment confirmed, and it does so
 *      by asking the provider — never by reading the request.
 *   3. The amount and currency are compared before anything is confirmed.
 *   4. A confirmation is claimed conditionally, so two callbacks confirm once.
 *   5. The callback endpoint reads nothing from the body but a reference, and
 *      answers the same way to everyone.
 *   6. Going live needs a test payment that actually happened.
 *   7. A gateway in test mode is never offered to a customer.
 *   8. Unpaid orders give back everything they took, not just the stock.
 *   9. No credential is ever rendered, returned or logged.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { randomBytes } from "crypto";
import * as crypto from "../lib/payments/crypto";
import { checkoutMethods, checkoutMethodValues } from "../lib/payment-methods";
import {
  providerSupportsCurrency,
  RESERVATION_MS,
  isGatewayProvider,
} from "../lib/payments/providers";

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

/** Every source file, so an invariant cannot be dodged by adding a new one. */
function sources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(ROOT, dir))) {
    if (entry === "node_modules" || entry === ".next" || entry === "generated") continue;
    const full = join(dir, entry);
    if (statSync(join(ROOT, full)).isDirectory()) sources(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}
const ALL = [...sources("app"), ...sources("lib"), ...sources("components")];

// ---------------------------------------------------------------------------
// 1. Sealing a credential
// ---------------------------------------------------------------------------

// Set here rather than in the environment: lib/payments/crypto.ts reads the
// variable on every call, deliberately, so an instance that started before it
// was configured is not broken until it is recycled.
process.env.PAYMENT_KEYS = `1:${randomBytes(32).toString("base64")}`;

const ctx = crypto.credentialContext("shop_a", "PAYFAST");
const other = crypto.credentialContext("shop_b", "PAYFAST");
const secret = JSON.stringify({ merchantId: "M1", securedKey: "sk_live_do_not_leak" });
const { blob, keyVersion } = crypto.seal(secret, ctx);

check("a sealed credential opens again", crypto.open(blob, keyVersion, ctx) === secret);
check(
  "the ciphertext does not contain the secret",
  !Buffer.from(blob).toString("utf8").includes("sk_live_do_not_leak"),
  "it would not be encryption if it did"
);
check(
  "another shop's context does not open it",
  (() => {
    try {
      crypto.open(blob, keyVersion, other);
      return false;
    } catch {
      return true;
    }
  })(),
  "a row copied into another shop's id must not decrypt into somebody else's money"
);
check(
  "one altered byte does not open it",
  (() => {
    const tampered = Uint8Array.from(blob);
    tampered[tampered.length - 1] ^= 1;
    try {
      crypto.open(tampered, keyVersion, ctx);
      return false;
    } catch {
      return true;
    }
  })(),
  "authenticated encryption, not merely encryption"
);
check(
  "an unknown key version is refused rather than guessed",
  (() => {
    try {
      crypto.open(blob, 99, ctx);
      return false;
    } catch {
      return true;
    }
  })()
);
check(
  "two seals of the same secret differ",
  Buffer.from(crypto.seal(secret, ctx).blob).toString("base64") !==
    Buffer.from(crypto.seal(secret, ctx).blob).toString("base64"),
  "a fresh nonce every time, or identical credentials are visibly identical"
);
check("the platform reports itself ready when a key is set", crypto.paymentCryptoReady());

const savedKeys = process.env.PAYMENT_KEYS;
delete process.env.PAYMENT_KEYS;
check(
  "and not ready when there is none",
  !crypto.paymentCryptoReady(),
  "a merchant must not type a secured key into a box that cannot encrypt it"
);
process.env.PAYMENT_KEYS = savedKeys;

check(
  "the context binds both the shop and the provider",
  crypto.credentialContext("s", "PAYFAST").toString().includes("s") &&
    crypto.credentialContext("s", "PAYFAST").toString().includes("PAYFAST")
);

// ---------------------------------------------------------------------------
// 2. What a customer is offered
// ---------------------------------------------------------------------------

const NONE = { bankAccountDetails: "", jazzcashAccountDetails: "", easypaisaAccountDetails: "" };
const LIVE_GW = [{ value: "PAYFAST", label: "PayFast", testMode: false }];
const TEST_GW = [{ value: "PAYFAST", label: "PayFast", testMode: true }];

check(
  "a gateway is offered ahead of the manual methods",
  checkoutMethods(["COD"], NONE, LIVE_GW)[0]?.value === "PAYFAST",
  "paying now is the path most shoppers want"
);
check(
  "cash on delivery survives alongside it",
  checkoutMethodValues(["COD"], NONE, LIVE_GW).includes("COD")
);
check(
  "a shop with no gateway still has a checkout",
  checkoutMethods(["COD"], NONE, []).length > 0
);
check(
  "a gateway shows no bank details",
  checkoutMethods(["COD"], NONE, LIVE_GW)[0]?.instructions === null,
  "the customer is about to leave for the provider's own page"
);
check(
  "a gateway says it will take the customer away",
  checkoutMethods(["COD"], NONE, LIVE_GW)[0]?.redirects === true
);
check(
  "test mode is admitted to, not hidden",
  /test mode/i.test(checkoutMethods(["COD"], NONE, TEST_GW)[0]?.hint ?? ""),
  "the merchant testing must be able to tell which one they are looking at"
);
check("PayFast settles rupees", providerSupportsCurrency("PAYFAST", "PKR"));
check(
  "and is refused for a currency it does not settle",
  !providerSupportsCurrency("PAYFAST", "USD"),
  "charging 100 through a rupee gateway for a 100-dollar product is the wrong amount"
);
check("a reservation is half an hour", RESERVATION_MS === 30 * 60 * 1000);
check("PAYFAST is recognised as a gateway", isGatewayProvider("PAYFAST"));
check("and a manual method is not", !isGatewayProvider("COD"));

// ---------------------------------------------------------------------------
// 3. Only one thing can pay for an order
// ---------------------------------------------------------------------------

const verify = read("lib/payments/verify.ts");

// A merchant may still mark their own order paid by hand — a bank transfer is
// confirmed by looking at a bank statement, and a card that succeeded but
// failed to verify is their judgement to make. Those paths are behind an
// authenticated admin session. What must not exist is a third one.
const MAY_CONFIRM = [
  "lib/payments/verify.ts",
  "app/admin/orders/actions.ts",
  "lib/csv/orders.ts",
  "app/admin/orders/import/actions.ts",
];
const confirmWriters = ALL.filter((f) => /paymentStatus:\s*"CONFIRMED"/.test(read(f)));
check(
  "only the verification path and the merchant's own screens confirm a payment",
  confirmWriters.every((f) => MAY_CONFIRM.includes(f)),
  confirmWriters.filter((f) => !MAY_CONFIRM.includes(f)).join(", ")
);
check(
  "the verification path is one of them",
  confirmWriters.includes("lib/payments/verify.ts")
);
check(
  "it asks the provider rather than reading the request",
  /adapterFor\(provider\)\.lookup\(/.test(verify),
  "the only thing allowed to produce PAID"
);
check(
  "the amount is compared before confirming",
  verify.indexOf("amountsMatch") < verify.indexOf("return confirm(") &&
    /amountsMatch\(payment\.amount, answer\.amount\)/.test(verify),
  "against the frozen attempt, not against the order, which can be edited later"
);
check(
  "so is the currency",
  /answer\.currency\.toUpperCase\(\) !== payment\.currency\.toUpperCase\(\)/.test(verify)
);
check(
  "a confirmation is claimed conditionally",
  /updateMany\(\{[\s\S]{0,200}status: \{ in: \["INITIATED", "PENDING"\] \}[\s\S]{0,200}status: "CONFIRMED"/.test(
    verify
  ),
  "two callbacks arriving together must confirm once"
);
check(
  "and everything after it hangs off having won the claim",
  /claimed\.count !== 1/.test(verify)
);
check(
  "an unreachable provider leaves the order alone",
  /state: "UNAVAILABLE"/.test(verify) && /answer\.ok/.test(verify),
  "failing closed costs a support message; failing open ships goods"
);
check(
  "an unrecognised provider status is never read as paid",
  /return "UNKNOWN"/.test(read("lib/payments/payfast.ts")),
  "the optimistic guess is the one that ships goods"
);
check(
  "a duplicate provider transaction is refused, not confirmed twice",
  /P2002/.test(verify) && /already recorded against another order/.test(verify)
);
check(
  "the go-live proof is written only by a confirmed payment",
  ALL.filter((f) => /sandboxVerifiedAt: now/.test(read(f))).join() === "lib/payments/verify.ts",
  "a merchant must not unlock live payments by saving a form"
);
check(
  "the customer and merchant are told only after the money is verified",
  verify.indexOf("await announcePaidOrder(") > verify.indexOf('outcome: "confirmed"'),
  "announcing at checkout is how a shop packs a parcel for a card that declined"
);

// ---------------------------------------------------------------------------
// 4. The public endpoint
// ---------------------------------------------------------------------------

const callback = read("app/api/payments/[provider]/callback/route.ts");
check(
  "the callback reads only a reference from the request",
  !/(TXNAMT|err_code|transaction_id|amount|status)['"]?\s*\]/.test(callback),
  "everything else in the body is a claim by a stranger"
);
check(
  "it hands that reference to the verification path",
  /verifyPayment\(reference, "callback"/.test(callback)
);
check(
  "it answers everyone the same way",
  /const ok = NextResponse\.json\(\{ received: true \}\)/.test(callback) &&
    (callback.match(/return ok;/g) ?? []).length >= 4,
  "a stranger probing for valid references must learn nothing from the reply"
);
check("it is rate limited", /rateLimit\("paymentCallback"/.test(callback));
check(
  "an oversized reference is dropped rather than looked up",
  /reference\.length > 200/.test(callback)
);

const limits = read("lib/rate-limit.ts");
check("there is a limit for the callback", /paymentCallback:/.test(limits));
check("and one for a customer refreshing the confirmation page", /paymentCheck:/.test(limits));

const confirmation = read("app/(storefront)/order-confirmation/[id]/page.tsx");
check(
  "landing on the success URL verifies rather than assumes",
  /verifyPayment\(reference, "return"/.test(confirmation),
  "the success URL is a link, and anybody can type it"
);
check(
  "the page reads the order after that verification, not before",
  confirmation.indexOf("verifyPayment") < confirmation.indexOf("order.findFirst")
);

// ---------------------------------------------------------------------------
// 5. Connecting, replacing, going live
// ---------------------------------------------------------------------------

const gateways = read("lib/payments/gateways.ts");
check(
  "new keys are proved before anything is written",
  gateways.indexOf("adapterFor(provider).probe") < gateways.indexOf("paymentGateway.upsert"),
  "a typo must not destroy a working key"
);
check(
  "a rejected key changes nothing but the error message",
  /updateMany\(\{[\s\S]{0,160}data: \{ lastCheckedAt: new Date\(\), lastError/.test(gateways)
);
check(
  "replacing keys clears the go-live proof",
  /update: \{[\s\S]{0,400}sandboxVerifiedAt: null/.test(gateways),
  "a new secret has proved nothing, whatever the old one proved"
);
check(
  "and does not leave it switched on",
  /update: \{[\s\S]{0,500}isActive: false/.test(gateways)
);
check(
  "saving a key never switches a gateway on by itself",
  /create: \{[\s\S]{0,600}isActive: false/.test(gateways)
);
check(
  "going live needs a sandbox payment behind it",
  /if \(!row\.sandboxVerifiedAt\)/.test(gateways)
);
check(
  "and the live keys are proved against the live host first",
  /probe\(openCredentials\(row\), "LIVE"\)/.test(gateways),
  "sandbox working proves nothing about a live endpoint or a live key"
);
check(
  "disconnecting erases the secret rather than hiding it",
  /secret: null/.test(gateways)
);
check(
  "switching off keeps the keys",
  /setActive[\s\S]{0,400}data: \{ isActive: active \}/.test(gateways),
  "an afternoon off must not mean fetching keys from the provider again"
);

// ---------------------------------------------------------------------------
// 6. Test mode never reaches a customer
// ---------------------------------------------------------------------------

const offer = read("lib/payments/offer.ts");
check(
  "a gateway in test mode is offered only to the shop's own staff",
  /if \(row\.mode === "SANDBOX"\) return isStaff;/.test(offer)
);
check(
  "a gateway that is switched off is offered to nobody",
  /if \(!row\.isActive\) return false;/.test(offer)
);
check(
  "and one with no credentials is offered to nobody",
  /if \(!row\.secret\) return false;/.test(offer)
);

const start = read("lib/payments/start.ts");
check(
  "starting a payment re-checks test mode on the server",
  /gateway\.mode === "SANDBOX" && !args\.allowTestMode/.test(start),
  "a stale tab or a hand-made request must meet the same rule the page did"
);
check(
  "the reference is random, not the order id",
  /randomBytes\(24\)/.test(start),
  "order ids are five characters and unique only within a shop"
);
check(
  "the amount comes from the order, never from the caller",
  /amount: order\.total/.test(read("app/(storefront)/order-confirmation/actions.ts"))
);
check(
  "the callback address is always the platform's own",
  /callbackOrigin: await canonicalUrl\(sid\)/.test(read("app/api/orders/route.ts")),
  "a custom domain can be taken off a shop between the order and the callback"
);

// ---------------------------------------------------------------------------
// 7. What an unpaid order gives back
// ---------------------------------------------------------------------------

const reservations = read("lib/payments/reservations.ts");
check("stock goes back", /stock: \{ increment: item\.quantity \}/.test(reservations));
check(
  "so does the discount use",
  /usageCount" = GREATEST\("usageCount" - 1, 0\)/.test(reservations),
  "and floored at zero, so a hand-edited count is not driven negative"
);
check(
  "and the redemption row that enforces a per-customer limit",
  /discountRedemption\.deleteMany/.test(reservations),
  "otherwise a one-per-customer code is spent by somebody who never paid"
);
check(
  "releasing is claimed in the where clause, so it cannot happen twice",
  /reservedUntil: \{ not: null \}[\s\S]{0,300}claimed\.count !== 1/.test(reservations)
);
check(
  "a cash-on-delivery order is never swept",
  /reservedUntil: \{ (lt: new Date\(\)|not: null) \}/.test(reservations) &&
    !/reservedUntil: null[\s\S]{0,40}where/.test(reservations),
  "only an order holding a reservation has one to lose"
);

const orders = read("app/api/orders/route.ts");
check(
  "a gateway order is given a deadline",
  /reservedUntil: usingGateway \? new Date\(Date\.now\(\) \+ RESERVATION_MS\) : null/.test(orders)
);
check(
  "and is not announced at checkout",
  orders.indexOf("if (usingGateway)") < orders.indexOf("await sendOrderEmails("),
  "the gateway branch returns before the emails"
);
check(
  "a gateway that will not start releases the order at once",
  /releaseOrder\(order\.id, "gateway would not start the payment"\)/.test(orders),
  "the stock goes back now, not in half an hour"
);
check(
  "expired holds are released where somebody would notice",
  /releaseExpiredForShop/.test(orders) &&
    /releaseExpiredForShop/.test(read("app/admin/orders/page.tsx")),
  "the plan allows one scheduled run a day, and a thirty-minute hold swept daily is a day-long hold"
);

// ---------------------------------------------------------------------------
// 8. Nothing leaks
// ---------------------------------------------------------------------------

check(
  "the view handed to a screen has no field for a credential",
  !/securedKey|secret:/.test(gateways.slice(gateways.indexOf("export type GatewayView"), gateways.indexOf("export function describeGateway"))),
  "there must be nothing on the type that could carry one by accident"
);
const actions = read("app/admin/payments/gateway-actions.ts");
check(
  "no server action opens a stored credential",
  !/openCredentials/.test(actions),
  "there is no path that reads one back, deliberately"
);
check(
  "and none returns one",
  !/return[^;]{0,200}securedKey/.test(actions),
  "a merchant who loses their key gets a new one from the provider"
);
check(
  "the audit trail records the account number but never the key",
  /merchantId: input\.merchantId\.trim\(\)/.test(read("app/admin/payments/gateway-actions.ts")) &&
    !/detail: \{[^}]*securedKey/.test(read("app/admin/payments/gateway-actions.ts"))
);

const leaks = ALL.filter((f) => {
  const src = read(f);
  // The key itself, by any of its names. "credentials" as a word is not it —
  // several files legitimately say the word in a message to a human.
  return /console\.(log|error|warn)\([\s\S]{0,200}?\b(securedKey|SECURED_KEY|secured_key)\b/.test(src);
});
check("no credential is ever logged", leaks.length === 0, leaks.join(", "));

const adapter = read("lib/payments/payfast.ts");
check(
  "every gateway endpoint is checked against an allowlist",
  (adapter.match(/assertAllowedHost\(/g) ?? []).length >= 3,
  "the endpoints are configurable, and configuration is a way to be pointed elsewhere"
);
check(
  "and only over https",
  /parsed\.protocol !== "https:"/.test(read("lib/payments/adapter.ts"))
);
check(
  "every gateway call has a timeout",
  /AbortSignal\.timeout\(GATEWAY_TIMEOUT_MS\)/.test(adapter),
  "a provider that never answers must not hold a checkout open"
);

// ---------------------------------------------------------------------------
// 9. The database says the same things
// ---------------------------------------------------------------------------

const migration = read("prisma/migrations/20261021000000_payment_gateways/migration.sql");
check(
  "a provider's transaction can only be recorded once",
  /CREATE UNIQUE INDEX "Payment_provider_providerRef_key"/.test(migration),
  "what makes a replayed callback a no-op rather than a second payment"
);
check(
  "and our own reference is unique across the platform",
  /CREATE UNIQUE INDEX "Payment_reference_key"/.test(migration)
);
check(
  "credentials are a sealed blob, not columns",
  /"secret" BYTEA/.test(migration) && !/securedKey/.test(migration)
);
check(
  "one connection per shop per provider",
  /CREATE UNIQUE INDEX "PaymentGateway_shopId_provider_key"/.test(migration)
);
check(
  "an event that names no known payment belongs to no shop",
  /"shopId" TEXT,/.test(migration),
  "filing a stranger's forgery in a merchant's records would be a lie"
);

const schema = read("prisma/schema.prisma");
check("the order carries its deadline", /reservedUntil\s+DateTime\?/.test(schema));
check(
  "PAYFAST is a way to pay",
  /enum PaymentMethod \{[\s\S]{0,300}PAYFAST/.test(schema)
);

const tenant = read("lib/tenant.ts");
for (const model of ["PaymentGateway", "Payment", "PaymentEvent"]) {
  check(`${model} is scoped to its shop`, new RegExp(`"${model}"`).test(tenant));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
