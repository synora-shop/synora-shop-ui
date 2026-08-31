"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { audit } from "@/lib/audit";
import { RETENTION_DAYS } from "@/lib/store-lifecycle";

// Opening and closing a shop's doors.
//
// Three states a merchant controls:
//
//   PAUSED — "we're not selling right now". The storefront shows a notice, the
//   admin still works, and one button undoes it. Holidays, stock-taking, a
//   family emergency.
//
//   CLOSED — "we're done". The storefront goes dark and the shop stops counting
//   against a plan. Data is kept for a retention window so it is recoverable,
//   because a merchant who closes by accident on a Friday should not lose four
//   years of orders before Monday.
//
// Deleting outright is not offered here at all. It is the one action with no
// way back, and it belongs behind a support conversation rather than a button
// next to "pause".

export type Result = { ok: true; message?: string } | { ok: false; error: string };

export async function pauseStore(): Promise<Result> {
  const me = await requireRole("ADMIN");

  if (me.shop.status === "PAUSED") {
    return { ok: true, message: "Your store is already paused." };
  }
  if (me.shop.status === "CLOSED") {
    return { ok: false, error: "This store is closed. Reopen it before pausing." };
  }
  // Suspension is ours, not theirs. Letting a merchant pause out of it would
  // let them clear the flag by pausing and resuming.
  if (me.shop.status === "SUSPENDED") {
    return { ok: false, error: "This store is suspended. Get in touch and we'll sort it out." };
  }

  await prisma.shop.update({
    where: { id: me.shop.id },
    data: { status: "PAUSED", pausedAt: new Date() },
  });

  await audit({
    shopId: me.shop.id,
    action: "shop.pause",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Shop",
    entityId: me.shop.id,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Your store is paused. Visitors see a notice; you can still work." };
}

export async function resumeStore(): Promise<Result> {
  const me = await requireRole("ADMIN");

  if (me.shop.status !== "PAUSED" && me.shop.status !== "CLOSED") {
    return { ok: true, message: "Your store is already open." };
  }

  // Back to TRIAL rather than ACTIVE: whether a shop is paying is a billing
  // fact, and reopening must not be a way to grant yourself a plan.
  await prisma.shop.update({
    where: { id: me.shop.id },
    data: { status: "TRIAL", pausedAt: null, closedAt: null },
  });

  await audit({
    shopId: me.shop.id,
    action: "shop.resume",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Shop",
    entityId: me.shop.id,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Your store is open again." };
}

/**
 * Closing for good.
 *
 * Owner-only, and it asks for the owner's password. Not because the session is
 * in doubt — it is the same session that just edited a product — but because
 * this is the one action in the admin that a merchant cannot undo themselves
 * after the retention window, and a moment's friction is proportionate. It is
 * also what protects against an unlocked laptop.
 */
export async function closeStore(password: string, confirmation: string): Promise<Result> {
  const me = await requireRole("OWNER");

  // Typing the store's name is the "are you certain" that actually works: a
  // dialog with a Confirm button is dismissed on reflex.
  if (confirmation.trim().toLowerCase() !== me.shop.name.trim().toLowerCase()) {
    return { ok: false, error: `Type the store's name exactly, ${me.shop.name}, to confirm.` };
  }

  const user = await prisma.user.findUnique({
    where: { id: me.userId },
    select: { passwordHash: true },
  });
  if (!user || !(await bcrypt.compare(password ?? "", user.passwordHash))) {
    return { ok: false, error: "That's not your password." };
  }

  if (me.shop.status === "CLOSED") {
    return { ok: true, message: "This store is already closed." };
  }

  await prisma.shop.update({
    where: { id: me.shop.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  await audit({
    shopId: me.shop.id,
    action: "shop.close",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Shop",
    entityId: me.shop.id,
    detail: { retentionDays: RETENTION_DAYS },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Your store is closed. Everything is kept for ${RETENTION_DAYS} days if you change your mind.`,
  };
}
