// What a discount code is worth, and whether it applies at all.
//
// Pure arithmetic and rules — no Prisma, no dates from the environment, no
// rounding surprises. Everything a discount decides is decided here, so the
// storefront preview and the order that actually gets written run the same
// code and cannot disagree. A customer shown "you saved 500" and charged as
// though they saved 400 is the worst possible bug in this area, and the only
// reliable way to prevent it is to have one implementation.
//
// Money is whole PKR throughout, matching the rest of the app.

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export type DiscountRules = {
  code: string;
  type: DiscountType;
  value: number;
  minSubtotal: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usageCount: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
};

export type Cart = {
  /** Sum of the line items, before any discount or shipping. */
  subtotal: number;
  /** What shipping would cost without a discount. */
  shippingFee: number;
};

export type DiscountOutcome =
  | {
      ok: true;
      /** Taken off the subtotal. Zero for free shipping. */
      amountOffSubtotal: number;
      /** Taken off the shipping fee. Zero unless the discount is free shipping. */
      amountOffShipping: number;
      /** The two combined — what the customer actually saves. */
      totalSaving: number;
    }
  | { ok: false; reason: string };

/** Codes are compared without case or surrounding space. */
export function normaliseCode(code: string): string {
  return (code ?? "").trim().toUpperCase();
}

/**
 * Whether a code is shaped like one a customer can type over the phone.
 *
 * Letters, digits and hyphens only. Spaces are the specific problem: a code
 * with one in it gets mangled by autocorrect, by copy-paste and by anyone
 * reading it aloud.
 */
export function codeProblem(raw: string): string | null {
  const code = normaliseCode(raw);
  if (!code) return "Give the discount a code.";
  if (code.length < 3) return "Use at least 3 characters.";
  if (code.length > 32) return "Keep it under 32 characters.";
  if (!/^[A-Z0-9-]+$/.test(code)) {
    return "Use letters, numbers and hyphens only, no spaces or punctuation.";
  }
  return null;
}

/** The reason a discount's own settings are wrong, or null. */
export function rulesProblem(input: {
  type: DiscountType;
  value: number;
  minSubtotal: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
}): string | null {
  if (input.type === "PERCENTAGE") {
    if (!Number.isInteger(input.value) || input.value < 1 || input.value > 100) {
      return "A percentage discount has to be between 1 and 100.";
    }
  }
  if (input.type === "FIXED_AMOUNT") {
    if (!Number.isInteger(input.value) || input.value < 1) {
      return "Give the amount to take off.";
    }
  }
  if (input.minSubtotal !== null && input.minSubtotal < 0) {
    return "A minimum spend can't be negative.";
  }
  if (input.usageLimit !== null && input.usageLimit < 1) {
    return "A usage limit has to be at least 1, or leave it empty for unlimited.";
  }
  if (input.perCustomerLimit !== null && input.perCustomerLimit < 1) {
    return "A per-customer limit has to be at least 1, or leave it empty for unlimited.";
  }
  // Checked here rather than left to the merchant to notice: a window that
  // ends before it starts silently never applies, and nothing about the form
  // would say why.
  if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
    return "The end date has to be after the start date.";
  }
  return null;
}

/**
 * Applies a discount to a cart.
 *
 * `now` and `customerUses` are passed in rather than read here, so this stays
 * a pure function: the same inputs always give the same answer, which is what
 * makes it testable and what lets the checkout and the preview agree.
 *
 * The refusal reasons are written for the customer, not the merchant — someone
 * typing a code at checkout needs to know whether to fix something or give up.
 */
export function applyDiscount(
  rules: DiscountRules,
  cart: Cart,
  context: { now: Date; customerUses: number }
): DiscountOutcome {
  if (!rules.isActive) return { ok: false, reason: "That code isn't available." };

  if (rules.startsAt && context.now < rules.startsAt) {
    return { ok: false, reason: "That code isn't active yet." };
  }
  if (rules.endsAt && context.now >= rules.endsAt) {
    return { ok: false, reason: "That code has expired." };
  }

  if (rules.usageLimit !== null && rules.usageCount >= rules.usageLimit) {
    return { ok: false, reason: "That code has been fully claimed." };
  }
  if (rules.perCustomerLimit !== null && context.customerUses >= rules.perCustomerLimit) {
    return { ok: false, reason: "You've already used that code." };
  }

  if (rules.minSubtotal !== null && cart.subtotal < rules.minSubtotal) {
    // Says the number, because "spend more" without one is useless.
    return {
      ok: false,
      reason: `That code needs an order of at least ${rules.minSubtotal}.`,
    };
  }

  if (rules.type === "FREE_SHIPPING") {
    // Nothing to give away if delivery is already free — better to say so than
    // to accept the code and change nothing.
    if (cart.shippingFee <= 0) {
      return { ok: false, reason: "Delivery is already free on this order." };
    }
    return {
      ok: true,
      amountOffSubtotal: 0,
      amountOffShipping: cart.shippingFee,
      totalSaving: cart.shippingFee,
    };
  }

  const raw =
    rules.type === "PERCENTAGE"
      ? Math.round((cart.subtotal * rules.value) / 100)
      : rules.value;

  // Never more than the goods are worth. A fixed 2000 off a 500 order must
  // take 500, not leave a negative total and a refund to explain.
  const amountOffSubtotal = Math.max(0, Math.min(raw, cart.subtotal));

  if (amountOffSubtotal === 0) {
    return { ok: false, reason: "That code doesn't take anything off this order." };
  }

  return { ok: true, amountOffSubtotal, amountOffShipping: 0, totalSaving: amountOffSubtotal };
}

/** How a discount reads in a list, e.g. "10% off" or "Rs 500 off". */
export function describeDiscount(type: DiscountType, value: number): string {
  if (type === "FREE_SHIPPING") return "Free delivery";
  if (type === "PERCENTAGE") return `${value}% off`;
  return `Rs ${value.toLocaleString("en-PK")} off`;
}

/** Whether a discount is usable right now, ignoring any particular cart. */
export function discountState(
  rules: Pick<DiscountRules, "isActive" | "startsAt" | "endsAt" | "usageLimit" | "usageCount">,
  now: Date
): "active" | "scheduled" | "expired" | "used-up" | "off" {
  if (!rules.isActive) return "off";
  if (rules.startsAt && now < rules.startsAt) return "scheduled";
  if (rules.endsAt && now >= rules.endsAt) return "expired";
  if (rules.usageLimit !== null && rules.usageCount >= rules.usageLimit) return "used-up";
  return "active";
}
