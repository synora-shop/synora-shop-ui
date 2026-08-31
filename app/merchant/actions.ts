"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { isValidEmail } from "@/lib/validation";
import { clientIp, clearRateLimit, rateLimit } from "@/lib/rate-limit";
import { createToken, expiryFor, hashToken } from "@/lib/tokens";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { PLATFORM_DOMAIN, subdomainProblem, suggestSubdomain } from "@/lib/shop-context";
import { auth } from "@/auth";

// Merchant accounts: sign up, verify, reset, change password.
//
// A recurring rule here: none of these say whether an address is registered.
// "No account with that email" is a free membership check for anyone who wants
// to know which of a leaked address list uses your platform, so signup,
// reset and resend all answer the same way whatever the truth is.

export type Result = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Why a signup was refused, when the form can offer a way out of it.
 *
 * A plain message is not enough for these two: the person is stuck on the
 * signup page and what they actually need is a link to sign in, confirm, or
 * reset — so the form needs to know which case it is rather than parse prose.
 */
export type SignupRefusal = "email_taken" | "email_pending";

export type SignupResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; code?: SignupRefusal };

/** The shortest password worth calling one. */
const MIN_PASSWORD = 10;

function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD) {
    return `Use at least ${MIN_PASSWORD} characters. Length matters more than symbols.`;
  }
  if (password.length > 200) return "That password is too long.";
  // Deliberately no character-class rules. They push people towards
  // "Password1!" and away from the long passphrases that are actually strong.
  return null;
}

// ---------------------------------------------------------------- sign up

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  storeName: string;
};

/**
 * A store web address derived from `base` that no shop is using yet.
 *
 * `base`, then `base-2`, `base-3`, …, then a random suffix as a backstop.
 * Reserved and malformed candidates are skipped. There is a small race — two
 * signups could both see one address as free — which the unique index on
 * Shop.subdomain catches, failing that transaction; rare enough to leave to a
 * retry.
 */
async function uniqueSubdomain(base: string): Promise<string> {
  const root = base.slice(0, 32).replace(/-+$/, "") || "store";
  const candidates = [
    root,
    ...Array.from({ length: 50 }, (_, i) => `${root}-${i + 2}`),
  ];
  for (const c of candidates) {
    if (subdomainProblem(c)) continue;
    const clash = await prisma.shop.findUnique({ where: { subdomain: c }, select: { id: true } });
    if (!clash) return c;
  }
  for (let i = 0; i < 10; i++) {
    const c = `${root}-${Math.random().toString(36).slice(2, 8)}`;
    if (subdomainProblem(c)) continue;
    const clash = await prisma.shop.findUnique({ where: { subdomain: c }, select: { id: true } });
    if (!clash) return c;
  }
  throw new Error("Could not allocate a store address.");
}

/**
 * Creates a merchant, their first shop, and the membership that ties them.
 *
 * The only thing that can stop a signup is the *email* already having an
 * account — never the store name or its web address. The address is derived and
 * made unique automatically (see uniqueSubdomain), and both the name and the
 * address are editable later in Settings. This mirrors Shopify: you pick a store
 * name, it hands you a `*.myshopify.com` you never had to choose.
 *
 * The user + shop + membership + domain + token go in one transaction: a user
 * with no shop can do nothing and a shop with no owner cannot be administered,
 * so half of this succeeding is worse than none of it.
 */
