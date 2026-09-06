"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { audit } from "@/lib/audit";
import { isValidEmail } from "@/lib/validation";
import { createToken, expiryFor, hashToken } from "@/lib/tokens";
import { sendStaffInviteEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { requireRole } from "@/lib/auth-guard";
import { type MemberRole } from "@/lib/roles";
import {
  canAcceptInvite,
  canChangeRole,
  canGrant,
  canRemove,
  canTransferOwnership,
} from "@/lib/staff-rules";

// Staff: who else may work on a shop, and what they may do.
//
// The rules about who may act on whom live in lib/staff-rules.ts as pure
// functions, so they can be exercised exhaustively without a database. What is
// left here is authentication, the writes, and the checks that genuinely need
// to ask the database a question.

export type Result = { ok: true; message?: string } | { ok: false; error: string };

// ---------------------------------------------------------------- invite

export async function inviteStaff(email: string, role: MemberRole): Promise<Result> {
  const me = await requireRole("ADMIN");

  const address = email.trim().toLowerCase();
  if (!isValidEmail(address)) return { ok: false, error: "That email address doesn't look right." };

  const refusal = canGrant({ userId: me.userId, role: me.role }, role);
  if (refusal) return { ok: false, error: refusal };

  const existingMember = await prisma.membership.findFirst({
    where: { shopId: me.shop.id, user: { email: address } },
    include: { user: { select: { email: true } } },
  });
  if (existingMember) {
    return { ok: false, error: `${address} is already on your team.` };
  }

  const { token, tokenHash } = createToken();

  // One live invite per address per shop: re-inviting replaces the previous
  // link rather than leaving two that both work.
  await prisma.staffInvite.upsert({
    where: { shopId_email: { shopId: me.shop.id, email: address } },
    update: {
      role,
      tokenHash,
      invitedById: me.userId,
      expiresAt: expiryFor("STAFF_INVITE"),
      acceptedAt: null,
      revokedAt: null,
    },
    create: {
      shopId: me.shop.id,
      email: address,
      role,
      tokenHash,
      invitedById: me.userId,
      expiresAt: expiryFor("STAFF_INVITE"),
    },
  });

  try {
    await sendStaffInviteEmail(address, token, me.shop.name, me.email);
  } catch (err) {
    console.error("[staff-invite] email failed to send", err);
  }
  await audit({
    shopId: me.shop.id,
    action: "staff.invite",
    userId: me.userId,
    actorEmail: me.email,
    entity: "StaffInvite",
    detail: { email: address, role },
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: `Invitation sent to ${address}.` };
}

export async function revokeInvite(inviteId: string): Promise<Result> {
  const me = await requireRole("ADMIN");

  const invite = await prisma.staffInvite.findFirst({
    where: { id: inviteId, shopId: me.shop.id },
  });
  if (!invite) return { ok: false, error: "That invitation no longer exists." };
  if (invite.acceptedAt) return { ok: false, error: "That invitation was already accepted." };

  await prisma.staffInvite.update({
    where: { id: invite.id },
    data: { revokedAt: new Date() },
  });

  await audit({
    shopId: me.shop.id,
    action: "staff.invite.revoke",
    userId: me.userId,
    actorEmail: me.email,
    entity: "StaffInvite",
    entityId: invite.id,
    detail: { email: invite.email },
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: "Invitation revoked." };
}

/**
 * Accepts an invitation.
 *
 * Deliberately unauthenticated-tolerant: the person following the link may not
 * have an account yet. What it will not do is create one — they sign up first
 * and then follow the link again, so the account is always made by someone who
 * chose their own password.
 */
export async function acceptInvite(token: string): Promise<Result> {
  const ip = await clientIp();
  const limited = await rateLimit("inviteAccept", ip);
  if (!limited.ok) return { ok: false, error: limited.message };

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, error: "Sign in (or create an account) with the invited address first." };
  }

  const invite = await prisma.staffInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { shop: { select: { id: true, name: true } } },
  });

  if (!invite || invite.revokedAt) {
    return { ok: false, error: "That invitation isn't valid any more." };
  }
  if (invite.acceptedAt) return { ok: false, error: "That invitation has already been used." };
  if (invite.expiresAt < new Date()) {
    return { ok: false, error: "That invitation has expired. Ask for a new one." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Sign in first." };

  const refusal = canAcceptInvite(user.email, invite.email);
  if (refusal) return { ok: false, error: refusal };

  await prisma.$transaction([
    prisma.staffInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
    prisma.membership.upsert({
      where: { userId_shopId: { userId, shopId: invite.shopId } },
      update: { role: invite.role, acceptedAt: new Date() },
      create: {
        userId,
        shopId: invite.shopId,
        role: invite.role,
        acceptedAt: new Date(),
      },
    }),
  ]);

  await audit({
    shopId: invite.shopId,
    action: "staff.join",
    userId,
    actorEmail: user.email,
    detail: { role: invite.role },
  });

  return { ok: true, message: `You've joined ${invite.shop.name}.` };
}

// ---------------------------------------------------------------- manage

export async function changeRole(membershipId: string, role: MemberRole): Promise<Result> {
  const me = await requireRole("ADMIN");

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, shopId: me.shop.id },
    include: { user: { select: { email: true } } },
  });
  if (!membership) return { ok: false, error: "That person isn't on your team." };

  const refusal = canChangeRole(
    { userId: me.userId, role: me.role },
    { userId: membership.userId, role: membership.role },
    role
  );
  if (refusal) return { ok: false, error: refusal };

  await prisma.membership.update({ where: { id: membership.id }, data: { role } });

  await audit({
    shopId: me.shop.id,
    action: "staff.role.change",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Membership",
    entityId: membership.id,
    detail: { who: membership.user.email, from: membership.role, to: role },
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: `${membership.user.email} is now ${role.toLowerCase()}.` };
}

