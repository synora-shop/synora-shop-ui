/**
 * Reading Prisma's errors by code rather than by prose.
 *
 * Two admin actions used to decide whether a save had hit a unique constraint
 * by testing `error.message.includes("Unique constraint")`. That works until
 * Prisma rewords the sentence, at which point the friendly explanation silently
 * stops matching and the merchant is shown a raw database error instead — a
 * failure that would pass every test written against the old wording.
 *
 * The codes are documented API and do not move:
 *   P2002 — unique constraint violated
 *   P2025 — record required by the operation was not found
 */

type PrismaError = {
  code?: unknown;
  meta?: {
    target?: unknown;
    /**
     * Prisma 7 with a driver adapter reports the constraint through the
     * driver rather than in `meta.target`, which stays undefined. Both shapes
     * are read below — `target` is what Prisma has always documented, and this
     * is what actually arrives on this stack.
     */
    driverAdapterError?: {
      cause?: { constraint?: { fields?: unknown } };
    };
  };
};

function asPrismaError(error: unknown): PrismaError | null {
  if (typeof error !== "object" || error === null) return null;
  return error as PrismaError;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return asPrismaError(error)?.code === "P2002";
}

export function isNotFoundError(error: unknown): boolean {
  return asPrismaError(error)?.code === "P2025";
}

/**
 * The field names a unique constraint was violated on, when Prisma reports them.
 *
 * `meta.target` is usually an array of column names, occasionally a single
 * string, and sometimes absent — it depends on the database and the constraint.
 * Callers should treat an empty result as "something was already taken" rather
 * than as "nothing was".
 */
export function uniqueConstraintFields(error: unknown): string[] {
  const meta = asPrismaError(error)?.meta;

  // Postgres reports some column names quoted, because that is how they are
  // written in the constraint definition — `"shopId"` arrives with the quotes
  // as part of the string.
  const clean = (value: unknown): string[] =>
    (Array.isArray(value) ? value : typeof value === "string" ? [value] : [])
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.replace(/^"|"$/g, ""))
      .filter(Boolean);

  const fromTarget = clean(meta?.target);
  if (fromTarget.length > 0) return fromTarget;

  return clean(meta?.driverAdapterError?.cause?.constraint?.fields);
}

/**
 * A sentence naming what was already taken.
 *
 * `fallback` is used when Prisma does not say which column collided, which is
 * why it should still be a complete, useful sentence on its own.
 */
export function describeUniqueConstraint(error: unknown, fallback: string): string {
  const fields = uniqueConstraintFields(error)
    // The shop is on nearly every unique index here and is never the part a
    // merchant chose, so naming it would only confuse.
    .filter((f) => f !== "shopId")
    .map((f) => FIELD_LABELS[f] ?? f);

  if (fields.length === 0) return fallback;
  if (fields.length === 1) return `That ${fields[0]} is already in use.`;
  return `That ${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]} combination is already in use.`;
}

/** Column names as a merchant would say them. */
const FIELD_LABELS: Record<string, string> = {
  slug: "web address",
  sku: "SKU",
  name: "name",
  title: "title",
  email: "email address",
  hostname: "domain",
  subdomain: "store address",
  key: "key",
};
