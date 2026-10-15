/**
 * The checkout's optional parts (new admin, 15 October), worded once for every
 * checkout: the classic form, Loom's and Kite's.
 */

/** The words beside the marketing box when the shop has not written its own. */
export const MARKETING_WORDS = "Send me new arrivals and sale news";

/** "Arrives in 2 to 4 days", or null when the shop has not said. */
export function arrivesText(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null;
  const lo = Math.min(min ?? max!, max ?? min!);
  const hi = Math.max(min ?? max!, max ?? min!);
  if (hi === 0) return "Arrives today";
  if (lo === hi) return hi === 1 ? "Arrives tomorrow" : `Arrives in ${hi} days`;
  return `Arrives in ${lo} to ${hi} days`;
}

/** What a shop's settings mean for its checkout. */
export function checkoutOptions(s: {
  checkoutNotes: boolean;
  marketingOptIn: boolean;
  marketingOptInText: string;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
}) {
  return {
    notes: s.checkoutNotes,
    marketing: s.marketingOptIn ? s.marketingOptInText.trim() || MARKETING_WORDS : null,
    arrives: arrivesText(s.deliveryDaysMin, s.deliveryDaysMax),
  };
}
