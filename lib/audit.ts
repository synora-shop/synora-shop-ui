import { prisma } from "@/lib/prisma";

// Who did what, per shop.
//
// The value of an audit log is entirely in its completeness, and completeness
// depends on it being easier to call than to skip. So: one function, no setup,
// never throws. A logging failure must not roll back the thing being logged —
// losing one line is a gap in the record, while failing the write is a broken
// feature, and those are not close in cost.
//
// The actor's email is copied in rather than only referenced, so the trail
// stays readable after a staff member is removed. That is exactly when someone
// tends to read it.

/** Actions worth recording. Named subject-first so the log sorts usefully. */
export type AuditAction =
  | "shop.create"
  | "shop.pause"
  | "shop.resume"
  | "shop.close"
  | "shop.settings.update"
  | "domain.add"
  | "domain.remove"
  | "domain.primary"
  | "discount.create"
  | "discount.enable"
  | "discount.disable"
  | "discount.delete"
  | "staff.invite"
  | "staff.invite.revoke"
  | "staff.join"
  | "staff.role.change"
  | "staff.remove"
  | "staff.ownership.transfer"
  | "account.password.change"
  | "account.password.reset"
  | "account.email.verify"
  | "account.sessions.revoke"
  | "product.create"
  | "product.update"
  | "product.delete"
  | "order.status.change"
  | "order.delete"
  | "metafield.save"
  | "metafield.delete";

export type AuditEntry = {
  shopId: string;
  action: AuditAction;
  /** Who did it. Omitted for actions the system takes on its own. */
  userId?: string | null;
  actorEmail?: string | null;
  /** What it happened to. */
  entity?: string;
  entityId?: string;
  /** Enough to answer "what changed", not a copy of the row. */
  detail?: Record<string, unknown>;
};

/**
 * Records an action. Never throws.
 *
 * Deliberately not awaited-critical: callers may await it for ordering, but a
 * rejection is swallowed and logged to the console instead of propagating.
 */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        shopId: entry.shopId,
        action: entry.action,
        userId: entry.userId ?? null,
        actorEmail: entry.actorEmail ?? null,
        entity: entry.entity ?? null,
        entityId: entry.entityId ?? null,
        detail: entry.detail ? (entry.detail as object) : undefined,
      },
    });
  } catch (error) {
    // A missing line is a gap in the record; a thrown error is a broken
    // feature. The first is much cheaper than the second.
    console.error("[audit] failed to record", entry.action, error);
  }
}

/**
 * The fields that changed, for the `detail` of an update.
 *
 * Records before and after for changed keys only, so the log says what moved
 * rather than restating the whole row — which is both unreadable and a way to
 * end up storing a password hash in a log.
 */
export function diff(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  ignore: string[] = ["updatedAt", "passwordHash"]
): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (ignore.includes(key)) continue;
    const a = before[key];
    const b = after[key];
    if (JSON.stringify(a) !== JSON.stringify(b)) out[key] = { from: a, to: b };
  }
  return out;
}
