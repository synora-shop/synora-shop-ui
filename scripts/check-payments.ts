/**
 * Checks a merchant can actually choose how they get paid —
 * `npm run check:payments`.
 *
 * Which methods a customer could pick was a constant in the source:
 * `["COD"]`, marked "temporarily, per request", with a comment promising that
 * adding a value back would re-enable it everywhere in one line. It stayed that
 * way. Meanwhile every merchant's Settings screen offered three boxes for their
 * bank, JazzCash and EasyPaisa details under the words *"leave one blank and it
 * is not offered"* — a sentence that was untrue in both directions. Filling one
 * in offered nothing, and no merchant could turn a method on at any price.
 *
 * What is checked:
 *
 *   1. The list is a setting, not a constant, and the storefront reads it.
 *   2. A shop is never left with no way to pay, whatever is in the column.
 *   3. A method switched on with no details behind it is not offered — and the
 *      merchant is told, rather than left with "I turned it on and nothing
 *      happened".
 *   4. The server refuses a method this shop does not take, so a stale tab or a
 *      direct POST cannot place an order by naming one.
 *   5. Nothing writes the payment fields except the screen that owns them.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  ALL_PAYMENT_METHODS,
  methodsMissingDetails,
  offeredMethodValues,
  offeredMethods,
  toEnabledMethods,
} from "../lib/payment-methods";

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

const FULL = {
  bankAccountDetails: "a bank",
  jazzcashAccountDetails: "a number",
  easypaisaAccountDetails: "a number",
};
const NONE = { bankAccountDetails: "", jazzcashAccountDetails: "", easypaisaAccountDetails: "" };

// ---------------------------------------------------------------------------
// A shop always has a way to be paid
// ---------------------------------------------------------------------------

check("an empty list falls back to cash on delivery", toEnabledMethods([]).join() === "COD");
check("so does a null", toEnabledMethods(null).join() === "COD");
check("so does rubbish", toEnabledMethods(["NOT_A_METHOD"]).join() === "COD");
check("unknown values are dropped", toEnabledMethods(["COD", "NOPE"]).join() === "COD");
check("duplicates are collapsed", toEnabledMethods(["COD", "COD"]).join() === "COD");
check(
  "the checkout is never left with nothing to offer",
  offeredMethods([], NONE).length > 0 && offeredMethods(["BANK_TRANSFER"], NONE).length > 0,
  "a shop with no payment method cannot take an order"
);

// ---------------------------------------------------------------------------
// On, and answerable
// ---------------------------------------------------------------------------

check(
  "a method with details is offered",
  offeredMethodValues(["COD", "BANK_TRANSFER"], FULL).includes("BANK_TRANSFER")
);
check(
  "a method without them is not",
  !offeredMethodValues(["COD", "BANK_TRANSFER"], NONE).includes("BANK_TRANSFER"),
  "a customer picking it would not know where to send the money"
);
check(
  "whitespace is not details",
  !offeredMethodValues(["COD", "JAZZCASH"], { ...NONE, jazzcashAccountDetails: "   " }).includes(
    "JAZZCASH"
  )
);
check(
  "cash on delivery needs nothing",
  offeredMethodValues(["COD"], NONE).includes("COD"),
  "the money arrives at the door"
);
check(
  "a method that is off is not offered even with details",
  !offeredMethodValues(["COD"], FULL).includes("BANK_TRANSFER")
);
check(
  "the merchant is told which are on but unusable",
  methodsMissingDetails(["COD", "BANK_TRANSFER", "JAZZCASH"], NONE)
    .map((m) => m.value)
    .join() === "BANK_TRANSFER,JAZZCASH",
  "'I turned it on and nothing happened' is what this exists to prevent"
);
check(
  "and nothing is reported when they are all complete",
  methodsMissingDetails(["COD", "BANK_TRANSFER"], FULL).length === 0
);
check(
  "every method that needs details names the column holding them",
  ALL_PAYMENT_METHODS.every((m) => m.detailsField === null || m.detailsField in FULL)
);

// ---------------------------------------------------------------------------
// The setting reaches everything that used to read the constant
// ---------------------------------------------------------------------------

const lib = read("lib/payment-methods.ts");
check(
  "there is no platform-wide enabled list any more",
  !/ENABLED_VALUES|ENABLED_PAYMENT_METHOD_VALUES/.test(lib),
  "one list for every shop is what this replaced"
);

for (const [file, why] of [
  ["components/storefront/checkout-form.tsx", "the checkout offers what the shop accepts"],
  ["app/(storefront)/layout.tsx", "the footer lists what the shop accepts"],
  ["app/api/orders/route.ts", "the server refuses what it does not"],
] as const) {
  const src = read(file);
  check(`${why}`, /offeredMethod/.test(src), `${file} does not ask lib/payment-methods`);
  check(
    `${file} does not import a fixed list`,
    !/ENABLED_PAYMENT_METHODS/.test(src)
  );
}

const orders = read("app/api/orders/route.ts");
check(
  "the order API checks the method against the shop, not the request",
  /offeredMethodValues\(settings\.enabledPaymentMethods, settings\)/.test(orders),
  "a stale tab or a direct POST must not place an order with a method this shop refused"
);
check(
  "and says so plainly",
  /That payment method isn't accepted/.test(orders)
);

// ---------------------------------------------------------------------------
// One screen owns the payment fields
// ---------------------------------------------------------------------------

const general = read("app/admin/settings/actions.ts");
check(
  "the general settings save no longer writes payment details",
  // [\s\S] rather than the s flag: this file is compiled to a target that
  // does not have it, and the check silently would not compile.
  !/update: \{[\s\S]*?bankAccountDetails/.test(general),
  "the form stopped rendering them, so saving a shipping fee would have set them all to null"
);
check("there is an action that does own them", /savePaymentMethods/.test(general));

const generalForm = read("components/admin/store-settings-form.tsx");
check(
  "and the general form no longer carries them",
  !/bankAccountDetails/.test(generalForm)
);

const defaults = read("components/admin/store-defaults-form.tsx");
check(
  "store defaults no longer carries the store name",
  !/id="storeName"/.test(defaults),
  "Home owns it, and it is the same column"
);
check(
  "and its save does not write it either",
  /storeName: _ownedByHome/.test(general),
  "saving a currency would otherwise undo a rename"
);

// ---------------------------------------------------------------------------
// Where the screens live
// ---------------------------------------------------------------------------

const nav = read("lib/admin-nav.ts");
check("Payments is a tab under Settings", /\/admin\/payments/.test(nav));
check(
  "Store defaults is a tab under Home",
  nav.indexOf("/admin/store-defaults") > nav.indexOf('key: "home"') &&
    nav.indexOf("/admin/store-defaults") < nav.indexOf('key: "products"'),
  "it answers what the business is, not how it behaves"
);
check(
  "Billing is not pretending to exist",
  !/\/admin\/billing/.test(nav),
  "a tab that explains why it is empty is still an empty tab"
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
