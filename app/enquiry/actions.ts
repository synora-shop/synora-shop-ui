"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { clientIp, rateLimit } from "@/lib/rate-limit";
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
  // The one unauthenticated write in the app. Without this it can be looped to
  // fill a merchant's inbox and the platform's database, for free — which
  // makes it an abuse vector against us as much as against them.
  const ip = await clientIp();
  const limited = await rateLimit("enquiry", `${await currentShopId()}:${ip}`);
  if (!limited.ok) return { ok: false, error: limited.message };

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

  await (await db()).enquiry.update({
    where: { id },
    data: { status: status as (typeof STATUSES)[number] },
  });
  revalidatePath("/admin/enquiries");
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
