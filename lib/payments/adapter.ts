import type { GatewayModeValue, GatewayProviderValue } from "@/lib/payments/providers";

/**
 * What every gateway must be able to do, and nothing more.
 *
 * Three verbs. Deliberately small, because everything that decides whether an
 * order is paid lives in the engine, not in here: an adapter reports what the
 * provider said and is never asked whether to believe it. A new provider
 * therefore cannot introduce a new way to be wrong about money — the worst it
 * can do is report badly, and the engine treats an unclear report as unpaid.
 *
 * Server only.
 */

/** What a merchant pasted in, opened from its sealed form. */
export type GatewayCredentials = {
  merchantId: string;
  securedKey: string;
  storeId?: string;
};

export type ProbeResult = { ok: true } | { ok: false; error: string };

/**
 * How to send the customer to the provider.
 *
 * A form to submit rather than a URL to follow, because these gateways take
 * their parameters by POST. The engine hands this to the browser and the
 * browser submits it; nothing secret is ever in it — the merchant's secured key
 * stays on the server and only the short-lived token it bought travels.
 */
export type StartResult =
  | { ok: true; url: string; fields: Record<string, string> }
  | { ok: false; error: string };

/** What the provider says happened, in the engine's words rather than theirs. */
export type LookupState = "PAID" | "FAILED" | "PENDING" | "UNKNOWN";

export type LookupResult =
  | {
      ok: true;
      state: LookupState;
      /**
       * The amount the provider says was paid, in whole currency units, or null
       * if it did not say. Null is never treated as "matches".
       */
      amount: number | null;
      currency: string | null;
      /** The provider's transaction id, which is what makes replay a no-op. */
      providerRef: string | null;
      /** Short, safe to store and to show a merchant. Never a credential. */
      detail: string;
    }
  | { ok: false; error: string };

export type StartArgs = {
  credentials: GatewayCredentials;
  mode: GatewayModeValue;
  /** Our reference. Globally unique, unguessable, and what comes back. */
  reference: string;
  /** Whole currency units, matching how prices are stored. See lib/money.ts. */
  amount: number;
  currency: string;
  description: string;
  shopName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  /** Where the customer is returned to, paid or not. */
  returnUrl: string;
  failureUrl: string;
  /** Where the provider posts its notification. A hint, never a proof. */
  callbackUrl: string;
};

export type GatewayAdapter = {
  provider: GatewayProviderValue;
  /**
   * Prove these credentials work, without taking any money.
   *
   * Called before credentials are stored, before they replace working ones, and
   * before a gateway is allowed to go live. A merchant must never find out
   * their key is wrong from a customer.
   */
  probe(credentials: GatewayCredentials, mode: GatewayModeValue): Promise<ProbeResult>;
  start(args: StartArgs): Promise<StartResult>;
  /**
   * Ask the provider what actually happened to a reference.
   *
   * The only thing in this system permitted to say a payment succeeded. Not the
   * callback body, not the return URL, not the customer: this call, made by us,
   * to the provider, with the merchant's own credentials.
   */
  lookup(
    credentials: GatewayCredentials,
    mode: GatewayModeValue,
    reference: string
  ): Promise<LookupResult>;
};

/** Every network call a gateway makes gets one of these. */
export const GATEWAY_TIMEOUT_MS = 12_000;

/**
 * Hosts an adapter is allowed to reach.
 *
 * Endpoints are overridable from the environment so a documentation correction
 * is a configuration change rather than a deploy. That flexibility is also a
 * way to be pointed at somebody else's server, so the value is checked against
 * this list before it is used. Fails closed: an unrecognised host is refused,
 * not warned about.
 */
export function assertAllowedHost(url: string, allowed: readonly string[]): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Gateway endpoint is not a valid URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Gateway endpoints must be https");
  }
  const host = parsed.hostname.toLowerCase();
  const ok = allowed.some((a) => host === a || host.endsWith(`.${a}`));
  if (!ok) throw new Error("Gateway endpoint host is not allowed");
  return parsed;
}
