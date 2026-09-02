/**
 * Checks the discount rules — `npm run check:discounts`.
 *
 * A discount is arithmetic applied to somebody's money, and every mistake in it
 * is either a customer overcharged or a merchant giving away more than they
 * meant to. The rules are pure so they can be exercised exhaustively here
 * rather than discovered in an order total.
 *
 * Dependency-free and offline.
 */
import { sourceOf } from "./source-text";
import {
  applyDiscount,
  codeProblem,
  describeDiscount,
  discountState,
  normaliseCode,
  rulesProblem,
  type DiscountRules,
} from "../lib/discounts";

let pass = 0, fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name}  ${detail}`); }
};

const NOW = new Date("2026-06-15T12:00:00Z");

/** A discount with every rule switched off, for tests to vary one at a time. */
const base = (over: Partial<DiscountRules> = {}): DiscountRules => ({
  code: "SAVE",
  type: "PERCENTAGE",
  value: 10,
  minSubtotal: null,
  usageLimit: null,
  perCustomerLimit: null,
  usageCount: 0,
  startsAt: null,
  endsAt: null,
  isActive: true,
  ...over,
});

const cart = (subtotal: number, shippingFee = 250) => ({ subtotal, shippingFee });
const ctx = (customerUses = 0) => ({ now: NOW, customerUses });

console.log("\nCODES ARE COMPARED THE WAY PEOPLE TYPE THEM");
check("case is ignored", normaliseCode("save10") === "SAVE10");
check("surrounding space is ignored", normaliseCode("  SAVE10  ") === "SAVE10");
check("a code must be given", codeProblem("") !== null);
check("very short codes are refused", codeProblem("AB") !== null);
// Spaces survive copy-paste badly and cannot be read aloud unambiguously.
check("spaces are refused", codeProblem("SAVE 10") !== null);
check("punctuation is refused", codeProblem("SAVE!10") !== null);
check("hyphens are allowed", codeProblem("BLACK-FRIDAY") === null);
check("digits are allowed", codeProblem("SAVE10") === null);
check("lowercase input is accepted, since it is uppercased", codeProblem("save10") === null);

console.log("\nTHE ARITHMETIC");
const tenPercent = applyDiscount(base({ value: 10 }), cart(1000), ctx());
check("10% of 1000 is 100", tenPercent.ok && tenPercent.amountOffSubtotal === 100);
check("shipping is untouched by a percentage", tenPercent.ok && tenPercent.amountOffShipping === 0);

const fixed = applyDiscount(base({ type: "FIXED_AMOUNT", value: 300 }), cart(1000), ctx());
check("a fixed amount comes straight off", fixed.ok && fixed.amountOffSubtotal === 300);

// Rounding is stated rather than left to chance: 7% of 1055 is 73.85.
const rounding = applyDiscount(base({ value: 7 }), cart(1055), ctx());
check("a fractional percentage rounds to the nearest rupee",
  rounding.ok && rounding.amountOffSubtotal === 74,
  rounding.ok ? String(rounding.amountOffSubtotal) : "");

// The one that would otherwise produce a negative total and a refund to explain.
const overshoot = applyDiscount(base({ type: "FIXED_AMOUNT", value: 2000 }), cart(500), ctx());
check("a fixed amount never exceeds the subtotal",
  overshoot.ok && overshoot.amountOffSubtotal === 500,
  overshoot.ok ? String(overshoot.amountOffSubtotal) : "");
check("100% off takes exactly the subtotal, not more",
  (() => {
    const r = applyDiscount(base({ value: 100 }), cart(750), ctx());
    return r.ok && r.amountOffSubtotal === 750;
  })());

console.log("\nFREE DELIVERY");
const freeShip = applyDiscount(base({ type: "FREE_SHIPPING" }), cart(1000, 250), ctx());
check("the shipping fee is waived", freeShip.ok && freeShip.amountOffShipping === 250);
check("the goods are not discounted", freeShip.ok && freeShip.amountOffSubtotal === 0);
check("the saving is the shipping fee", freeShip.ok && freeShip.totalSaving === 250);
// Accepting a code that changes nothing is worse than refusing it.
check("refused when delivery is already free",
  !applyDiscount(base({ type: "FREE_SHIPPING" }), cart(5000, 0), ctx()).ok);

console.log("\nWINDOWS");
check("a code that hasn't started is refused",
  !applyDiscount(base({ startsAt: new Date("2026-07-01") }), cart(1000), ctx()).ok);
check("a code that has ended is refused",
  !applyDiscount(base({ endsAt: new Date("2026-06-01") }), cart(1000), ctx()).ok);
check("a code inside its window works",
  applyDiscount(
    base({ startsAt: new Date("2026-06-01"), endsAt: new Date("2026-07-01") }),
    cart(1000),
    ctx()
  ).ok);
// The boundary, stated: `endsAt` is the moment it stops, not the last moment
// it works.
check("the end moment itself is already expired",
  !applyDiscount(base({ endsAt: NOW }), cart(1000), ctx()).ok);
check("the start moment itself is live",
  applyDiscount(base({ startsAt: NOW }), cart(1000), ctx()).ok);

console.log("\nLIMITS");
check("an inactive code is refused", !applyDiscount(base({ isActive: false }), cart(1000), ctx()).ok);
check("a fully claimed code is refused",
  !applyDiscount(base({ usageLimit: 10, usageCount: 10 }), cart(1000), ctx()).ok);
check("one use left still works",
  applyDiscount(base({ usageLimit: 10, usageCount: 9 }), cart(1000), ctx()).ok);
check("a customer at their personal limit is refused",
  !applyDiscount(base({ perCustomerLimit: 1 }), cart(1000), ctx(1)).ok);
check("…while another customer can still use it",
  applyDiscount(base({ perCustomerLimit: 1 }), cart(1000), ctx(0)).ok);

console.log("\nMINIMUM SPEND");
check("below the minimum is refused",
  !applyDiscount(base({ minSubtotal: 2000 }), cart(1500), ctx()).ok);
check("exactly the minimum qualifies",
  applyDiscount(base({ minSubtotal: 2000 }), cart(2000), ctx()).ok);
// "Spend more" without a number is useless to the person reading it.
check("the refusal says what the minimum is",
  (() => {
    const r = applyDiscount(base({ minSubtotal: 2000 }), cart(1500), ctx());
    return !r.ok && r.reason.includes("2000");
  })());

console.log("\nREFUSALS ARE WRITTEN FOR THE CUSTOMER");
const refusals = [
  applyDiscount(base({ isActive: false }), cart(1000), ctx()),
  applyDiscount(base({ endsAt: new Date("2026-01-01") }), cart(1000), ctx()),
  applyDiscount(base({ usageLimit: 1, usageCount: 1 }), cart(1000), ctx()),
  applyDiscount(base({ perCustomerLimit: 1 }), cart(1000), ctx(1)),
].filter((r): r is Extract<typeof r, { ok: false }> => !r.ok);
check("each is a sentence", refusals.every((r) => /[.!]$/.test(r.reason)));
check("none of them leak the rule's internals",
  !refusals.some((r) => /usageCount|isActive|null|undefined/.test(r.reason)));

console.log("\nA MERCHANT'S OWN SETTINGS ARE CHECKED TOO");
const ok = { minSubtotal: null, usageLimit: null, perCustomerLimit: null, startsAt: null, endsAt: null };
check("0% is refused", rulesProblem({ type: "PERCENTAGE", value: 0, ...ok }) !== null);
check("over 100% is refused", rulesProblem({ type: "PERCENTAGE", value: 101, ...ok }) !== null);
check("a fractional percentage is refused", rulesProblem({ type: "PERCENTAGE", value: 10.5, ...ok }) !== null);
check("a valid percentage passes", rulesProblem({ type: "PERCENTAGE", value: 25, ...ok }) === null);
check("a zero fixed amount is refused", rulesProblem({ type: "FIXED_AMOUNT", value: 0, ...ok }) !== null);
check("free delivery needs no amount", rulesProblem({ type: "FREE_SHIPPING", value: 0, ...ok }) === null);
check("a usage limit below 1 is refused",
  rulesProblem({ type: "PERCENTAGE", value: 10, ...ok, usageLimit: 0 }) !== null);
// A window that closes before it opens never fires, and nothing on the form
// would explain why.
check("an end before the start is refused",
  rulesProblem({
    type: "PERCENTAGE",
    value: 10,
    ...ok,
    startsAt: new Date("2026-07-01"),
    endsAt: new Date("2026-06-01"),
  }) !== null);

console.log("\nHOW A DISCOUNT READS");
check("a percentage reads as one", describeDiscount("PERCENTAGE", 10) === "10% off");
check("free delivery says so", describeDiscount("FREE_SHIPPING", 0) === "Free delivery");
check("an amount carries its currency", describeDiscount("FIXED_AMOUNT", 500).includes("500"));

console.log("\nSTATE AT A GLANCE");
const s = (over: Partial<DiscountRules>) => discountState(base(over), NOW);
check("a live code is active", s({}) === "active");
check("a switched-off code says off", s({ isActive: false }) === "off");
check("a future code is scheduled", s({ startsAt: new Date("2026-07-01") }) === "scheduled");
check("a past code is expired", s({ endsAt: new Date("2026-01-01") }) === "expired");
check("a spent code is used up", s({ usageLimit: 5, usageCount: 5 }) === "used-up");

console.log("\nTHE CHECKOUT PRICES IT ITSELF");
const checkout = sourceOf("app", "api", "orders", "route.ts");
// The whole reason the rules are pure: the preview and the charge run the same
// code. A client-supplied amount would make them disagree by design.
check("the order re-quotes from the code", /quoteDiscountWith?\(/.test(checkout));
check("it never reads an amount from the request",
  !/body\.discount(Amount|Value|Saving)/.test(checkout));
check("the use is claimed before the order is written", checkout.includes("claimDiscountUse("));
// Without this row the per-customer limit counts nothing and "one per
// customer" is unlimited in practice, which is how it shipped at first.
check("a redemption is recorded", checkout.includes("discountRedemption.create"));
// Inside the transaction, on `tx`: quoting on the pooled client from within an
// interactive transaction waits for a connection the transaction is holding.
check("the quote runs on the transaction client", /quoteDiscountWith\(\s*tx/.test(checkout));
check("a lost race fails the checkout rather than under-charging",
  checkout.includes("has just been fully claimed"));

const data = sourceOf("lib", "data", "discounts.ts");
// Reading the count and then incrementing lets two checkouts both take the
// last use of a code.
check("the usage limit is enforced in one statement", data.includes("$executeRaw"));
check("that statement compares the two columns", data.includes('"usageCount" < "usageLimit"'));
check("and names the shop, since raw SQL is not scoped", data.includes('"shopId" = '));

console.log("\nTHE STOREFRONT PREVIEW AGREES WITH THE ORDER");
const preview = sourceOf("app", "(storefront)", "checkout", "actions.ts");
// A preview built on a client-supplied subtotal would let anyone claim a large
// order, watch a minimum-spend code come back valid, and then be refused at
// checkout for a reason the page had just told them did not apply.
check(
  "the cart is priced from the database, not the request",
  preview.includes("productVariant.findMany") && preview.includes("effectivePrice")
);
check("quantities from the client are clamped", preview.includes("Math.min"));
check("it uses the same quote as checkout", preview.includes("quoteDiscount("));
check("trying codes is rate limited", preview.includes('rateLimit("discountPreview"'));
check("a shut store previews nothing", preview.includes("storefrontClosure()"));

const form = sourceOf("components", "storefront", "checkout-form.tsx");
check("the form sends only the code", form.includes("discountCode: discount?.code"));
// The saving shown has to be the server's number, or the two disagree.
check("the saving shown comes from the server", form.includes("result.saving"));
check("the total never renders below zero", form.includes("Math.max(0,"));

console.log(`\n${pass} passed, ${fail} failed\n`);
if (fail > 0) process.exitCode = 1;
