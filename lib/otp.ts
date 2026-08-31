import crypto from "crypto";
import bcrypt from "bcryptjs";

// Sane defaults, overridable per-deployment via env vars (see .env.example).
export const OTP_TTL_MINUTES = Number(process.env.ADMIN_OTP_TTL_MINUTES ?? 10);
export const OTP_MAX_ATTEMPTS = Number(process.env.ADMIN_OTP_MAX_ATTEMPTS ?? 5);
export const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.ADMIN_OTP_RESEND_COOLDOWN_SECONDS ?? 60);

/** Cryptographically random 6-digit code (000000–999999, zero-padded). Not Math.random(). */
export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Codes are hashed at rest, same as passwords — a DB read alone should never reveal a live code. */
export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}
