/**
 * How a customer may pay, per shop.
 *
 * This was a constant: one list for the whole platform, set to `["COD"]`
 * "temporarily, per request", with a comment promising that adding a value back
 * would re-enable it everywhere in one line. It stayed that way, and meanwhile
 * every merchant's Settings screen offered three boxes for their bank, JazzCash
 * and EasyPaisa details under the words *"leave one blank and it is not
 * offered"*.
 *
 * That sentence was untrue in both directions. Filling a box in offered
 * nothing, because the method was disabled in code. And a merchant who wanted
 * bank transfer could not have it at any price, because the switch was in a
 * source file they will never see.
 *
 * It is a setting now. The rule below is the whole of it, and both the
 * storefront and the admin read it, so a method a merchant has turned on is a
 * method a customer can actually pick.
 *
 * Client-safe: plain values and pure functions, no Prisma, no next/headers.
 */

export const ALL_PAYMENT_METHODS = [
  {
    value: "COD",
    label: "Cash on Delivery",
    /** Nothing for the merchant to fill in — the money arrives at the door. */
    detailsField: null,
    hint: "The customer pays the courier. Nothing to set up.",
  },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
    detailsField: "bankAccountDetails",
    hint: "Your account title, number and bank. Shown to a customer who picks it.",
  },
  {
    value: "JAZZCASH",
    label: "JazzCash",
    detailsField: "jazzcashAccountDetails",
    hint: "The number and account title a customer should send to.",
  },
  {
    value: "EASYPAISA",
    label: "EasyPaisa",
    detailsField: "easypaisaAccountDetails",
    hint: "The number and account title a customer should send to.",
  },
] as const;

export type PaymentMethodValue = (typeof ALL_PAYMENT_METHODS)[number]["value"];
export type PaymentMethodMeta = (typeof ALL_PAYMENT_METHODS)[number];

/** Cash on delivery, which every shop can always take. */
export const FALLBACK_METHOD: PaymentMethodValue = "COD";

/** Whether a string names a method this platform knows. */
export function isPaymentMethod(value: unknown): value is PaymentMethodValue {
  return ALL_PAYMENT_METHODS.some((m) => m.value === value);
}

export function paymentMethodMeta(value: string): PaymentMethodMeta | null {
  return ALL_PAYMENT_METHODS.find((m) => m.value === value) ?? null;
}

/** What a merchant has switched on, cleaned of anything unrecognised. */
export function toEnabledMethods(raw: unknown): PaymentMethodValue[] {
  const list = Array.isArray(raw) ? raw.filter(isPaymentMethod) : [];
  // Never empty. A checkout with no payment method is a shop that cannot take
  // an order, and neither a migration nor a hand-edited row may produce one.
  return list.length > 0 ? [...new Set(list)] : [FALLBACK_METHOD];
}

/**
 * The methods a customer is actually offered.
 *
 * Switched on *and* answerable: a merchant who enables bank transfer and leaves
 * the account details empty would otherwise show a customer a payment option
 * that tells them nothing about where to send the money. The admin screen says
 * so rather than letting it happen quietly, and this is the rule underneath.
 */
export function offeredMethods(
  enabled: readonly string[],
  details: Record<string, unknown>
): PaymentMethodMeta[] {
  const on = toEnabledMethods(enabled);
  const usable = ALL_PAYMENT_METHODS.filter((m) => {
    if (!on.includes(m.value)) return false;
    if (!m.detailsField) return true;
    const value = details[m.detailsField];
    return typeof value === "string" && value.trim().length > 0;
  });
  // Same reason as above: never nothing.
  return usable.length > 0 ? usable : ALL_PAYMENT_METHODS.filter((m) => m.value === FALLBACK_METHOD);
}

/** Just the values, for validating what a checkout submitted. */
export function offeredMethodValues(
  enabled: readonly string[],
  details: Record<string, unknown>
): string[] {
  return offeredMethods(enabled, details).map((m) => m.value);
}

/**
 * A method that is on but cannot be offered, for the admin to be told about.
 *
 * Returned rather than silently dropped, because "I turned it on and nothing
 * happened" is the complaint this whole file exists because of.
 */
export function methodsMissingDetails(
  enabled: readonly string[],
  details: Record<string, unknown>
): PaymentMethodMeta[] {
  const on = toEnabledMethods(enabled);
  return ALL_PAYMENT_METHODS.filter((m) => {
    if (!on.includes(m.value) || !m.detailsField) return false;
    const value = details[m.detailsField];
    return !(typeof value === "string" && value.trim().length > 0);
  });
}

/* ---------------------------------------------------------------------------
 * Gateways
 *
 * A hosted gateway is a way to pay, so it belongs in the same list as the
 * others — but it is switched on somewhere else, and that difference is worth
 * being explicit about.
 *
 * The four methods above are toggled in `enabledPaymentMethods`. A gateway is
 * not: its own connection row carries whether it is active, because that switch
 * has to sit beside the credentials, the test mode and the go-live gate. Two
 * switches for one thing is the shape of the bug this file was written to fix —
 * a merchant turning something on in one place while another place quietly
 * keeps it off — so a gateway has exactly one, and it is not here.
 * ------------------------------------------------------------------------- */

/** One thing a customer can pick at checkout, whatever kind it is. */
export type CheckoutMethod = {
  value: string;
  label: string;
  hint: string;
  kind: "offline" | "gateway";
  /**
   * What the customer is shown once they pick it — the merchant's bank details
   * and so on. Null for a gateway, which shows nothing because the customer is
   * about to leave for the provider's own page.
   */
  instructions: string | null;
  /** True when picking it sends the customer to another website. */
  redirects: boolean;
};

/** A gateway the storefront may offer, already filtered by the caller. */
export type OfferableGateway = {
  /** The `PaymentMethod` value, e.g. "PAYFAST". */
  value: string;
  label: string;
  /** True while the shop's own staff are testing it. Shown, never hidden. */
  testMode: boolean;
};

/**
 * Everything a customer may choose from, in the order they should see it.
 *
 * Gateways first: paying now is the path most shoppers want, and burying it
 * under three sets of transfer instructions is how a store ends up with a
 * checkout that technically supports cards and practically does not.
 *
 * The never-empty rule from `offeredMethods` still holds underneath, so a shop
 * with no gateway and nothing filled in still has a working checkout.
 */
export function checkoutMethods(
  enabled: readonly string[],
  details: Record<string, unknown>,
  gateways: readonly OfferableGateway[] = []
): CheckoutMethod[] {
  const online: CheckoutMethod[] = gateways.map((g) => ({
    value: g.value,
    label: g.label,
    hint: g.testMode
      ? "Test mode — only you can see this, and no real money moves."
      : "Pay securely by card, wallet or bank. You'll come straight back.",
    kind: "gateway",
    instructions: null,
    redirects: true,
  }));

  const offline: CheckoutMethod[] = offeredMethods(enabled, details).map((m) => ({
    value: m.value,
    label: m.label,
    hint: m.hint,
    kind: "offline",
    instructions: m.detailsField
      ? ((details[m.detailsField] as string | null | undefined) ?? null)
      : null,
    redirects: false,
  }));

  return [...online, ...offline];
}

/** Just the values, for validating what a checkout submitted. */
export function checkoutMethodValues(
  enabled: readonly string[],
  details: Record<string, unknown>,
  gateways: readonly OfferableGateway[] = []
): string[] {
  return checkoutMethods(enabled, details, gateways).map((m) => m.value);
}
