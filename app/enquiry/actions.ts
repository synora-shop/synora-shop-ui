"use server";

import { revalidatePath } from "next/cache";
import { sendEnquiryQuoteEmail } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { whatsappNumber } from "@/lib/abandoned";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db, requireShop, shopNotificationEmail } from "@/lib/data/shop";
import { isDemoShop } from "@/lib/theme-store";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { looksAutomated } from "@/lib/spam";
import { getStoreSettings } from "@/lib/data/settings";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidEmail, isValidPakistaniPhone } from "@/lib/validation";
import { storefrontClosure } from "@/lib/maintenance";
import {
  isEnquiryOnly,
  parseCustomFields,
  type CustomField,
} from "@/lib/product-kind";

export type EnquiryInput = {
  productId: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  quantity?: number | null;
  message: string;
  /** Answers to a made-to-order product's custom fields, keyed by field id. */
  details?: Record<string, string>;
  /** The honeypot — see lib/spam.ts. A person always leaves this empty. */
  website?: string;
};

export type EnquiryResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Records a customer's enquiry about a bulk or made-to-order product.
 *
 * Public — no session required, because the whole point is that someone who
 * has never bought from you can ask a question. That makes it the one
 * unauthenticated write in the app, so everything it stores is validated here
 * rather than trusted from the form: the product is re-read to confirm it is
 * really enquiry-only, and the custom answers are filtered against the fields
 * the product actually declares, so a tampered form can't stuff arbitrary keys
 * into the stored JSON.
 */
export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryResult> {
  // A theme demo shows the enquiry form because the form is part of the design
  // a visitor is judging. It must not actually send one: an enquiry is the
  // other thing this app emails about, and the demo has no merchant to email.
  if (isDemoShop((await requireShop()).subdomain)) {
    return { ok: false, error: "This is a demo store, so nobody is on the other end of this form." };
  }

  // The one unauthenticated write in the app. Without this it can be looped to
  // fill a merchant's inbox and the platform's database, for free — which
  // makes it an abuse vector against us as much as against them.
  const ip = await clientIp();
  const limited = await rateLimit("enquiry", `${await currentShopId()}:${ip}`);
  if (!limited.ok) return { ok: false, error: limited.message };

  // Answered as a success and stored nowhere. The bot is told what it expects
  // to hear, so nobody learns which field gave them away. Off is a real choice
  // a merchant can make on Preferences — it is the only way to diagnose a
  // genuine enquiry that never arrived.
  const settings = await getStoreSettings();
  if (settings.spamProtection && looksAutomated(input.website)) {
    return { ok: true, id: "" };
  }

  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = input.phone?.trim() ?? "";
  const message = input.message?.trim() ?? "";

  if (name.length < 2) return { ok: false, error: "Please tell us your name." };
  if (!isValidEmail(email)) return { ok: false, error: "That email address doesn't look right." };
  if (!isValidPakistaniPhone(phone)) {
    return { ok: false, error: "Please enter a valid phone number so we can reach you." };
  }
  if (message.length < 10) {
    return { ok: false, error: "Please add a little detail about what you're looking for." };
  }
  if (message.length > 4000) {
    return { ok: false, error: "That message is too long, please keep it under 4000 characters." };
  }

  // Same reasoning as the checkout endpoint: a shut store should not be
  // collecting enquiries it is not there to answer.
  if (await storefrontClosure()) {
    return { ok: false, error: "This store isn't taking enquiries at the moment." };
  }

  const product = await (await db()).product.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      title: true,
      kind: true,
      isActive: true,
      status: true,
      deletedAt: true,
      minOrderQuantity: true,
      customFields: true,
    },
  });

  if (!product || product.deletedAt || !product.isActive || product.status !== "PUBLISHED") {
    return { ok: false, error: "That product isn't available any more." };
  }
  if (!isEnquiryOnly(product.kind)) {
    // A standard product has a published price and an add-to-cart. Accepting an
    // enquiry for it would put a message in an inbox nobody is watching for it.
    return { ok: false, error: "That product can be ordered directly, no enquiry needed." };
  }

  let quantity: number | null = null;
  if (input.quantity != null && input.quantity !== undefined) {
    const q = Number(input.quantity);
    if (!Number.isFinite(q) || q < 1) {
      return { ok: false, error: "Please enter how many units you need." };
    }
    quantity = Math.round(q);
    if (product.minOrderQuantity && quantity < product.minOrderQuantity) {
      return {
        ok: false,
        error: `The minimum order for this product is ${product.minOrderQuantity} units.`,
      };
    }
  }

  // Only keys the product declares are stored, and each is capped — the form is
  // public, so its shape is a suggestion, not a guarantee.
  const declared: CustomField[] = parseCustomFields(product.customFields);
  const details: Record<string, string> = {};
  for (const field of declared) {
    const value = input.details?.[field.id]?.trim() ?? "";
    if (field.required && !value) {
      return { ok: false, error: `Please fill in "${field.label}".` };
    }
    if (value) details[field.id] = value.slice(0, 500);
  }

  const enquiry = await (await db()).enquiry.create({
    data: {
      shopId: await currentShopId(),
      productId: product.id,
      productTitle: product.title,
      name: name.slice(0, 120),
      email: email.slice(0, 200),
      phone: phone.slice(0, 40),
      company: input.company?.trim().slice(0, 160) || null,
      quantity,
      message,
      details: declared.length > 0 ? details : undefined,
    },
    select: { id: true },
  });

  revalidatePath("/admin/enquiries");
  return { ok: true, id: enquiry.id };
}

