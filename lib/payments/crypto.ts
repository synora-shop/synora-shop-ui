import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from "crypto";

// Sealing a merchant's gateway credentials.
//
// A bank account number is meant to be read — it is printed at checkout so a
// customer knows where to send money. A gateway's secured key is the opposite:
// it authorises requests for money, and anyone holding it can speak to the
// provider as that merchant. The two must not be stored the same way, and the
// four columns that came before this file are exactly the wrong precedent.
//
// The rules here:
//
//   Encrypted at rest, so a database dump is not a set of working credentials.
//   Bound to its owner, so a row copied into another shop's id does not decrypt
//     at all rather than decrypting into somebody else's money.
//   Versioned, so the key can be rotated without every merchant re-entering
//     theirs.
//   Never logged, never returned to a browser, never rendered into a form.
//
// AES-256-GCM: authenticated, so a tampered blob fails to open rather than
// opening into something attacker-chosen. The shop id and provider go in as
// additional authenticated data, which is what "bound to its owner" means —
// they are not stored in the blob, they are required to open it.
//
// Node only. Do not import this into a client component.

/** Layout of a sealed blob: iv ‖ tag ‖ ciphertext. */
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

export class PaymentCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentCryptoError";
  }
}

/**
 * The keys, parsed from the environment.
 *
 * `PAYMENT_KEYS` is one or more `version:base64` pairs, comma separated, the
 * highest version being the one new secrets are sealed with:
 *
 *     PAYMENT_KEYS="1:<32 random bytes, base64>"
 *     PAYMENT_KEYS="2:<new key>,1:<old key>"   # during a rotation
 *
 * Read on every call rather than cached at module load: a serverless instance
 * that started before the variable was set must not stay broken until it is
 * recycled, and the parse is a few microseconds.
 */
function parseKeys(): Map<number, Buffer> {
  const raw = process.env.PAYMENT_KEYS?.trim();
  const keys = new Map<number, Buffer>();
  if (!raw) return keys;

  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const at = trimmed.indexOf(":");
    if (at < 1) throw new PaymentCryptoError("PAYMENT_KEYS entries must be version:base64");

    const version = Number(trimmed.slice(0, at));
    if (!Number.isInteger(version) || version < 1) {
      throw new PaymentCryptoError("PAYMENT_KEYS versions must be positive whole numbers");
    }

    const key = Buffer.from(trimmed.slice(at + 1), "base64");
    if (key.length !== KEY_BYTES) {
      // Deliberately does not say which version, in case this is ever logged.
      throw new PaymentCryptoError("PAYMENT_KEYS holds a key that is not 32 bytes");
    }
    keys.set(version, key);
  }
  return keys;
}

/**
 * Whether credentials can be stored at all.
 *
 * Checked before the admin screen offers to connect anything: a merchant typing
 * their secured key into a box that cannot encrypt it is worse than a screen
 * that says the platform is not ready.
 */
export function paymentCryptoReady(): boolean {
  try {
    return parseKeys().size > 0;
  } catch {
    return false;
  }
}

/** The version new secrets are sealed with: the highest configured. */
export function currentKeyVersion(): number {
  const keys = parseKeys();
  if (keys.size === 0) throw new PaymentCryptoError("PAYMENT_KEYS is not configured");
  return Math.max(...keys.keys());
}

function keyFor(version: number): Buffer {
  const key = parseKeys().get(version);
  if (!key) {
    throw new PaymentCryptoError(
      `No payment key for version ${version}. A rotation must keep old keys until every row is re-sealed.`
    );
  }
  return key;
}

/**
 * What a blob is tied to.
 *
 * Not stored inside the blob — supplied again at opening time. A `PaymentGateway`
 * row lifted from one shop to another therefore fails authentication instead of
 * handing the new owner working credentials.
 */
export function credentialContext(shopId: string, provider: string): Buffer {
  return Buffer.from(`synora:gateway:v1:${shopId}:${provider}`, "utf8");
}

/**
 * Seal a secret. Returns the blob to store and the key version that sealed it.
 *
 * A plain `Uint8Array` rather than a Node `Buffer`, which is what the database
 * column takes — a Buffer's backing store is not narrowed to an ArrayBuffer and
 * the two are not interchangeable at the type level.
 */
export function seal(
  plaintext: string,
  context: Buffer
): { blob: Uint8Array<ArrayBuffer>; keyVersion: number } {
  const keyVersion = currentKeyVersion();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", keyFor(keyVersion), iv);
  cipher.setAAD(context);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const joined = Buffer.concat([iv, cipher.getAuthTag(), body]);
  const blob = new Uint8Array(new ArrayBuffer(joined.length));
  blob.set(joined);
  return { blob, keyVersion };
}

/**
 * Open a sealed secret.
 *
 * Throws on a wrong key, a wrong context, or a single altered byte. Callers
 * must let that throw rather than falling back to anything — there is no
 * sensible "partly authenticated" outcome for a credential.
 */
export function open(blob: Uint8Array, keyVersion: number, context: Buffer): string {
  const buf = Buffer.from(blob);
  if (buf.length <= IV_BYTES + TAG_BYTES) {
    throw new PaymentCryptoError("Sealed credential is too short to be valid");
  }
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const body = buf.subarray(IV_BYTES + TAG_BYTES);

  const decipher = createDecipheriv("aes-256-gcm", keyFor(keyVersion), iv);
  decipher.setAAD(context);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch {
    // The underlying error names ciphers and lengths. Nothing about a failed
    // credential open should be that specific in a log.
    throw new PaymentCryptoError("Sealed credential could not be opened");
  }
}

/**
 * Constant-time string comparison, for the few places a secret is compared.
 *
 * `===` on a secret leaks its length and its first differing byte through
 * timing. Lengths differ here often enough that the length itself is compared
 * first — which leaks only the length, and only of a value the caller supplied.
 */
export function secretEquals(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}
