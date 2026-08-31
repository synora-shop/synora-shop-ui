import { prisma } from "@/lib/prisma";

// Housekeeping: deleting rows that exist only to be read once, or briefly.
//
// Several tables here are write-heavy and read-rarely — a rate-limit window, a
// spent one-time token, an abandoned basket. Nothing ever deletes them, so on a
// long-lived deployment they grow without bound until the database's storage
// limit stops the whole platform. That failure arrives as "everything is
// broken", months after the cause, which is why this exists before it happens
// rather than after.
//
// Deliberately platform-wide rather than per-shop: this is maintenance, not a
// feature, and every row it touches is either expired, spent, or abandoned. The
// tenant-scoping guard has an explicit exception for it (see
// scripts/check-scoped-queries.ts).
//
// Every rule is conservative — a row is removed only once it can no longer
// affect any decision, and security-relevant history is kept far longer than
// operationally necessary.

/** How long each kind of row is kept, and why that number. */
export const RETENTION = {
  /** A rate-limit window is meaningless once it has closed; a day is generous. */
  rateLimitDays: 1,
  /**
   * Verification and reset tokens are single-use and short-lived, but a spent
   * one is evidence of what happened to an account, so it outlives its use.
   */
  tokenDays: 30,
  /** Admin login codes expire in minutes; a week is already forensic. */
  otpDays: 7,
  /**
   * An abandoned basket. Long enough that a shopper who left one open over a
   * holiday still finds it, short enough that they do not accumulate forever.
   */
  /**
   * Audit history — who signed in, who changed staff access, who closed a
   * store. A year, because the question this answers ("what happened to my
   * account?") is usually asked long after the fact.
   */
  auditDays: 365,
} as const;

const day = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * day);

export type PruneReport = Record<string, number>;

/**
 * Deletes what is safely deletable and reports how much of each.
 *
 * Each step is independent: one failing must not stop the rest, because the
 * point is to keep the database from filling up and a partial sweep still does
 * that. Failures are logged and surfaced in the report rather than thrown.
 */
export async function pruneExpiredRows(): Promise<PruneReport> {
  const report: PruneReport = {};

  const step = async (name: string, run: () => Promise<{ count: number }>) => {
    try {
      report[name] = (await run()).count;
    } catch (err) {
      console.error(`[prune] ${name} failed`, err);
      report[name] = -1;
    }
  };

  // A closed window that is no longer blocking anyone.
  await step("rateLimit", () =>
    prisma.rateLimit.deleteMany({
      where: {
        windowEnd: { lt: ago(RETENTION.rateLimitDays) },
        OR: [{ blockedUntil: null }, { blockedUntil: { lt: new Date() } }],
      },
    })
  );

  // Spent or long past its expiry. An unspent, unexpired token is never touched.
  await step("verificationToken", () =>
    prisma.verificationToken.deleteMany({
      where: {
        OR: [
          { consumedAt: { lt: ago(RETENTION.tokenDays) } },
          { expiresAt: { lt: ago(RETENTION.tokenDays) } },
        ],
      },
    })
  );

  await step("adminOtp", () =>
    prisma.adminOtp.deleteMany({
      where: { expiresAt: { lt: ago(RETENTION.otpDays) } },
    })
  );


  await step("auditLog", () =>
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: ago(RETENTION.auditDays) } } })
  );

  return report;
}
