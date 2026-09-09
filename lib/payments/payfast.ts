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
 * The token and checkout pair is confirmed two ways: by two independent public
 * SDKs, and by asking the hosts directly — the sandbox answers a bad key with a
 * 500, and PostTransaction answers a GET with a 405, both of which are the
 * replies of endpoints that exist.
 *
 * **The transaction-status endpoint has no default, on purpose.** It is not
 * published: the reference package requires the integrator to configure it,
 * and every path that could plausibly be it answers 404 from outside. A guessed
 * default would be worse than none, because it would fail quietly — payments
 * would simply never confirm, and nobody would be told why. So it is required
 * configuration, its absence is reported as a blocked gateway on the settings
 * screen, and going live is refused until it is set. The value comes from the
 * merchant's own PayFast onboarding pack.
 */
function endpoints(mode: GatewayModeValue) {
  const sandbox = mode === "SANDBOX";
  const base = sandbox
    ? process.env.PAYFAST_SANDBOX_BASE || "https://ipguat.apps.net.pk/Ecommerce/api/Transaction/"
    : process.env.PAYFAST_LIVE_BASE || "https://ipg1.apps.net.pk/Ecommerce/api/Transaction/";
  const verifyBase = sandbox
    ? process.env.PAYFAST_SANDBOX_VERIFY_BASE
    : process.env.PAYFAST_LIVE_VERIFY_BASE;

  return {
    token: assertAllowedHost(new URL("GetAccessToken", base).toString(), ALLOWED_HOSTS).toString(),
    checkout: assertAllowedHost(new URL("PostTransaction", base).toString(), ALLOWED_HOSTS).toString(),
    verifyBase: verifyBase
      ? assertAllowedHost(verifyBase, ALLOWED_HOSTS).toString()
      : null,
  };
}