export async function signUp(input: SignupInput): Promise<SignupResult> {
  const ip = await clientIp();
  const limited = await rateLimit("signup", ip);
  if (!limited.ok) return { ok: false, error: limited.message };

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const storeName = input.storeName?.trim() ?? "";

  if (name.length < 2) return { ok: false, error: "Please tell us your name." };
  if (!isValidEmail(email)) return { ok: false, error: "That email address doesn't look right." };
  if (storeName.length < 2) return { ok: false, error: "Give your store a name." };

  const pw = passwordProblem(input.password ?? "");
  if (pw) return { ok: false, error: pw };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // An account already exists for this address, and we say so.
    //
    // The previous version returned the same "check your email" as a success,
    // to avoid confirming that an address is registered. That protection is not
    // worth what it costs here: the person is holding a password they just
    // chose, was told to check an inbox, and then cannot sign in — because a
    // signup deliberately never overwrites an existing account's password, and
    // must not, or "signing up" over someone's address would take it from them.
    // Shopify says the address is taken for the same reason. Password reset
    // stays neutral, which is the flow where enumeration actually matters.
    //
    // Never verified means the earlier attempt was abandoned, so the link is
    // reissued — but the password on file is still the one from that attempt,
    // which is exactly why the message offers a reset too.
    if (!existing.emailVerifiedAt) {
      await prisma.verificationToken.updateMany({
        where: { userId: existing.id, purpose: "EMAIL_VERIFICATION", consumedAt: null },
        data: { consumedAt: new Date() },
      });
      const { token, tokenHash } = createToken();
      await prisma.verificationToken.create({
        data: {
          tokenHash,
          purpose: "EMAIL_VERIFICATION",
          userId: existing.id,
          email,
          expiresAt: expiryFor("EMAIL_VERIFICATION"),
        },
      });
      try {
        await sendVerificationEmail(email, token);
      } catch (err) {
        console.error("[signup] verification email (resend) failed to send", err);
      }
      return {
        ok: false,
        code: "email_pending",
        error:
          "You already started signing up with this address. We've sent a fresh confirmation link, open it, then sign in with the password you chose the first time.",
      };
    }

    return {
      ok: false,
      code: "email_taken",
      error: "An account already exists for this email address.",
    };
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const { token, tokenHash } = createToken();

  // Name first, then the email's local part, then a generic base — whichever
  // yields something usable. uniqueSubdomain guarantees it is free.
  const base =
    suggestSubdomain(storeName) || suggestSubdomain(email.split("@")[0]) || "store";
  const subdomain = await uniqueSubdomain(base);

  const { user, shop } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { name, email, passwordHash } });
    const shop = await tx.shop.create({
      data: { name: storeName, subdomain, status: "TRIAL" },
    });
    await tx.membership.create({
      data: { userId: user.id, shopId: shop.id, role: "OWNER", acceptedAt: new Date() },
    });
    // The free address, as an ordinary Domain row. Host resolution and the
    // canonical URL then have one path, instead of a special case for every
    // shop that has not added a domain of its own.
    await tx.domain.create({
      data: {
        shopId: shop.id,
        hostname: `${subdomain}.${PLATFORM_DOMAIN}`,
        status: "ACTIVE",
        isPlatform: true,
        isPrimary: true,
        verificationToken: "",
        verifiedAt: new Date(),
        activatedAt: new Date(),
      },
    });
    await tx.verificationToken.create({
      data: {
        tokenHash,
        purpose: "EMAIL_VERIFICATION",
        userId: user.id,
        email,
        expiresAt: expiryFor("EMAIL_VERIFICATION"),
      },
    });
    return { user, shop };
  });

  await audit({
    shopId: shop.id,
    action: "shop.create",
    userId: user.id,
    actorEmail: email,
    entity: "Shop",
    entityId: shop.id,
    detail: { name: storeName, subdomain },
  });

  // The account and shop are already committed. If delivery fails, don't throw
  // out of the action — that shows the user a crash while leaving them with an
  // unverified account whose retry just says "an account already exists" and
  // never sends. Log it; the user can use "resend" once mail is working.
  try {
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error("[signup] verification email failed to send", err);
  }
  return { ok: true, message: "Check your email to finish setting up your store." };
}

// ---------------------------------------------------------------- verify

export async function verifyEmail(token: string): Promise<Result> {
  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.purpose !== "EMAIL_VERIFICATION") {
    return { ok: false, error: "That link isn't valid. Request a new one." };
  }
  if (record.consumedAt) {
    return { ok: false, error: "That link has already been used." };
  }
  if (record.expiresAt < new Date()) {
    return { ok: false, error: "That link has expired. Request a new one." };
  }

  await prisma.$transaction([
    // Consumed first: if anything below fails, the link is still spent, which
    // is the safe direction to fail in.
    prisma.verificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  const membership = await prisma.membership.findFirst({
    where: { userId: record.userId },
    select: { shopId: true },
  });
  if (membership) {
    await audit({
      shopId: membership.shopId,
      action: "account.email.verify",
      userId: record.userId,
      actorEmail: record.email,
    });
  }

  return { ok: true, message: "Email confirmed. You can sign in now." };
}

export async function resendVerification(email: string): Promise<Result> {
  const ip = await clientIp();
  const limited = await rateLimit("passwordReset", `${ip}:${email}`);
  if (!limited.ok) return { ok: false, error: limited.message };

  const address = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: address } });

  // Only really sends when there is something to send to, but always says the
  // same thing.
  if (user && !user.emailVerifiedAt) {
    const { token, tokenHash } = createToken();
    await prisma.verificationToken.create({
      data: {
        tokenHash,
        purpose: "EMAIL_VERIFICATION",
        userId: user.id,
        email: address,
        expiresAt: expiryFor("EMAIL_VERIFICATION"),
      },
    });
    try {
      await sendVerificationEmail(address, token);
    } catch (err) {
      console.error("[resend-verification] email failed to send", err);
    }
  }

  return { ok: true, message: "If that address needs confirming, a new link is on its way." };
}

// ---------------------------------------------------------------- reset

