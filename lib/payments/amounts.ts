/**
 * Does the money match?
 *
 * Its own file, and free of anything server-only, so the comparison that
 * decides whether an order gets paid can be called directly by a check rather
 * than only read as text. A security decision that can only be grepped is one
 * nobody has actually tested.
 *
 * Prices are whole units of the currency (see lib/money.ts) and providers
 * answer in decimals, so this is a tolerance comparison — but a deliberately
 * tight one. Half a minor unit: enough to absorb `1000` against `"1000.00"`
 * parsed through a float, not enough to absorb a rupee.
 */
export const AMOUNT_TOLERANCE = 0.005;

/**
 * `asked` is the amount frozen on the attempt when the customer was sent to
 * the provider. Never the order's total, which can be edited afterwards.
 */
export function amountsMatch(asked: number, paid: number | null | undefined): boolean {
  if (paid == null || !Number.isFinite(paid)) return false;
  if (!Number.isFinite(asked)) return false;
  return Math.abs(paid - asked) < AMOUNT_TOLERANCE;
}

/** Currencies match, or the provider did not say. Case and spacing are noise. */
export function currenciesMatch(asked: string, paid: string | null | undefined): boolean {
  if (!paid) return true;
  return paid.trim().toUpperCase() === asked.trim().toUpperCase();
}
