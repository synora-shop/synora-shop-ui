import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Limits on how often something may be attempted.
//
// Three things need this and none of them are optional:
//
//   Sign-in, or a password list gets tried against every account you have.
//   Password reset, or the same endpoint becomes a way to mail-bomb someone.
//   The public enquiry form, which is the one unauthenticated write in the app
//   and can otherwise be looped to fill a merchant's inbox and your database.
//
// Backed by a table rather than Redis. That is a deliberate trade: it works on
// day one with the database that already exists, and at the traffic of a
// platform with tens of shops the cost is not measurable. Everything that
// touches the store is in this file, so swapping it later is contained.

export type Limit = {
  /** How many attempts are allowed in a window. */
  max: number;
  /** Window length, in milliseconds. */
  windowMs: number;
  /** How long to refuse everything once the limit trips. */
  blockMs: number;
};

/**
 * The limits themselves, named so a call site reads as its intent.
 *
 * Sign-in allows more attempts than the limits that send mail, because people
 * genuinely mistype passwords and a reset costs someone else an email. What
 * makes it safe is the rate, not the count: 8 in fifteen minutes then a
 * fifteen-minute block is 32 guesses an hour, which makes an online guessing
 * attack pointless while staying short enough that someone who simply forgot
 * their password is not locked out for the afternoon.
 */
export const LIMITS = {
  login: { max: 8, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 },
  passwordReset: { max: 5, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 },
  signup: { max: 5, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 },
  enquiry: { max: 10, windowMs: 60 * 60 * 1000, blockMs: 30 * 60 * 1000 },
  otp: { max: 5, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 },
  inviteAccept: { max: 10, windowMs: 60 * 60 * 1000, blockMs: 30 * 60 * 1000 },
  // Each one is a certificate request at a vendor. Generous enough for someone
  // genuinely setting up a handful of domains, tight enough that a loop cannot
  // spend our quota.
  domainAdd: { max: 10, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 },
  // "Check now" queries someone else's nameservers, so it is limited per
  // domain rather than per shop — checking five domains should not use up the
  // allowance for the sixth.
  domainCheck: { max: 12, windowMs: 15 * 60 * 1000, blockMs: 10 * 60 * 1000 },
  // Shopper sign-up. Public, unauthenticated and a write — the same shape as
  // the enquiry form, and it was the one endpoint of that shape with no limit
  // on it at all.
  customerRegister: { max: 5, windowMs: 60 * 60 * 1000, blockMs: 60 * 60 * 1000 },
  // Trying discount codes is guessing at somebody's promotions, from a form
  // that needs no account. Generous enough for a shopper mistyping the code
  // from an email, tight enough that a dictionary run is pointless.
  discountPreview: { max: 20, windowMs: 15 * 60 * 1000, blockMs: 15 * 60 * 1000 },
} as const satisfies Record<string, Limit>;

export type LimitName = keyof typeof LIMITS;

export type LimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number; message: string };

/**
 * The caller's IP address, as far as it can be known.
 *
 * Behind a proxy the socket address is the proxy, so the forwarded header is
 * what identifies the client. Its first entry is the original client; later
 * ones are the hops. A missing header means an unusual deployment rather than
 * an attack, so it degrades to a shared bucket rather than failing open per
 * caller — everyone without an identifiable address shares one allowance.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip") ?? "unknown";
}

/**
 * Counts an attempt and says whether it is allowed.
 *
 * The check and the increment are one statement, so two requests arriving
 * together cannot both read "7 of 8" and both proceed. `scope` is whatever
 * distinguishes one caller from another — usually an IP, sometimes an email,
 * often both.
 */
export async function rateLimit(name: LimitName, scope: string): Promise<LimitResult> {
  const limit = LIMITS[name];
  const key = `${name}:${scope}`;
  const now = new Date();

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return refusal(name, existing.blockedUntil, now);
  }

  // Past its window, or never seen: start a fresh one.
  if (!existing || existing.windowEnd <= now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, windowEnd: new Date(now.getTime() + limit.windowMs), blockedUntil: null },
      create: { key, count: 1, windowEnd: new Date(now.getTime() + limit.windowMs) },
    });
    return { ok: true, remaining: limit.max - 1 };
  }

  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  if (updated.count > limit.max) {
    const blockedUntil = new Date(now.getTime() + limit.blockMs);
    await prisma.rateLimit.update({ where: { key }, data: { blockedUntil } });
    return refusal(name, blockedUntil, now);
  }

  return { ok: true, remaining: limit.max - updated.count };
}

/**
 * Clears a counter.
 *
 * Called after a *successful* sign-in, so someone who mistyped their password
 * four times and then got it right is not still carrying those four attempts.
 */
export async function clearRateLimit(name: LimitName, scope: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key: `${name}:${scope}` } });
}

/**
 * Removes windows that have long since passed.
 *
 * Nothing reads an expired row, so this is housekeeping rather than
 * correctness — call it from a cron when one exists.
 */
export async function pruneRateLimits(): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.rateLimit.deleteMany({
    where: { windowEnd: { lt: cutoff }, OR: [{ blockedUntil: null }, { blockedUntil: { lt: cutoff } }] },
  });
  return count;
}

function refusal(name: LimitName, until: Date, now: Date): LimitResult {
  const retryAfterSeconds = Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000));
  return { ok: false, retryAfterSeconds, message: MESSAGES[name](retryAfterSeconds) };
}

/**
 * What the caller is told.
 *
 * Each says how long to wait, because "too many requests" with no number is the
 * kind of message that makes people retry immediately and repeatedly. None of
 * them reveal whether the account exists.
 */
const MESSAGES: Record<LimitName, (seconds: number) => string> = {
  login: (s) => `Too many sign-in attempts. Try again in ${humanise(s)}.`,
  passwordReset: (s) => `Too many reset requests. Try again in ${humanise(s)}.`,
  signup: (s) => `Too many sign-ups from here. Try again in ${humanise(s)}.`,
  enquiry: (s) => `You've sent a lot of enquiries. Try again in ${humanise(s)}.`,
  otp: (s) => `Too many codes requested. Try again in ${humanise(s)}.`,
  inviteAccept: (s) => `Too many attempts. Try again in ${humanise(s)}.`,
  domainAdd: (s) => `That's a lot of domains at once. Try again in ${humanise(s)}.`,
  domainCheck: (s) => `Checked a few times already. DNS is slow, try again in ${humanise(s)}.`,
  customerRegister: (s) => `Too many sign-ups from here. Try again in ${humanise(s)}.`,
  discountPreview: (s) => `Too many codes tried. Try again in ${humanise(s)}.`,
};

export function humanise(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
