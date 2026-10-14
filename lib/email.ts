import { Resend } from "resend";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";

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
  process.env.RESEND_FROM ?? "APP by Synora Digitals <onboarding@resend.dev>";
const SECURITY_FROM = process.env.RESEND_FROM_SECURITY ?? FROM;

/**
 * Sends one email, and throws if Resend refuses it.
 *
 * The Resend library does not throw on a refused send (an unverified sender,
 * a bad key, a blocked address): it returns `{ error }` and carries on. Every
 * sender here used to `await deliver(...)` and ignore that, so each
 * "throws on failure" below was untrue and a refused email looked exactly like
 * a delivered one — no log, no message, nothing. Found 14 October. Everything
 * now goes through here, so a refusal is a thrown error the caller logs (and,
 * where a person is waiting for the email, tells them about).
 *
 * The recipient is left out of the error on purpose: it ends up in the logs.
 */
async function deliver(mail: Parameters<Resend["emails"]["send"]>[0]) {
  if (!resend) return;
  const { error } = await resend.emails.send(mail);
  if (error) throw new Error(`[email] Resend refused "${mail.subject}": ${error.name}: ${error.message}`);
}

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
  /**
   * The order's page, with its secret key (lib/order-access.ts) — the
   * customer's way back to it. Only in the customer's email: the merchant's
   * notice goes to their own panel, which needs no key.
   */
  orderUrl?: string;
};

function itemsList(items: OrderEmailItem[], currency: string) {
  return items
    .map(
      (i) =>
        `${i.title} (${i.size}/${i.color}) x${i.quantity}, ${formatMoney(i.price * i.quantity, currency)}`
    )
    .join("\n");
}

/** Best-effort — never throws, so a missing/misconfigured Resend key never blocks order placement. */
export async function sendOrderEmails(order: OrderEmailData) {
  if (!resend) {
    console.log(`[email] Resend not configured, skipping emails for order ${order.id}`);
    return;
  }

  // The shop's own currency. An order confirmation quoting rupees to somebody
  // who paid in dollars is the version of this bug a customer sees.
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);

  const summary = `Order #${order.id}\n\n${itemsList(order.items, currency)}\n\nSubtotal: ${money(order.subtotal)}\nShipping: ${money(order.shippingFee)}\nTotal: ${money(order.total)}\nPayment: ${order.paymentMethod}`;

  // Each in its own try, so a refused confirmation to the customer does not
  // also cost the merchant their notice of the sale.
  try {
    await deliver({
      from: FROM,
      to: order.customerEmail,
      subject: `Your ${order.shopName} order #${order.id} is confirmed`,
      text: `Hi ${order.customerName},\n\nThank you for your order from ${order.shopName}.\n\n${summary}\n\n${order.orderUrl ? `See your order at any time: ${order.orderUrl}\n\n` : ""}We'll be in touch once it ships.`,
    });
  } catch (err) {
    console.error("[email] Failed to send the order confirmation", err);
  }

  try {
    if (order.notifyEmail) {
      await deliver({
        from: FROM,
        to: order.notifyEmail,
        subject: `New order #${order.id}, ${order.customerName}`,
        text: summary,
      });
    }
  } catch (err) {
    console.error("[email] Failed to send the new-order notice", err);
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

  await deliver({
    from: SECURITY_FROM,
    to,
    subject: `Your Shop admin login code: ${code}`,
    text: `Your one-time verification code is ${code}.\n\nIt expires in ${
      process.env.ADMIN_OTP_TTL_MINUTES ?? 10
    } minutes and can only be used once.\n\nIf you didn't request this, ignore this email and consider changing your admin password.`,
  });
}

/**
 * A customer's sign-in code, from the shop they are signing in to.
 *
 * Throws on failure, like the admin code: the customer is waiting for it.
 * Says the shop's name, not Synora's — the customer is the shop's, and may
 * never have heard of us.
 */
