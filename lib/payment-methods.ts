export const ALL_PAYMENT_METHODS = [
  { value: "COD", label: "Cash on Delivery" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "JAZZCASH", label: "JazzCash" },
  { value: "EASYPAISA", label: "EasyPaisa" },
] as const;

// Payment methods currently accepted at checkout. Bank Transfer / JazzCash /
// EasyPaisa are temporarily disabled (COD only, per request) — add a value
// back here to re-enable it everywhere (checkout form, order validation,
// footer) in one place. The admin Settings fields for their account details
// are left in place so it's a one-line change when that happens.
const ENABLED_VALUES = ["COD"] as const;

export const ENABLED_PAYMENT_METHOD_VALUES: readonly string[] = ENABLED_VALUES;

export const ENABLED_PAYMENT_METHODS = ALL_PAYMENT_METHODS.filter((m) =>
  ENABLED_PAYMENT_METHOD_VALUES.includes(m.value)
);
