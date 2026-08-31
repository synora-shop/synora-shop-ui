import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/tokens";
import type { MemberRole } from "@/lib/roles";

/**
 * What an invitation page can say before anyone accepts.
 *
 * Enough to make the decision — which shop, which address, what access — and
 * nothing else. Only the holder of the token can ask, and the holder of the
 * token is the person the mail was sent to, so naming the shop here leaks
 * nothing they were not already told in the email.
 *
 * Read-only and unauthenticated by design: the invited person may not have an
 * account yet, and will not have a membership of this shop until they accept.
 * Note that it does not go through the shop-scoped client — an invite is looked
 * up by token alone, before any shop is known.
 */
export type InviteSummary =
  | { ok: true; shopName: string; email: string; role: MemberRole }
  | { ok: false; reason: "unknown" | "revoked" | "used" | "expired" };

export async function inviteSummary(token: string): Promise<InviteSummary> {
  if (!token) return { ok: false, reason: "unknown" };

  const invite = await prisma.staffInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      email: true,
      role: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      shop: { select: { name: true } },
    },
  });

  if (!invite) return { ok: false, reason: "unknown" };
  if (invite.revokedAt) return { ok: false, reason: "revoked" };
  if (invite.acceptedAt) return { ok: false, reason: "used" };
  if (invite.expiresAt < new Date()) return { ok: false, reason: "expired" };

  return {
    ok: true,
    shopName: invite.shop.name,
    email: invite.email,
    role: invite.role,
  };
}
