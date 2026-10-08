"use server";

import { db } from "@/lib/data/shop";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { contactMatches, orderLink } from "@/lib/order-access";
import { storeBase } from "@/lib/theme-store";

/**
 * Find an order by its number and the email or phone it was placed with —
 * Shopify's order lookup. A match returns the order's link, with its key;
 * anything else returns the same refusal, so a wrong number and a wrong email
 * cannot be told apart. Limited per address (rate-limit "orderLookup").
 */
export async function lookUpOrder(orderId: string, contact: string): Promise<{ ok: true; href: string } | { ok: false; error: string }> {
  const limited = await rateLimit("orderLookup", await clientIp());
  if (!limited.ok) return { ok: false, error: limited.message };
  const refusal = { ok: false as const, error: "No order matches that number and email or phone." };
  if (typeof orderId !== "string" || typeof contact !== "string" || orderId.length > 32 || contact.length > 200) return refusal;

  const order = await (await db()).order.findFirst({
    where: { id: orderId.trim().replace(/^#/, "").toLowerCase(), deletedAt: null },
    select: { id: true, accessKey: true, customerEmail: true, customerPhone: true },
  });
  if (!order || !contactMatches(contact, order)) return refusal;
  return { ok: true, href: orderLink(await storeBase(), order.id, order.accessKey) };
}