const STATUSES = ["NEW", "IN_PROGRESS", "QUOTED", "WON", "LOST"] as const;

export async function updateEnquiryStatus(id: string, status: string) {
  await requireRole("STAFF");
  if (!(STATUSES as readonly string[]).includes(status)) throw new Error("Unknown status");

  const scoped = await db();
  // The first time an enquiry leaves New is when it was answered, which is
  // what "Usually answered in" measures (new admin, 15 October).
  const was = await scoped.enquiry.findFirst({ where: { id }, select: { answeredAt: true } });
  await scoped.enquiry.update({
    where: { id },
    data: {
      status: status as (typeof STATUSES)[number],
      ...(status !== "NEW" && was && !was.answeredAt ? { answeredAt: new Date() } : {}),
    },
  });
  revalidatePath("/admin/enquiries");
}

/**
 * Quote a price for an enquiry (new admin, 15 October): so much a piece. The
 * enquiry is marked Quoted and answered, and the customer is emailed the
 * quote from the shop, with the shop's address to reply to. With no email to
 * send it to, the merchant gets a WhatsApp message written out instead.
 */
export async function sendEnquiryQuote(
  id: string,
  pricePerPiece: number
): Promise<{ ok: true; sent: "email" | "whatsapp"; whatsappUrl?: string } | { ok: false; error: string }> {
  await requireRole("STAFF");
  const price = Math.round(Number(pricePerPiece));
  if (!Number.isFinite(price) || price <= 0 || price > 100_000_000) return { ok: false, error: "Enter the price for one piece." };

  const scoped = await db();
  const enquiry = await scoped.enquiry.findFirst({ where: { id } });
  if (!enquiry) return { ok: false, error: "That enquiry is no longer there." };

  const settings = await getStoreSettings();
  const shopName = settings.storeName || "our store";
  const currency = resolveStoreDefaults(settings).currency;
  const total = enquiry.quantity ? formatMoney(price * enquiry.quantity, currency) : null;

  await scoped.enquiry.update({
    where: { id },
    data: { quotedPrice: price, quotedAt: new Date(), status: "QUOTED", answeredAt: enquiry.answeredAt ?? new Date() },
  });
  revalidatePath("/admin/enquiries");

  if (enquiry.email && isValidEmail(enquiry.email)) {
    try {
      await sendEnquiryQuoteEmail(enquiry.email, {
        shopName,
        name: enquiry.name,
        product: enquiry.productTitle,
        quantity: enquiry.quantity,
        pricePerPiece: formatMoney(price, currency),
        total,
        replyTo: (await shopNotificationEmail(enquiry.shopId)) ?? undefined,
      });
      return { ok: true, sent: "email" };
    } catch (error) {
      console.error("[enquiry] quote email failed", error);
      return { ok: false, error: "The quote is saved, but the email could not be sent. Reply from your own email instead." };
    }
  }
  const number = whatsappNumber(enquiry.phone);
  if (!number) return { ok: true, sent: "email" };
  const text = `Assalam o Alaikum ${enquiry.name.split(" ")[0]}, this is ${shopName}. For ${enquiry.productTitle} our price is ${formatMoney(price, currency)} a piece${enquiry.quantity && total ? `, so ${enquiry.quantity} pieces come to ${total}` : ""}.`;
  return { ok: true, sent: "whatsapp", whatsappUrl: `https://wa.me/${number}?text=${encodeURIComponent(text)}` };
}

export async function saveEnquiryNotes(id: string, notes: string) {
  await requireRole("STAFF");
  await (await db()).enquiry.update({ where: { id }, data: { notes: notes.slice(0, 4000) } });
  revalidatePath("/admin/enquiries");
}

export async function deleteEnquiry(id: string) {
  await requireRole("STAFF");
  await (await db()).enquiry.delete({ where: { id } });
  revalidatePath("/admin/enquiries");
}
