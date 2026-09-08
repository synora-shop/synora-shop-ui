/**
 * The gateways this platform knows how to talk to.
 *
 * Client-safe on purpose: the admin screen and the checkout both need to name a
 * provider, describe what it needs, and say what it supports, and none of that
 * is secret. Everything that touches a credential or the network lives in the
 * server-only files beside this one.
 *
 * Adding a provider is this file plus an adapter. Nothing in the engine —
 * sealing, verification, reservations, the state machine — is provider-specific,
 * which is the whole point of the split: the security is written once and every
 * gateway inherits it, rather than each new one arriving with its own version
 * of the same three mistakes.
 */

export const GATEWAY_PROVIDERS = [
  {
    value: "PAYFAST",
    label: "PayFast",
    /** What a merchant sees under the name. */
    blurb: "Cards, wallets, bank accounts and Raast. Pakistan's first licensed gateway.",
    /** Where the merchant gets an account and their keys. */
    signupUrl: "https://gopayfast.com",
    /**
     * The currencies this provider settles in. A shop trading in anything else
     * cannot offer it: charging "100" through a rupee gateway for a product
     * priced at 100 dollars is not a rounding problem, it is the wrong amount.
     */
    currencies: ["PKR"],
    /**
     * How the customer pays. "redirect" means they leave the storefront for the
     * provider's own page and come back. Worth saying out loud on the admin
     * screen, because it is a real conversion cost and merchants should not
     * discover it from their analytics.
     */
    flow: "redirect",
    /** What the merchant must paste in, exactly as the provider names them. */
    fields: [
      {
        name: "merchantId",
        label: "Merchant ID",
        hint: "From your PayFast account. Sometimes shown as MERCHANT_ID.",
      },
      {
        name: "securedKey",
        label: "Secured key",
        hint: "The secret half. Treated like a password — saved encrypted and never shown again.",
        secret: true,
      },
      {
        name: "storeId",
        label: "Store ID",
        hint: "Optional. Only if PayFast issued you one.",
        optional: true,
      },
    ],
  },
] as const;

export type GatewayProviderValue = (typeof GATEWAY_PROVIDERS)[number]["value"];
export type GatewayProviderMeta = (typeof GATEWAY_PROVIDERS)[number];
export type GatewayModeValue = "SANDBOX" | "LIVE";

export function isGatewayProvider(value: unknown): value is GatewayProviderValue {
  return GATEWAY_PROVIDERS.some((p) => p.value === value);
}

export function gatewayMeta(value: string): GatewayProviderMeta | null {
  return GATEWAY_PROVIDERS.find((p) => p.value === value) ?? null;
}

/** Whether a shop trading in this currency may use this provider at all. */
export function providerSupportsCurrency(provider: string, currency: string): boolean {
  const meta = gatewayMeta(provider);
  return meta ? (meta.currencies as readonly string[]).includes(currency) : false;
}

/**
 * How long an unpaid gateway order holds its stock.
 *
 * Thirty minutes: long enough for a customer to find their card, fail a
 * one-time password, and try again; short enough that an abandoned checkout
 * does not keep the last of something out of everyone else's reach for a day.
 */
export const RESERVATION_MS = 30 * 60 * 1000;

/**
 * How the customer-facing name reads at checkout.
 *
 * The provider's name, not "Card": a shopper who is about to be sent to another
 * website should be told which one before they press the button.
 */
export function checkoutLabel(provider: string): string {
  const meta = gatewayMeta(provider);
  return meta ? `Pay online with ${meta.label}` : "Pay online";
}
