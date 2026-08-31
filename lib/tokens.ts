import { createHash, randomBytes, timingSafeEqual } from "crypto";

// One-time links: email verification, password reset, staff invitations.
//
// The rules are the same for all three and they are not negotiable, because
// password reset is one of the most reliable ways into an account:
//
//   Random, not guessable. 32 bytes from the OS, never Math.random().
//   Hashed at rest. A database dump must not yield working links.
//   Single use. Redemption marks the row before anything else happens.
//   Expiring. A link found in an old mailbox two years later is not a key.
//
// Client-safe only in the sense that nothing here touches Prisma; do not import
// it into a browser bundle — it uses node:crypto.

/** How long each kind of link stays usable. */
export const TOKEN_TTL = {
  /** Long enough to survive a slow inbox, short enough to matter. */
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  /** Deliberately short: the window in which a stolen email is dangerous. */
  PASSWORD_RESET: 60 * 60 * 1000,
  /** People forward invitations and act on them days later. */
  STAFF_INVITE: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * A fresh token: the secret to email, and the hash to store.
 *
 * Returned together so a caller cannot store the plaintext by accident — the
 * only way to get one is to get both, and the field names say which is which.
 */
export function createToken(): { token: string; tokenHash: string } {
  // 32 bytes = 256 bits. base64url so it survives being pasted out of an email
  // client without escaping.
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

/**
 * The stored form of a token.
 *
 * SHA-256, not bcrypt: this value is already high-entropy random, so the slow
 * hashing that protects a guessable password buys nothing here, and would make
 * every link redemption needlessly expensive.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Compares two hashes without leaking how much of them matched.
 *
 * The lookup is by hash and the database compares in ordinary time, so this is
 * belt to that braces — but a timing side channel on a token comparison is a
 * classic finding and costs nothing to close.
 */
export function tokensMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** When a token of this kind, issued now, stops working. */
export function expiryFor(kind: keyof typeof TOKEN_TTL): Date {
  return new Date(Date.now() + TOKEN_TTL[kind]);
}

/**
 * A six-digit code, for the cases where a link will not do.
 *
 * Uses the same source of randomness as everything else here. Not a
 * replacement for a token — six digits is 20 bits, which is only safe because
 * attempts are capped and it expires in minutes.
 */
export function createNumericCode(digits = 6): string {
  const max = 10 ** digits;
  // Rejection sampling keeps the distribution flat; taking a modulus of a
  // random integer quietly biases the low values.
  const limit = Math.floor(0xffffffff / max) * max;
  let value: number;
  do {
    value = randomBytes(4).readUInt32BE(0);
  } while (value >= limit);
  return String(value % max).padStart(digits, "0");
}
