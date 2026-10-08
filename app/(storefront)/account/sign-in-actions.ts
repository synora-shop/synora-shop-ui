"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { currentShopId, requireShop } from "@/lib/data/shop";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { generateOtpCode, hashOtpCode, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/otp";
import { isValidEmail } from "@/lib/validation";
import { sendCustomerCodeEmail } from "@/lib/email";

/**
 * A customer's sign-in on the shop's own storefront: an email, a code sent to
 * it, signed in — no password (decided 8 October, as Shopify's new customer
 * accounts). A first sign-in makes the account. Nothing here touches the
 * merchant sign-in; see the "customer" provider in auth.ts.
 *
 * The shop is always the one this request is for, read from the address —
 * never one the browser names.
 */

/** How long a code lasts. */
const CUSTOMER_CODE_MINUTES = 10;

/**
 * Email a code. Says "sent" for any well-formed address, whether or not it
 * has ever bought here — there is nothing to learn by trying addresses.
 */
export async function requestCustomerCode(rawEmail: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!isValidEmail(email) || email.length > 200) return { ok: false, error: "That email address doesn't look right." };

  const shopId = await currentShopId();
  for (const scope of [`ip:${await clientIp()}`, `email:${shopId}:${email}`]) {
    const limited = await rateLimit("customerCode", scope);
    if (!limited.ok) return { ok: false, error: limited.message };
  }

  // A second press within the cooldown re-uses the code already on its way.
  const recent = await prisma.customerOtp.findFirst({
    where: { shopId, email, consumedAt: null, createdAt: { gt: new Date(Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000) } },
    select: { id: true },
  });
  if (recent) return { ok: true };

  const code = generateOtpCode();
  await prisma.customerOtp.create({
    data: { shopId, email, codeHash: await hashOtpCode(code), expiresAt: new Date(Date.now() + CUSTOMER_CODE_MINUTES * 60 * 1000) },
  });
  try {
    await sendCustomerCodeEmail(email, code, (await requireShop()).name, CUSTOMER_CODE_MINUTES);
  } catch (err) {
    console.error("[email] customer code not sent", err);
    return { ok: false, error: "The code couldn't be sent. Try again in a moment." };
  }
  return { ok: true };
}

/** Sign in with the code. False for a wrong, used or expired one. */
export async function signInWithCode(rawEmail: string, rawCode: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const code = typeof rawCode === "string" ? rawCode.replace(/\s/g, "") : "";
  if (!email || !/^\d{6}$/.test(code)) return { ok: false, error: "Enter the 6-digit code from the email." };
  const shopId = await currentShopId();
  const limited = await rateLimit("customerCodeTry", `${shopId}:${email}`);
  if (!limited.ok) return { ok: false, error: limited.message };
  try {
    await signIn("customer", { email, code, shopId, redirect: false });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) return { ok: false, error: "That code isn't right, or has expired. Ask for a new one." };
    throw err;
  }
}
