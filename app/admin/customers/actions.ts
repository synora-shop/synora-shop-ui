"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db } from "@/lib/data/shop";
import { isValidEmail, isValidPakistaniPhone } from "@/lib/validation";

/**
 * Customers, the parts a merchant changes (new admin, 15 October): adding a
 * person by hand (someone who ordered on WhatsApp, say), and the team's note,
 * tags and the customer's yes to offers on their page.
 */
type Result = { ok: true; id?: string } | { ok: false; error: string };

export async function createCustomer(input: { name: string; email: string; phone: string }): Promise<Result> {
  await requireRole("STAFF");
  const name = input.name.trim().slice(0, 120);
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  if (!name) return { ok: false, error: "Their name." };
  if (!isValidEmail(email)) return { ok: false, error: "An email address that works, so they can sign in and get their order emails." };
  if (phone && !isValidPakistaniPhone(phone)) return { ok: false, error: "A Pakistani mobile number, like 0300 1234567, or leave it empty." };

  const scoped = await db();
  const exists = await scoped.customer.findFirst({ where: { email }, select: { id: true } });
  if (exists) return { ok: false, error: "Someone with that email is already a customer." };
  const created = await scoped.customer.create({ data: { shopId: await currentShopId(), name, email, phone: phone || null }, select: { id: true } });
  revalidatePath("/admin/customers");
  return { ok: true, id: created.id };
}

export async function saveCustomerNote(id: string, note: string): Promise<Result> {
  await requireRole("STAFF");
  await (await db()).customer.update({ where: { id }, data: { note: note.slice(0, 4000) } });
  revalidatePath(`/admin/customers/${id}`);
  return { ok: true };
}

export async function setCustomerTags(id: string, tags: string[]): Promise<Result> {
  await requireRole("STAFF");
  const clean = [...new Set(tags.map((t) => t.trim().slice(0, 30)).filter(Boolean))].slice(0, 20);
  await (await db()).customer.update({ where: { id }, data: { tags: clean } });
  revalidatePath(`/admin/customers/${id}`);
  return { ok: true };
}

export async function setCustomerMarketing(id: string, on: boolean): Promise<Result> {
  await requireRole("STAFF");
  await (await db()).customer.update({ where: { id }, data: { acceptsMarketing: !!on } });
  revalidatePath(`/admin/customers/${id}`);
  return { ok: true };
}
