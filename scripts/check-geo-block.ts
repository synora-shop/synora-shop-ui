/**
 * Checks country blocking — run with `npm run check:geo`.
 *
 * This decides whether a visitor sees a shop at all, and both mistakes are
 * silent. Blocking too widely loses real customers with nothing in any log to
 * say why; blocking too narrowly shows the shop to someone a merchant chose to
 * hide it from. Neither throws.
 *
 * Dependency-free; exits non-zero on failure.
 */
import { cleanBlockedList, isBlocked, normaliseCountry } from "../lib/geo-block";

let pass = 0,
  fail = 0;
const check = (name: string, ok: boolean, detail = "") => {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

/* -------------------------------------------------------------------------- */
/* Reading the country                                                        */
/* -------------------------------------------------------------------------- */

check("a plain code is accepted", normaliseCountry("PK") === "PK");
check("lowercase is accepted", normaliseCountry("pk") === "PK");
check("whitespace is trimmed", normaliseCountry("  gb  ") === "GB");
check("a three letter code is refused", normaliseCountry("PAK") === null);
check("a single letter is refused", normaliseCountry("P") === null);
check("digits are refused", normaliseCountry("12") === null);
check("empty is refused", normaliseCountry("") === null);
check("null is refused", normaliseCountry(null) === null);
check("undefined is refused", normaliseCountry(undefined) === null);

/* -------------------------------------------------------------------------- */
/* Who gets turned away                                                       */
/* -------------------------------------------------------------------------- */

// The default, and the one that matters most: a merchant who has never opened
// this screen must not be blocking anybody.
check("an empty list blocks nobody", !isBlocked("PK", []));
check("an empty list blocks nobody, even unknown visitors", !isBlocked(null, []));

check("a listed country is blocked", isBlocked("RU", ["RU", "BY"]));
check("a listed country is blocked whatever the case", isBlocked("ru", ["RU"]));
check("an unlisted country is served", !isBlocked("PK", ["RU", "BY"]));

// Unknown country is served, deliberately. Turning away everyone we cannot
// identify would cost real customers behind corporate proxies in order to stop
// a handful, and the failure would be invisible to the merchant.
check("an unknown country is served, not refused", !isBlocked(null, ["RU"]));
check("an unreadable country is served, not refused", !isBlocked("XXX", ["RU"]));
check("an empty header is served", !isBlocked("", ["RU"]));

/* -------------------------------------------------------------------------- */
/* What gets stored                                                           */
/* -------------------------------------------------------------------------- */

check("codes are uppercased", cleanBlockedList(["ru", "by"]).join() === "BY,RU");
check("duplicates collapse", cleanBlockedList(["RU", "ru", "RU"]).join() === "RU");
check("rubbish is dropped", cleanBlockedList(["RU", "", "12", "PAK"]).join() === "RU");
check("an empty selection stays empty", cleanBlockedList([]).length === 0);
// Sorted so the same selection always stores the same array — otherwise a save
// that changed nothing still reads as a change to anything watching the row.
check("the order is stable", cleanBlockedList(["PK", "AF", "RU"]).join() === "AF,PK,RU");
check(
  "a list of nothing but rubbish blocks nobody",
  !isBlocked("PK", cleanBlockedList(["", "1", "zzz"]))
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