export async function requestPasswordReset(email: string): Promise<Result> {
  const ip = await clientIp();
  const address = email.trim().toLowerCase();

  // Limited per address as well as per IP: without the address in the key,
  // one attacker gets a handful of attempts total; with it, they cannot target
  // one person repeatedly from a rotating pool of addresses either.
  const limited = await rateLimit("passwordReset", `${ip}:${address}`);
  if (!limited.ok) return { ok: false, error: limited.message };

  const user = await prisma.user.findUnique({ where: { email: address } });
  if (user) {
    // Any outstanding reset is invalidated first, so a link sitting in an old
    // email stops working the moment a new one is asked for.
    await prisma.verificationToken.updateMany({
      where: { userId: user.id, purpose: "PASSWORD_RESET", consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const { token, tokenHash } = createToken();
    await prisma.verificationToken.create({
      data: {
        tokenHash,
        purpose: "PASSWORD_RESET",
        userId: user.id,
        email: address,
        expiresAt: expiryFor("PASSWORD_RESET"),
      },
    });
    try {
      await sendPasswordResetEmail(address, token);
    } catch (err) {
      console.error("[password-reset] email failed to send", err);
    }
  }

  return {
    ok: true,
    message: "If there's an account for that address, we've sent a reset link.",
  };
}

export async function resetPassword(token: string, password: string): Promise<Result> {
  const pw = passwordProblem(password ?? "");
  if (pw) return { ok: false, error: pw };

  const record = await prisma.verificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.purpose !== "PASSWORD_RESET") {
    return { ok: false, error: "That link isn't valid. Request a new one." };
  }
  if (record.consumedAt) return { ok: false, error: "That link has already been used." };
  if (record.expiresAt < new Date()) {
    return { ok: false, error: "That link has expired. Request a new one." };
  }

  const owner = await prisma.user.findUnique({ where: { id: record.userId } });
  if (!owner) return { ok: false, error: "That link isn't valid. Request a new one." };

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  // Completing a reset proves control of the address the link was sent to, so
  // it confirms that address too. Only if it is still the account's address:
  // a link sent to an old email must not verify a new one the user has since
  // switched to but never confirmed.
  const provesCurrentEmail = owner.email === record.email;

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { consumedAt: now } }),
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        // Every existing session dies. Resetting a password is what someone
        // does when they think an account is compromised, and leaving the
        // intruder signed in would make the act pointless.
        sessionsValidFrom: now,
        ...(provesCurrentEmail && !owner.emailVerifiedAt ? { emailVerifiedAt: now } : {}),
      },
    }),
  ]);

  // A successful reset clears the throttle, so someone who just recovered
  // their account is not then locked out of signing in.
  await clearRateLimit("login", record.email);

  const membership = await prisma.membership.findFirst({
    where: { userId: record.userId },
    select: { shopId: true },
  });
  if (membership) {
    await audit({
      shopId: membership.shopId,
      action: "account.password.reset",
      userId: record.userId,
      actorEmail: record.email,
    });
  }

  return { ok: true, message: "Password changed. Sign in with your new one." };
}

// ---------------------------------------------------------------- change

export async function changePassword(current: string, next: string): Promise<Result> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sign in first." };

  const pw = passwordProblem(next ?? "");
  if (pw) return { ok: false, error: pw };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Sign in first." };

  // The current password is required even though the session proves identity:
  // it is what stops someone who walks up to an unlocked laptop from taking
  // the account permanently.
  const valid = await bcrypt.compare(current ?? "", user.passwordHash);
  if (!valid) return { ok: false, error: "That's not your current password." };

  if (await bcrypt.compare(next, user.passwordHash)) {
    return { ok: false, error: "That's the same password you already have." };
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(next, 12), sessionsValidFrom: now },
  });

  const membership = await prisma.membership.findFirst({
    where: { userId },
    select: { shopId: true },
  });
  if (membership) {
    await audit({
      shopId: membership.shopId,
      action: "account.password.change",
      userId,
      actorEmail: user.email,
    });
  }

  return {
    ok: true,
    message: "Password changed. You've been signed out everywhere else.",
  };
}

/** Ends every session, including this one. For "I think someone has my password". */
export async function revokeAllSessions(): Promise<Result> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sign in first." };

  const now = new Date();
  await prisma.user.update({ where: { id: userId }, data: { sessionsValidFrom: now } });

  const membership = await prisma.membership.findFirst({
    where: { userId },
    select: { shopId: true },
  });
  if (membership) {
    await audit({
      shopId: membership.shopId,
      action: "account.sessions.revoke",
      userId,
      actorEmail: session?.user?.email ?? null,
    });
  }

  return { ok: true, message: "Signed out on every device." };
}
