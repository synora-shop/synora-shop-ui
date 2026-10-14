"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { merchantUser, teamEmails } from "@/lib/help-server";
import { LIMITS, TOPICS, type HelpKindName } from "@/lib/help";
import { sendHelpReceivedEmail, sendHelpTeamAlertEmail } from "@/lib/email";

/**
 * What a merchant can do at /support (14 October). Every action reads the
 * session itself and only ever touches the caller's own requests: a request
 * id from the browser is matched together with the user id, never alone.
 */

type Result = { ok: true; number?: number; emailFailed?: boolean } | { ok: false; error: string };

const SIGNED_OUT = "Your session ended. Sign in again to continue.";

export async function submitHelpRequest(input: {
  kind: HelpKindName;
  topic: string;
  subject: string;
  body: string;
  shopId?: string;
  notify: boolean;
}): Promise<Result> {
  const me = await merchantUser();
  if (!me) return { ok: false, error: SIGNED_OUT };

  const limited = await rateLimit("helpRequest", me.id);
  if (!limited.ok) return { ok: false, error: limited.message };

  const kind: HelpKindName = input.kind === "SUGGESTION" ? "SUGGESTION" : "TICKET";
  const subject = (input.subject ?? "").trim().slice(0, LIMITS.subject);
  const body = (input.body ?? "").trim().slice(0, LIMITS.body);
  const topic = (TOPICS as readonly string[]).includes(input.topic) ? input.topic : "Something else";
  if (subject.length < 4) return { ok: false, error: "Give it a short title, a few words is enough." };
  if (body.length < 10) return { ok: false, error: kind === "TICKET" ? "Tell us a little about what happened." : "Tell us a little about the idea." };
  // Only one of the caller's own shops, or none.
  const shopId = me.shops.some((s) => s.id === input.shopId) ? input.shopId : me.shops.length === 1 ? me.shops[0].id : undefined;

  const request = await prisma.helpRequest.create({
    data: { kind, topic, subject, body, notify: !!input.notify, userId: me.id, shopId, userSeenAt: new Date() },
    select: { number: true },
  });

  // The request is saved whatever happens to the emails; they only report.
  let emailFailed = false;
  try {
    await sendHelpReceivedEmail(me.email, { number: request.number, kind, subject });
  } catch (err) {
    emailFailed = true;
    console.error("[help] confirmation email failed", err);
  }
  try {
    await sendHelpTeamAlertEmail(teamEmails(), { number: request.number, kind, subject, body, fromName: me.name, fromEmail: me.email });
  } catch (err) {
    console.error("[help] team alert failed", err);
  }

  revalidatePath("/support");
  return { ok: true, number: request.number, emailFailed };
}

export async function replyToHelpRequest(number: number, text: string): Promise<Result> {
  const me = await merchantUser();
  if (!me) return { ok: false, error: SIGNED_OUT };
  const limited = await rateLimit("helpReply", me.id);
  if (!limited.ok) return { ok: false, error: limited.message };

  const body = (text ?? "").trim().slice(0, LIMITS.reply);
  if (body.length < 2) return { ok: false, error: "Write a reply first." };

  const request = await prisma.helpRequest.findFirst({ where: { number, userId: me.id } });
  if (!request) return { ok: false, error: "That request isn't yours, or no longer exists." };

  await prisma.$transaction([
    prisma.helpMessage.create({ data: { requestId: request.id, body, authorName: me.name } }),
    // Writing again reopens something that was finished, or waiting on them.
    prisma.helpRequest.update({
      where: { id: request.id },
      data: {
        userSeenAt: new Date(),
        ...(request.status === "WAITING" || request.status === "RESOLVED" ? { status: "OPEN" as const } : {}),
      },
    }),
  ]);

  try {
    await sendHelpTeamAlertEmail(teamEmails(), {
      number,
      kind: request.kind,
      subject: request.subject,
      body,
      fromName: me.name,
      fromEmail: me.email,
      isReply: true,
    });
  } catch (err) {
    console.error("[help] team alert (reply) failed", err);
  }

  revalidatePath(`/support/${number}`);
  revalidatePath("/support");
  return { ok: true };
}

export async function setHelpNotify(number: number, notify: boolean): Promise<Result> {
  const me = await merchantUser();
  if (!me) return { ok: false, error: SIGNED_OUT };
  const done = await prisma.helpRequest.updateMany({ where: { number, userId: me.id }, data: { notify: !!notify } });
  if (done.count !== 1) return { ok: false, error: "That request isn't yours, or no longer exists." };
  revalidatePath("/support");
  return { ok: true };
}
