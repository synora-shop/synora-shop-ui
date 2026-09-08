import {
  assertAllowedHost,
  GATEWAY_TIMEOUT_MS,
  type GatewayAdapter,
  type GatewayCredentials,
  type LookupResult,
  type ProbeResult,
  type StartArgs,
  type StartResult,
} from "@/lib/payments/adapter";
import type { GatewayModeValue } from "@/lib/payments/providers";

/**
 * PayFast (Pakistan) — gopayfast.com.
 *
 * Not to be confused with Payfast of South Africa, which shares the name, has a
 * completely different API, and is what a search engine hands you first.
 *
 * The flow:
 *
 *   1. We POST the merchant's MERCHANT_ID and SECURED_KEY, with the amount and
 *      our reference, and get back a short-lived ACCESS_TOKEN.
 *   2. The browser POSTs a form to PostTransaction carrying that token. The
 *      customer pays on PayFast's page.
 *   3. PayFast posts a notification to CHECKOUT_URL and returns the customer to
 *      SUCCESS_URL or FAILURE_URL.
 *   4. We ask PayFast what actually happened, with the merchant's credentials,
 *      and only then is anything paid.
 *
 * Step 4 is the one that matters, and it is the step the popular integrations
 * skip. The widely-used Laravel package marks an order paid on any POST that
 * merely contains a transaction id — its own `validateIPN` returns true after
 * checking that a field exists, with a comment suggesting signature
 * verification "can be added". The field PayFast calls SIGNATURE is not a
 * signature: the reference SDKs fill it with random hex and the basket id. So
 * there is nothing on the callback to verify, and the only honest way to know
 * whether money moved is to ask.
 *
 * Endpoints are overridable from the environment because the API reference is
 * behind a login and country-specific, and a merchant's onboarding pack is the
 * authority on which host their account lives behind. Overrides are checked
 * against an allowlist — see assertAllowedHost.
 */

/** Hosts this adapter may ever talk to, however it is configured. */
const ALLOWED_HOSTS = ["apps.net.pk", "gopayfast.com"] as const;

/**
 * Where each environment lives.
 *
 * The sandbox pair is confirmed by two independent public SDKs. The live pair
 * is the conventional counterpart and must be checked against the merchant's
 * own onboarding pack — which is why going live re-probes the credentials
 * against the live host before it is allowed, rather than trusting this
 * constant and finding out at a customer's checkout.
 */
function endpoints(mode: GatewayModeValue) {
  const sandbox = mode === "SANDBOX";
  const base = sandbox
    ? process.env.PAYFAST_SANDBOX_BASE || "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/"
    : process.env.PAYFAST_LIVE_BASE || "https://ipg1.apps.net.pk/Ecommerce/api/Transaction/";
  const verifyBase = sandbox
    ? process.env.PAYFAST_SANDBOX_VERIFY_BASE || "https://ipguat.apps.net.pk/Ecommerce/api/"
    : process.env.PAYFAST_LIVE_VERIFY_BASE || "https://ipg1.apps.net.pk/Ecommerce/api/";

  return {
    token: assertAllowedHost(new URL("GetAccessToken", base).toString(), ALLOWED_HOSTS).toString(),
    checkout: assertAllowedHost(new URL("PostTransaction", base).toString(), ALLOWED_HOSTS).toString(),
    verifyBase: assertAllowedHost(verifyBase, ALLOWED_HOSTS).toString(),
  };
}

/** PKR has no minor unit in practice, but PayFast wants two decimal places. */
function amountString(amount: number): string {
  return amount.toFixed(2);
}

/** `YYYY-MM-DD HH:mm:ss`, which is the shape ORDER_DATE is documented as. */
function orderDate(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${now.getUTCFullYear()}-${p(now.getUTCMonth() + 1)}-${p(now.getUTCDate())} ${p(
    now.getUTCHours()
  )}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())}`;
}

async function postForm(url: string, body: Record<string, string>): Promise<unknown> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(body).toString(),
    signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`PayFast returned ${res.status}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("PayFast returned something that is not JSON");
  }
}

/** Case-insensitive read, because these APIs are inconsistent about it. */
function field(source: unknown, ...names: string[]): string | null {
  if (!source || typeof source !== "object") return null;
  const entries = Object.entries(source as Record<string, unknown>);
  for (const name of names) {
    const hit = entries.find(([k]) => k.toLowerCase() === name.toLowerCase());
    if (hit && hit[1] != null && hit[1] !== "") return String(hit[1]);
  }
  return null;
}

/** Fetch a one-time access token. Also serves as the credential probe. */
async function accessToken(
  credentials: GatewayCredentials,
  mode: GatewayModeValue,
  args: { reference: string; amount: number; currency: string }
): Promise<string> {
  const { token } = endpoints(mode);
  const payload = await postForm(token, {
    MERCHANT_ID: credentials.merchantId,
    SECURED_KEY: credentials.securedKey,
    BASKET_ID: args.reference,
    TXNAMT: amountString(args.amount),
    CURRENCY_CODE: args.currency,
  });

  const value = field(payload, "ACCESS_TOKEN", "token");
  if (!value) {
    // The message from PayFast, if it gave one, is safe to surface: it names
    // the problem with the *merchant's* account, not anything of ours.
    const why = field(payload, "MESSAGE", "message", "ERROR_MESSAGE") ?? "no access token returned";
    throw new Error(`PayFast refused the credentials (${why})`);
  }
  return value;
}

