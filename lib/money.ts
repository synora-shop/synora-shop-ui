import { CURRENCIES, STORE_DEFAULTS } from "@/lib/store-defaults";

/**
 * Money, in the currency the store actually trades in.
 *
 * Settings has offered a currency picker since it was built, and every price
 * on every screen was printed by a function called `formatPKR` that hard-coded
 * rupees. A shop set to dollars typed dollars into Settings and saw rupees in
 * its catalogue, its orders, its checkout and its emails. The setting was
 * real; nothing read it.
 *
 * Amounts are whole units of the currency, because that is how they are
 * stored: `basePrice: 5500` means 5,500 rupees, not 55.00. That is a fine fit
 * for PKR, which has no minor unit in practice, and a real limitation for
 * dollars — a merchant cannot price something at 19.99 today. Changing it
 * means storing minor units everywhere and migrating every existing row, which
 * is a decision of its own rather than something to slip into a formatter.
 * See docs/QUEUE.md.
 *
 * Client-safe: pure, no Prisma, no next/headers.
 */

/** The grouping a currency's own readers expect. */
const LOCALES: Record<string, string> = {
  PKR: "en-PK",
  INR: "en-IN",
  USD: "en-US",
  CAD: "en-CA",
  AUD: "en-AU",
  GBP: "en-GB",
  EUR: "en-IE",
  AED: "en-AE",
  SAR: "en-SA",
};

/** The symbol a merchant chose in Settings, or the code when it is unknown. */
export function symbolFor(currency: string): string {
  return CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
}

/**
 * A price, written out.
 *
 * Symbol then amount, grouped the way that currency's readers group it. No
 * decimals, because there are none stored — printing ".00" would imply a
 * precision the number does not carry.
 */
export function formatMoney(amount: number, currency: string): string {
  const code = currency || STORE_DEFAULTS.currency;
  const grouped = Math.round(amount).toLocaleString(LOCALES[code] ?? "en", {
    maximumFractionDigits: 0,
  });
  return `${symbolFor(code)} ${grouped}`;
}
