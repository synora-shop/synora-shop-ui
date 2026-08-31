import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendAdminOtpEmail } from "@/lib/email";
import { generateOtpCode, hashOtpCode, OTP_TTL_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/otp";

const HOURLY_REQUEST_CAP = 5;

/**
 * Fresh response object per call — this is deliberately identical on every path
 * (unknown email, wrong password, non-admin account, rate-limited) so this endpoint
 * can't be used as an oracle to enumerate admin emails or brute-force passwords by
 * comparing responses. Only a genuinely valid admin email+password ever results in
 * an email actually being sent — timing differences between paths are a known,
 * accepted limitation (unavoidable without constant-time DB round trips).
 */
function genericResponse() {
  return NextResponse.json({
    ok: true,
    message: "If that account exists, a verification code has been sent.",
  });
}

export async function POST(req: Request) {
  // Sending mail on request is a way to flood an inbox, so it is capped
  // whether or not the address exists.
  const ip = await clientIp();
  const throttled = await rateLimit("otp", ip);
  if (!throttled.ok) {
    return NextResponse.json({ error: throttled.message }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return genericResponse();

  const user = await prisma.user.findUnique({ where: { email } });
  // No shop context at sign-in time, so this asks the weaker question:
  // does this person administer any shop? The per-shop check happens once
  // they land on one.
  const memberships = user
    ? await prisma.membership.count({ where: { userId: user.id, acceptedAt: { not: null } } })
    : 0;
  if (!user || memberships === 0) return genericResponse();

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return genericResponse();

  // Hourly cap — stops an attacker who already has valid credentials from mail-bombing
  // the admin's inbox or hammering the OTP-guessing surface with fresh codes.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.adminOtp.count({
    where: { userId: user.id, createdAt: { gt: hourAgo } },
  });
  if (recentCount >= HOURLY_REQUEST_CAP) return genericResponse();

  // Cooldown — don't fire a second email if one was just sent seconds ago.
  const latest = await prisma.adminOtp.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
    return genericResponse();
  }

  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  await prisma.adminOtp.create({
    data: {
      userId: user.id,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });

  try {
    await sendAdminOtpEmail(user.email, code);
  } catch (err) {
    console.error("[admin-otp] failed to send code", err);
    // Still return the generic response — don't leak delivery-failure state to the client.
  }

  return genericResponse();
}