/**
 * How PayFast's own words map onto the four states the engine understands.
 *
 * Anything unrecognised is UNKNOWN, and UNKNOWN never pays for an order. That
 * is the important half: a status this list has not seen must not be guessed
 * at optimistically, because the optimistic guess ships goods.
 */
function readState(raw: string | null): "PAID" | "FAILED" | "PENDING" | "UNKNOWN" {
  if (!raw) return "UNKNOWN";
  const value = raw.trim().toUpperCase();
  // "00" is PayFast's success response code across its APIs.
  if (value === "00" || value === "0" || value === "PAID" || value === "SUCCESS" || value === "COMPLETED") {
    return "PAID";
  }
  if (
    value === "FAILED" ||
    value === "DECLINED" ||
    value === "CANCELLED" ||
    value === "CANCELED" ||
    value === "REVERSED" ||
    value === "EXPIRED"
  ) {
    return "FAILED";
  }
  if (value === "PENDING" || value === "IN_PROGRESS" || value === "INITIATED") return "PENDING";
  return "UNKNOWN";
}

export const payfast: GatewayAdapter = {
  provider: "PAYFAST",

  async probe(credentials, mode): Promise<ProbeResult> {
    try {
      // A token request needs an amount and a basket id, so the probe asks for
      // a token against a throwaway reference. It moves no money — a token is
      // permission to show a payment page, not a charge — and it is the only
      // call that proves both halves of the credential are right.
      await accessToken(credentials, mode, {
        reference: `probe-${Date.now().toString(36)}`,
        amount: 1,
        currency: "PKR",
      });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not reach PayFast" };
    }
  },

  async start(args: StartArgs): Promise<StartResult> {
    try {
      const token = await accessToken(args.credentials, args.mode, {
        reference: args.reference,
        amount: args.amount,
        currency: args.currency,
      });
      const { checkout } = endpoints(args.mode);

      const fields: Record<string, string> = {
        MERCHANT_ID: args.credentials.merchantId,
        MERCHANT_NAME: args.shopName,
        TOKEN: token,
        PROCCODE: "00",
        TXNAMT: amountString(args.amount),
        CURRENCY_CODE: args.currency,
        CUSTOMER_MOBILE_NO: args.customerPhone,
        CUSTOMER_EMAIL_ADDRESS: args.customerEmail,
        // PayFast's own field of this name. It is not a cryptographic
        // signature and nothing is verified against it — the SDKs fill it with
        // random hex — so ours carries the reference and no secret.
        SIGNATURE: args.reference,
        VERSION: "SYNORA-1.0",
        TXNDESC: args.description.slice(0, 120),
        BASKET_ID: args.reference,
        ORDER_DATE: orderDate(),
        SUCCESS_URL: args.returnUrl,
        FAILURE_URL: args.failureUrl,
        CHECKOUT_URL: args.callbackUrl,
      };
      if (args.credentials.storeId) fields.STORE_ID = args.credentials.storeId;

      return { ok: true, url: checkout, fields };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Could not start the payment" };
    }
  },

  async lookup(credentials, mode, reference): Promise<LookupResult> {
    try {
      const { verifyBase } = endpoints(mode);
      const url = new URL("transaction/view/basket/id", verifyBase);
      url.searchParams.set("basket_id", reference);
      assertAllowedHost(url.toString(), ALLOWED_HOSTS);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          // The merchant's own credentials, over the wire to PayFast alone.
          Authorization: `Basic ${Buffer.from(
            `${credentials.merchantId}:${credentials.securedKey}`
          ).toString("base64")}`,
        },
        signal: AbortSignal.timeout(GATEWAY_TIMEOUT_MS),
        cache: "no-store",
      });

      const text = await res.text();
      if (!res.ok) return { ok: false, error: `PayFast returned ${res.status} when asked about this payment` };

      let payload: unknown;
      try {
        payload = JSON.parse(text);
      } catch {
        return { ok: false, error: "PayFast's answer was not JSON" };
      }

      // Some of these APIs wrap the row in `data` or in a single-item array.
      let row: unknown = payload;
      const inner = (payload as Record<string, unknown>)?.data ?? (payload as Record<string, unknown>)?.Data;
      if (inner) row = Array.isArray(inner) ? inner[0] : inner;
      else if (Array.isArray(payload)) row = payload[0];
      if (!row || typeof row !== "object") {
        // No row means PayFast has never heard of this reference. Unpaid, not
        // an error: this is the ordinary answer for an abandoned checkout.
        return { ok: true, state: "UNKNOWN", amount: null, currency: null, providerRef: null, detail: "No transaction found" };
      }

      const rawAmount = field(row, "transaction_amount", "TXNAMT", "amount", "txnamt");
      const parsedAmount = rawAmount == null ? null : Number(rawAmount);

      return {
        ok: true,
        state: readState(field(row, "err_code", "ERR_CODE", "status", "STATUS", "transaction_status", "code")),
        amount: parsedAmount != null && Number.isFinite(parsedAmount) ? parsedAmount : null,
        currency: field(row, "currency", "CURRENCY_CODE", "currency_code"),
        providerRef: field(row, "transaction_id", "TRANSACTION_ID", "retrieval_ref", "RETRIEVAL_REF"),
        detail: (field(row, "err_msg", "ERR_MSG", "message", "MESSAGE") ?? "").slice(0, 200),
      };
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      return {
        ok: false,
        error: timedOut ? "PayFast did not answer in time" : "Could not reach PayFast",
      };
    }
  },
};
