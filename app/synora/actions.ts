"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { synoraTeamMember } from "@/lib/help-server";
import { teamInitials } from "@/lib/team";
import { LIMITS, STATUSES, statusLabel, type HelpStatusName } from "@/lib/help";
import { CHANGE_KINDS, readChanges } from "@/lib/release-notes";
import { sendHelpUpdateEmail } from "@/lib/email";

/**
 * What the Synora team does from the console (14 October). Each action asks
 * again who is calling: a page being hidden is not the rule, this is.
 */

type Result = { ok: true; emailFailed?: boolean } | { ok: false; error: string };
const NOT_TEAM: Result = { ok: false, error: "Only the Synora team can do that." };

/**
 * Answer a request, change its status, or both.
 *
 * "thread": the reply shows in the sender's /support page, and they are emailed
 * about it if they asked to be. "email": the reply is sent to them as an
 * email whatever that switch says, because email is the channel the team
 * chose; it is kept in the thread too, marked as sent by email.
 */
export async function answerHelpRequest(input: { number: number; body: string; via: "thread" | "email"; statusTo?: HelpStatusName | "" }): Promise<Result> {
  const me = await synoraTeamMember();
  if (!me) return NOT_TEAM;

  const r = await prisma.helpRequest.findUnique({ where: { number: input.number }, include: { user: { select: { email: true } } } });
  if (!r) return { ok: false, error: "That request no longer exists." };

  const body = (input.body ?? "").trim().slice(0, LIMITS.reply);
  const statusTo = input.statusTo && STATUSES[r.kind].includes(input.statusTo) && input.statusTo !== r.status ? input.statusTo : undefined;
  if (!body && !statusTo) return { ok: false, error: "Write a reply or choose a new status." };
  if (input.via === "email" && !body) return { ok: false, error: "An email needs something written in it." };

  const now = new Date();
  await prisma.$transaction([
    prisma.helpMessage.create({
      data: { requestId: r.id, fromTeam: true, authorName: teamInitials(me.email) || me.name, body, viaEmail: input.via === "email" && !!body, statusTo },
    }),
    prisma.helpRequest.update({
      where: { id: r.id },
      data: { ...(statusTo ? { status: statusTo } : {}), ...(body ? { teamRepliedAt: now } : {}) },
    }),
  ]);

  let emailFailed = false;
  if ((input.via === "email" && body) || r.notify) {
    try {
      await sendHelpUpdateEmail(r.user.email, {
        number: r.number,
        kind: r.kind,
        subject: r.subject,
        status: statusTo ? statusLabel(r.kind, statusTo) : undefined,
        reply: body || undefined,
        from: `${teamInitials(me.email) || me.name} at Synora`,
      });
    } catch (err) {
      emailFailed = true;
      console.error("[synora] help update email failed", err);
    }
  }

  revalidatePath(`/synora/requests/${r.number}`);
  revalidatePath(r.kind === "TICKET" ? "/synora/tickets" : "/synora/suggestions");
  revalidatePath(`/support/${r.number}`);
  return { ok: true, emailFailed };
}

/** Publish a patch note, or change one already published. */
export async function saveReleaseNote(input: { id?: string; title: string; date: string; changes: { kind: string; text: string }[] }): Promise<Result> {
  const me = await synoraTeamMember();
  if (!me) return NOT_TEAM;

  const title = (input.title ?? "").trim().slice(0, 120);
  const changes = readChanges(input.changes.map((c) => ({ kind: CHANGE_KINDS.find((k) => k === c.kind), text: (c.text ?? "").slice(0, 600) })));
  const day = /^\d{4}-\d{2}-\d{2}$/.test(input.date ?? "") ? new Date(`${input.date}T00:00:00Z`) : null;
  if (title.length < 3) return { ok: false, error: "Give the release a title." };
  if (!day || Number.isNaN(day.getTime())) return { ok: false, error: "Choose the date it went out." };
  if (changes.length === 0) return { ok: false, error: "Add at least one change." };

  const data = { title, publishedOn: day, changes, authorName: me.name };
  if (input.id) {
    const done = await prisma.releaseNote.updateMany({ where: { id: input.id }, data });
    if (done.count !== 1) return { ok: false, error: "That note no longer exists." };
  } else {
    await prisma.releaseNote.create({ data });
  }
  revalidatePath("/release-notes");
  revalidatePath("/synora/patch-notes");
  return { ok: true };
}

export async function deleteReleaseNote(id: string): Promise<Result> {
  const me = await synoraTeamMember();
  if (!me) return NOT_TEAM;
  await prisma.releaseNote.deleteMany({ where: { id } });
  revalidatePath("/release-notes");
  revalidatePath("/synora/patch-notes");
  return { ok: true };
}