/** Whether payments in this mode can be verified at all. */
export function payfastCanVerify(mode: GatewayModeValue): boolean {
  return !!(mode === "SANDBOX"
    ? process.env.PAYFAST_SANDBOX_VERIFY_BASE
    : process.env.PAYFAST_LIVE_VERIFY_BASE);
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

  let payload: unknown = null;
  try {
    payload = JSON.parse(text);
  } catch {
    /* Left null; handled below. */
  }

  if (!res.ok) {
    // PayFast answers an unrecognised merchant with a 500 and a .NET null
    // reference rather than a refusal, so the status code alone cannot be
    // shown to a shop owner — "PayFast returned 500" tells them nothing they
    // can act on. Confirmed by asking the sandbox directly with a made-up key.
    const exception = field(payload, "ExceptionType", "ExceptionMessage") ?? "";
    if (res.status >= 500 && /NullReference/i.test(exception)) {
      throw new Error("PayFast did not recognise this Merchant ID and Secured key");
    }
    const said = field(payload, "MESSAGE", "message", "Message", "ERROR_MESSAGE");
    throw new Error(said ? `PayFast said: ${said}` : `PayFast returned ${res.status}`);
  }

  if (payload == null) throw new Error("PayFast returned something that is not JSON");
  return payload;
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

/**
 * A bearer token for PayFast's REST API, per their documented `POST /token`.
 *
 * Lowercase parameters, `customer_ip` required, and the token comes back as
 * `token` — all three different from what the community SDKs do, which is why
 * an earlier version of this file asked the wrong endpoint for the wrong field.
 *
 * The response also carries `refresh_token` and `expiry`. Neither is kept: a
 * status check mints a token, uses it once and drops it. Caching a credential
 * to save a round trip is not a trade worth making here.
 */
async function restToken(
  credentials: GatewayCredentials,
  mode: GatewayModeValue,
  customerIp: string
): Promise<string> {
  const { verifyBase } = endpoints(mode);
  if (!verifyBase) throw new Error("No PayFast API address is configured");

  const payload = await postForm(new URL("token", verifyBase).toString(), {
    merchant_id: credentials.merchantId,
    secured_key: credentials.securedKey,
    grant_type: "client_credentials",
    customer_ip: customerIp,
  });

  const value = field(payload, "token", "ACCESS_TOKEN");
  if (!value) {
    const why = field(payload, "message", "MESSAGE") ?? "no token returned";
    throw new Error(`PayFast refused the credentials (${why})`);
  }
  return value;
}

/**
 * The token for the hosted checkout redirect.
 *
 * Deliberately still on the older endpoint the public SDKs use. The hosted
 * flow — mint a token, POST a form to PostTransaction, customer pays on
 * PayFast's page — is a different API from the REST one above, and which of
 * them a given merchant account is enabled for is not something to guess at.
 * See docs/QUEUE.md: confirming this against PayFast's "Scenarios" and
 * "Hashed Parameters" pages is the one piece of the integration still open.
 */
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
 * PayFast's response codes, taken from their own Error Codes table.
 *
 * Not guessed. An earlier version of this file inferred the success values
 * from the community SDKs and had "00", "SUCCESS", "PAID" — which would have
 * read **79, Alternate Success, as unrecognised** and left a genuinely paid
 * order unpaid. Guessing which codes mean paid is how an integration either
 * ships goods for free or refuses money it has taken.
 *
 * Two codes deserve their reasoning written down:
 *
 *   79  is a success. It is not obvious from the number and it is the one a
 *       guess misses.
 *   002 is "Time Out", which sounds like a failure and is not one: the
 *       transaction's outcome is simply unknown to PayFast at that moment.
 *       Treated as pending so it is asked about again, rather than as failed,
 *       which would cancel an order somebody may have paid for.
 */
const PAYFAST_CODES = {
  /** Processed OK, and the alternate success response. */
  paid: new Set(["00", "000", "0", "79"]),
  /** Not settled yet. Asked about again rather than decided. */
  pending: new Set(["001", "01", "1", "002", "02", "2"]),
  /**
   * Declined, and why. Listed rather than treated as "anything else", so a
   * code PayFast adds later lands in UNKNOWN and is never read as paid.
   */
  failed: new Set([
    "97", // insufficient balance
    "106", // transaction limit exceeded
    "3", // inactive account
    "14", // incorrect details / inactive card
    "15", // inactive card
    "55", // invalid OTP or PIN
    "54", // card expired
    "13", // invalid amount
    "126", // invalid account details
    "75", // maximum PIN retries exceeded
    "42", // invalid CNIC
    "423", // unable to process, try later
    "41", // details mismatched
    "806", // OTP could not be verified
    "807", // too many attempts
    "9000", // rejected by fraud management
  ]),
} as const;

/**
 * How PayFast's codes map onto the four states the engine understands.
 *
 * Anything unrecognised is UNKNOWN, and UNKNOWN never pays for an order. That
 * is the important half: a status this list has not seen must not be guessed
 * at optimistically, because the optimistic guess ships goods.
 */
function readState(raw: string | null): "PAID" | "FAILED" | "PENDING" | "UNKNOWN" {
  if (!raw) return "UNKNOWN";
  const code = raw.trim().toUpperCase();
  if (PAYFAST_CODES.paid.has(code)) return "PAID";
  if (PAYFAST_CODES.pending.has(code)) return "PENDING";
  if (PAYFAST_CODES.failed.has(code)) return "FAILED";
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

  async lookup(credentials, mode, reference, context): Promise<LookupResult> {
    try {
      const { verifyBase } = endpoints(mode);
      if (!verifyBase) {
        // Fails closed, loudly. Without somewhere to ask, nothing can be
        // confirmed — and confirming on anything less than an answer from
        // PayFast is the one thing this whole engine exists not to do.
        return {
          ok: false,
          error:
            "This platform has not been told where to check PayFast payments. Nothing can be confirmed until PAYFAST_SANDBOX_VERIFY_BASE / PAYFAST_LIVE_VERIFY_BASE is set from your PayFast onboarding pack.",
        };
      }

      // Both of these were recorded when the customer was sent to pay, because
      // PayFast requires them to answer and they are not derivable afterwards:
      // the IP belonged to a browser that has long gone, and the order date has
      // to be the exact string that was sent.
      if (!context?.customerIp || !context?.orderDate) {
        return {
          ok: false,
          error: "This payment was started before we recorded what PayFast needs to check it.",
        };
      }

      // The status API is authenticated with a bearer token, not with the
      // merchant's key directly — so a check costs two calls, one to mint a
      // token and one to ask.
      const token = await restToken(credentials, mode, context.customerIp);

      const url = new URL(`transaction/basket_id/${encodeURIComponent(reference)}`, verifyBase);
      url.searchParams.set("order_date", context.orderDate);
      url.searchParams.set("customer_ip", context.customerIp);
      assertAllowedHost(url.toString(), ALLOWED_HOSTS);

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
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

      // PayFast's documented status response carries no amount:
      //   { status_code, status_msg, rdv_message_key, basket_id, transaction_id, code }
      // It is still read, because a response richer than the documented one is
      // common and an amount we can check is worth having. When it is absent
      // the engine is told so explicitly rather than being handed a zero — see
      // how `amount: null` is treated in lib/payments/verify.ts.
      const rawAmount = field(row, "transaction_amount", "amount", "txnamt", "TXNAMT");
      const parsedAmount = rawAmount == null ? null : Number(rawAmount);

      return {
        ok: true,
        state: readState(field(row, "status_code", "code", "err_code", "status")),
        amount: parsedAmount != null && Number.isFinite(parsedAmount) ? parsedAmount : null,
        currency: field(row, "currency", "CURRENCY_CODE", "currency_code"),
        providerRef: field(row, "transaction_id", "TRANSACTION_ID", "retrieval_ref"),
        detail: (field(row, "status_msg", "message", "err_msg", "rdv_message_key") ?? "").slice(0, 200),
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