export async function removeStaff(membershipId: string): Promise<Result> {
  const me = await requireRole("ADMIN");

  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, shopId: me.shop.id },
    include: { user: { select: { email: true } } },
  });
  if (!membership) return { ok: false, error: "That person isn't on your team." };

  const refusal = canRemove(
    { userId: me.userId, role: me.role },
    { userId: membership.userId, role: membership.role }
  );
  if (refusal) return { ok: false, error: refusal };

  await prisma.membership.delete({ where: { id: membership.id } });

  await audit({
    shopId: me.shop.id,
    action: "staff.remove",
    userId: me.userId,
    actorEmail: me.email,
    detail: { who: membership.user.email, role: membership.role },
  });

  revalidatePath("/admin/staff");
  return { ok: true, message: `${membership.user.email} no longer has access.` };
}

/**
 * Hands the shop to somebody else.
 *
 * Both changes happen together: for a moment in the middle there would
 * otherwise be either two owners or none, and neither is a state the rest of
 * this file is written to expect.
 */
export async function transferOwnership(membershipId: string): Promise<Result> {
  const me = await requireRole("OWNER");

  const target = await prisma.membership.findFirst({
    where: { id: membershipId, shopId: me.shop.id },
    include: { user: { select: { email: true, emailVerifiedAt: true } } },
  });
  if (!target) return { ok: false, error: "That person isn't on your team." };

  const refusal = canTransferOwnership(
    { userId: me.userId, role: me.role },
    {
      userId: target.userId,
      role: target.role,
      joined: target.acceptedAt !== null,
      emailVerified: target.user.emailVerifiedAt !== null,
      email: target.user.email,
    }
  );
  if (refusal) return { ok: false, error: refusal };

  const mine = await prisma.membership.findUnique({
    where: { userId_shopId: { userId: me.userId, shopId: me.shop.id } },
  });
  if (!mine) return { ok: false, error: "You're not a member of this shop." };

  await prisma.$transaction([
    prisma.membership.update({ where: { id: target.id }, data: { role: "OWNER" } }),
    prisma.membership.update({ where: { id: mine.id }, data: { role: "ADMIN" } }),
  ]);

  await audit({
    shopId: me.shop.id,
    action: "staff.ownership.transfer",
    userId: me.userId,
    actorEmail: me.email,
    detail: { to: target.user.email },
  });

  revalidatePath("/admin/staff");
  return {
    ok: true,
    message: `${target.user.email} now owns this shop. You're an admin.`,
  };
}
