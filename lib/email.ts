import { Resend } from "resend";
import { formatPKR } from "@/lib/utils";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Two senders, both on a domain that must be verified in the Resend account
// (or send() throws). Fall back to Resend's shared sender, which only delivers
// to the account owner — a smoke-test stopgap, not real delivery.
//
//   FROM           general mail to shoppers and merchants — order
//                  confirmations, staff invitations. `shop@synoradigitals.com`.
//   SECURITY_FROM  account-security mail — email verification, password reset,
//                  admin login codes. `account@synoradigitals.com`, kept
//                  separate so it can be filtered/prioritised and, later,
//                  carry a stricter DMARC policy than marketing-adjacent mail.
const FROM =
  process.env.RESEND_FROM ?? "Shop by Synora Digitals <onboarding@resend.dev>";
const SECURITY_FROM = process.env.RESEND_FROM_SECURITY ?? FROM;

type OrderEmailItem = { title: string; size: string; color: string; price: number; quantity: number };
type OrderEmailData = {
  id: string;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  /** The shop this order belongs to, so the email says whose store it is. */
  shopName: string;
  /**
   * Where *this shop's* "you have an order" notice goes.
   *
   * Per-order rather than from the environment: a single platform-wide address
   * meant every merchant's orders arrived in the platform's own inbox and the
   * merchant who made the sale was never told. Null simply sends no notice.
   */
  notifyEmail: string | null;
};

function itemsList(items: OrderEmailItem[]) {
  return items
    .map((i) => `${i.title} (${i.size}/${i.color}) x${i.quantity}, ${formatPKR(i.price * i.quantity)}`)
    .join("\n");
}

/** Best-effort — never throws, so a missing/misconfigured Resend key never blocks order placement. */
export async function sendOrderEmails(order: OrderEmailData) {
  if (!resend) {
    console.log(`[email] Resend not configured, skipping emails for order ${order.id}`);
    return;
  }

  const summary = `Order #${order.id}\n\n${itemsList(order.items)}\n\nSubtotal: ${formatPKR(order.subtotal)}\nShipping: ${formatPKR(order.shippingFee)}\nTotal: ${formatPKR(order.total)}\nPayment: ${order.paymentMethod}`;

  try {
    await resend.emails.send({
      from: FROM,
      to: order.customerEmail,
      subject: `Your ${order.shopName} order #${order.id} is confirmed`,
      text: `Hi ${order.customerName},\n\nThank you for your order from ${order.shopName}.\n\n${summary}\n\nWe'll be in touch once it ships.`,
    });

    if (order.notifyEmail) {
      await resend.emails.send({
        from: FROM,
        to: order.notifyEmail,
        subject: `New order #${order.id}, ${order.customerName}`,
        text: summary,
      });
    }
  } catch (err) {
    console.error("[email] Failed to send order emails", err);
  }
}

/**
 * Sends an admin login code.
 *
 * Unlike sendOrderEmails, this deliberately throws on failure: the login flow
 * depends on the code actually arriving, so the caller needs to know delivery
 * failed rather than leaving someone waiting for an email that will never come.
 */
export async function sendAdminOtpEmail(to: string, code: string) {
  if (!resend) {
    // Local dev with no Resend key — log the code so login still works.
    console.log(`[email] Resend not configured, admin login code for ${to}: ${code}`);
    return;
  }

  await resend.emails.send({
    from: SECURITY_FROM,
    to,
    subject: `Your Shop admin login code: ${code}`,
    text: `Your one-time verification code is ${code}.\n\nIt expires in ${
      process.env.ADMIN_OTP_TTL_MINUTES ?? 10
    } minutes and can only be used once.\n\nIf you didn't request this, ignore this email and consider changing your admin password.`,
  });
}

/**
 * The address links in these emails point back to — the *application* host
 * (sign-in / dashboard / `/merchant/*`), which is not the same as the marketing
 * host or any one shop's storefront.
 *
 * `NEXT_PUBLIC_SITE_URL` is deliberately NOT used here: on this platform that
 * variable is a storefront's own URL (it seeds `sitemap.xml` / Open Graph), so
 * a verification link built from it would land a new merchant on some shop's
 * shopfront instead of on their account.
 *
 * Order of preference: an explicit `PLATFORM_URL`, then the configured
 * `APP_HOST` (`app.synoradigitals.com` in production), then localhost for
 * development where neither is set.
 */
function platformUrl(): string {
  const explicit = process.env.PLATFORM_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.APP_HOST) return `https://${process.env.APP_HOST}`;
  return "http://localhost:3000";
}

/**
 * Confirms a merchant's email address.
 *
 * Throws on a delivery failure so the caller can log it. Callers deliberately
 * catch rather than propagate: the account already exists by the time this
 * runs, so a crash here would only strand the user with no way forward — a
 * "resend" path exists for once mail is working again.
 */
export async function sendVerificationEmail(to: string, token: string) {
  const link = `${platformUrl()}/merchant/verify?token=${encodeURIComponent(token)}`;

  if (!resend) {
    // Local development with no key: the link goes to the console so the flow
    // can still be walked end to end.
    console.log(`[email] Resend not configured, verification link for ${to}:\n${link}`);
    return;
  }

  await resend.emails.send({
    from: SECURITY_FROM,
    to,
    subject: "Confirm your email to finish setting up your store",
    text:
      `Welcome to Shop by Synora Digitals.\n\n` +
      `Confirm this address to finish setting up your store:\n${link}\n\n` +
      `The link works for 24 hours and can only be used once.\n\n` +
      `If you didn't sign up, you can ignore this, no store was created in your name.`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `${platformUrl()}/merchant/reset?token=${encodeURIComponent(token)}`;

  if (!resend) {
    console.log(`[email] Resend not configured, password reset link for ${to}:\n${link}`);
    return;
  }

  await resend.emails.send({
    from: SECURITY_FROM,
    to,
    subject: "Reset your Shop password",
    text:
      `Someone asked to reset the password for this address.\n\n${link}\n\n` +
      `The link works for one hour and can only be used once. Using it signs you ` +
      `out everywhere else.\n\n` +
      `If it wasn't you, ignore this, your password has not changed.`,
  });
}

/** Invites someone to join a shop's staff. */
export async function sendStaffInviteEmail(
  to: string,
  token: string,
  shopName: string,
  invitedBy: string
) {
  const link = `${platformUrl()}/merchant/invite?token=${encodeURIComponent(token)}`;

  if (!resend) {
    console.log(`[email] Resend not configured, staff invite for ${to} to ${shopName}:\n${link}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${invitedBy} invited you to help run ${shopName}`,
    text:
      `${invitedBy} has invited you to work on ${shopName} on Shop by Synora Digitals.\n\n${link}\n\n` +
      `The invitation is good for 7 days.\n\n` +
      `If you weren't expecting this, ignore it, nothing happens until you accept.`,
  });
}
