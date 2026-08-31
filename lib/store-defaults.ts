// The facts a store is expressed in: name, currency, region, units, time zone.
//
// These are what a merchant sets on day one and then stops thinking about, so
// the job here is to offer sensible, complete choices and explain the one that
// has consequences — the time zone decides which day a sale belongs to.
//
// Client-safe: pure data, no Prisma, no next/headers.

export type StoreDefaults = {
  storeName: string;
  currency: string;
  countryCode: string;
  unitSystem: "METRIC" | "IMPERIAL";
  weightUnit: string;
  timeZone: string;
};

export const STORE_DEFAULTS: StoreDefaults = {
  storeName: "Your Store",
  currency: "PKR",
  countryCode: "PK",
  unitSystem: "METRIC",
  weightUnit: "kg",
  timeZone: "Asia/Karachi",
};

/** Currencies, with the symbol used when prices are formatted. */
export const CURRENCIES: { code: string; label: string; symbol: string }[] = [
  { code: "PKR", label: "Pakistani Rupee", symbol: "Rs" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", label: "Saudi Riyal", symbol: "﷼" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "CAD", label: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
];

export const COUNTRIES: { code: string; label: string }[] = [
  { code: "PK", label: "Pakistan" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "GB", label: "United Kingdom" },
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "IN", label: "India" },
  { code: "BD", label: "Bangladesh" },
  { code: "MY", label: "Malaysia" },
];

export const UNIT_SYSTEMS = [
  { value: "METRIC", label: "Metric system", hint: "Kilograms, grams, centimetres" },
  { value: "IMPERIAL", label: "Imperial system", hint: "Pounds, ounces, inches" },
] as const;

/** Weight units, filtered by the chosen system so the two can't disagree. */
export const WEIGHT_UNITS: { value: string; label: string; system: "METRIC" | "IMPERIAL" }[] = [
  { value: "kg", label: "Kilogram (kg)", system: "METRIC" },
  { value: "g", label: "Gram (g)", system: "METRIC" },
  { value: "lb", label: "Pound (lb)", system: "IMPERIAL" },
  { value: "oz", label: "Ounce (oz)", system: "IMPERIAL" },
];

export const TIME_ZONES: { value: string; label: string }[] = [
  { value: "Asia/Karachi", label: "(GMT+05:00) Islamabad, Karachi" },
  { value: "Asia/Dubai", label: "(GMT+04:00) Dubai, Abu Dhabi" },
  { value: "Asia/Riyadh", label: "(GMT+03:00) Riyadh" },
  { value: "Asia/Kolkata", label: "(GMT+05:30) Kolkata, Mumbai, Delhi" },
  { value: "Asia/Dhaka", label: "(GMT+06:00) Dhaka" },
  { value: "Asia/Kuala_Lumpur", label: "(GMT+08:00) Kuala Lumpur, Singapore" },
  { value: "Europe/London", label: "(GMT+00:00) London, Dublin" },
  { value: "Europe/Paris", label: "(GMT+01:00) Paris, Berlin, Madrid" },
  { value: "America/New_York", label: "(GMT−05:00) New York, Toronto" },
  { value: "America/Chicago", label: "(GMT−06:00) Chicago" },
  { value: "America/Los_Angeles", label: "(GMT−08:00) Los Angeles, Vancouver" },
  { value: "Australia/Sydney", label: "(GMT+11:00) Sydney, Melbourne" },
  { value: "UTC", label: "(GMT+00:00) UTC" },
];

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function countryLabel(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.label ?? code;
}

/**
 * Normalises submitted defaults, dropping anything not on the offered lists.
 *
 * These end up in price formatting and in the timestamps orders are recorded
 * against, so an unrecognised value would be worse than a wrong one: a bad
 * time zone silently shifts which day a sale belongs to.
 */
export function resolveStoreDefaults(
  raw: Partial<Record<keyof StoreDefaults, unknown>> | null | undefined
): StoreDefaults {
  const input = (raw ?? {}) as Partial<Record<keyof StoreDefaults, string>>;
  const unitSystem: "METRIC" | "IMPERIAL" =
    input.unitSystem === "IMPERIAL" ? "IMPERIAL" : "METRIC";

  // A weight unit from the other system is corrected rather than kept: an
  // imperial store measuring in grams is a contradiction the UI can't display.
  const weight = WEIGHT_UNITS.find((w) => w.value === input.weightUnit && w.system === unitSystem);

  return {
    storeName: (input.storeName ?? "").trim().slice(0, 120) || STORE_DEFAULTS.storeName,
    currency: CURRENCIES.some((c) => c.code === input.currency)
      ? input.currency!
      : STORE_DEFAULTS.currency,
    countryCode: COUNTRIES.some((c) => c.code === input.countryCode)
      ? input.countryCode!
      : STORE_DEFAULTS.countryCode,
    unitSystem,
    weightUnit: weight?.value ?? (unitSystem === "METRIC" ? "kg" : "lb"),
    timeZone: TIME_ZONES.some((z) => z.value === input.timeZone)
      ? input.timeZone!
      : STORE_DEFAULTS.timeZone,
  };
}