export async function sendCustomerCodeEmail(to: string, code: string, shopName: string, minutes: number) {
  if (!resend) {
    // Local dev with no Resend key — log the code so sign-in still works.
    console.log(`[email] Resend not configured, ${shopName} sign-in code for ${to}: ${code}`);
    return;
  }
  await deliver({
    from: SECURITY_FROM,
    to,
    subject: `${code} is your ${shopName} sign-in code`,
    text: `Your code to sign in to ${shopName} is ${code}.\n\nIt expires in ${minutes} minutes and works once.\n\nIf you didn't ask for it, you can ignore this email — nobody can sign in without the code.`,
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

  await deliver({
    from: SECURITY_FROM,
    to,
    subject: "Confirm your email to finish setting up your store",
    text:
      `Welcome to APP by Synora Digitals.\n\n` +
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

  await deliver({
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

  await deliver({
    from: FROM,
    to,
    subject: `${invitedBy} invited you to help run ${shopName}`,
    text:
      `${invitedBy} has invited you to work on ${shopName} on APP by Synora Digitals.\n\n${link}\n\n` +
      `The invitation is good for 7 days.\n\n` +
      `If you weren't expecting this, ignore it, nothing happens until you accept.`,
  });
}

// ---------------------------------------------------------------- help desk
//
// /help and the Synora console (14 October). Every one throws through
// deliver() on a refused send; the callers decide what the person is told.

type HelpMailRef = { number: number; kind: "TICKET" | "SUGGESTION"; subject: string };
const helpNoun = (k: HelpMailRef["kind"]) => (k === "TICKET" ? "ticket" : "suggestion");

/** "We have it": to the person who sent it. */
export async function sendHelpReceivedEmail(to: string, r: HelpMailRef) {
  const link = `${platformUrl()}/help/${r.number}`;
  if (!resend) {
    console.log(`[email] Resend not configured, help received #${r.number} for ${to}:\n${link}`);
    return;
  }
  await deliver({
    from: FROM,
    to,
    subject: `We have your ${helpNoun(r.kind)} #${r.number}: ${r.subject}`,
    text:
      `Thanks, your ${helpNoun(r.kind)} reached the Synora team.\n\n` +
      `#${r.number}: ${r.subject}\n\nFollow it, or add to it, here:\n${link}\n\n` +
      `You can turn update emails off on that page.`,
  });
}

/**
 * A reply or a status change, to the sender. Only sent when they left
 * "email me about this" on; the caller checks.
 */
export async function sendHelpUpdateEmail(
  to: string,
  r: HelpMailRef & { status?: string; reply?: string; from?: string }
) {
  const link = `${platformUrl()}/help/${r.number}`;
  if (!resend) {
    console.log(`[email] Resend not configured, help update #${r.number} for ${to} (${r.status ?? "reply"}):\n${link}`);
    return;
  }
  const lines = [
    r.status ? `Your ${helpNoun(r.kind)} is now: ${r.status}.` : "",
    r.reply ? `${r.from ?? "The Synora team"} wrote:\n\n${r.reply}` : "",
  ].filter(Boolean);
  await deliver({
    from: FROM,
    to,
    subject: `Re: #${r.number} ${r.subject}`,
    text:
      `${lines.join("\n\n")}\n\nSee the whole conversation, or reply:\n${link}\n\n` +
      `You get these because you asked to be told about #${r.number}. Turn them off on that page.`,
  });
}

/** A new request or reply, to the Synora team. */
export async function sendHelpTeamAlertEmail(
  to: string[],
  r: HelpMailRef & { fromName: string; fromEmail: string; body: string; isReply?: boolean }
) {
  if (to.length === 0) return;
  const link = `${platformUrl()}/synora/requests/${r.number}`;
  if (!resend) {
    console.log(`[email] Resend not configured, team alert #${r.number}:\n${link}`);
    return;
  }
  await deliver({
    from: FROM,
    to,
    replyTo: r.fromEmail,
    subject: `${r.isReply ? "Reply on" : `New ${helpNoun(r.kind)}`} #${r.number}: ${r.subject}`,
    text: `${r.fromName} <${r.fromEmail}>\n\n${r.body}\n\nOpen it in the console:\n${link}`,
  });
}
