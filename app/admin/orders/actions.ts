"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/data/shop";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canonicalUrl, currentShopId, shopNotificationEmail } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { sendOrderShippedEmail } from "@/lib/email";
import { orderLink } from "@/lib/order-access";
import { statusLabel } from "@/lib/order-status-style";

async function requireAdmin() {
  return requireRole("STAFF");
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const PAYMENT_STATUSES = ["PENDING", "AWAITING_VERIFICATION", "CONFIRMED", "FAILED"] as const;
type Stage = (typeof ORDER_STATUSES)[number];

/**
 * One line on an order's timeline (new admin, 15 October). Best effort: a
 * change the merchant made must not fail because writing its history did.
 */
async function logEvent(orderId: string, kind: string, text: string, by: string) {
  try {
    const scoped = await db();
    await scoped.orderEvent.create({ data: { shopId: await currentShopId(), orderId, kind, text: text.slice(0, 1000), by } });
  } catch (error) {
    console.error("[orders] writing the timeline failed", error);
  }
}

const words = (s: string) => statusLabel(s).toLowerCase();

export async function updateOrderStatus(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const orderStatus = String(formData.get("orderStatus"));
  if (!ORDER_STATUSES.includes(orderStatus as never)) return;

  const scoped = await db();
  const order = await scoped.order.findFirst({ where: { id } });
  if (!order) return;

  // Handed to a courier: who, and its tracking number, when the form sends
  // them (the order page's Mark shipped). Kept as given, trimmed and capped.
  const courier = formData.has("courier") ? String(formData.get("courier") ?? "").trim().slice(0, 60) : undefined;
  const trackingNumber = formData.has("trackingNumber") ? String(formData.get("trackingNumber") ?? "").trim().slice(0, 80) : undefined;

  if (order.orderStatus !== orderStatus || courier !== undefined || trackingNumber !== undefined) {
    await scoped.order.update({
      where: { id },
      data: {
        orderStatus: orderStatus as Stage,
        ...(courier !== undefined ? { courier: courier || null } : {}),
        ...(trackingNumber !== undefined ? { trackingNumber: trackingNumber || null } : {}),
      },
    });
  }
  if (order.orderStatus !== orderStatus) {
    await logEvent(id, "stage", `Moved from ${words(order.orderStatus)} to ${words(orderStatus)}.`, me.email);
  }
  if ((courier && courier !== order.courier) || (trackingNumber && trackingNumber !== order.trackingNumber)) {
    await logEvent(id, "courier", `Handed to ${courier || "the courier"}${trackingNumber ? `, tracking ${trackingNumber}` : ""}.`, me.email);
  }

  // The customer's "on its way" email, only when the merchant asked for it.
  if (orderStatus === "SHIPPED" && formData.get("notify") === "on" && order.customerEmail) {
    try {
      const settings = await getStoreSettings();
      await sendOrderShippedEmail(order.customerEmail, {
        shopName: settings.storeName || "our store",
        name: order.customerName,
        orderId: order.id,
        courier: courier ?? order.courier ?? "",
        tracking: trackingNumber ?? order.trackingNumber ?? "",
        link: orderLink(await canonicalUrl(order.shopId), order.id, order.accessKey),
        replyTo: (await shopNotificationEmail(order.shopId)) ?? undefined,
      });
      await logEvent(id, "email", "Emailed the customer that it is on its way.", me.email);
    } catch (error) {
      console.error("[orders] shipped email failed", error);
      await logEvent(id, "email", "The on-its-way email could not be sent.", me.email);
    }
  }

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function updatePaymentStatus(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const paymentStatus = String(formData.get("paymentStatus"));
  if (!PAYMENT_STATUSES.includes(paymentStatus as never)) return;

  const scoped = await db();
  const order = await scoped.order.findFirst({ where: { id }, select: { paymentStatus: true } });
  if (!order || order.paymentStatus === paymentStatus) return;
  await scoped.order.update({ where: { id }, data: { paymentStatus: paymentStatus as never } });
  await logEvent(id, "payment", paymentStatus === "CONFIRMED" ? "Marked as paid." : `Payment marked ${words(paymentStatus)}.`, me.email);
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

/**
 * Move many orders to one stage at once: the orders list's bulk bar
 * (Confirm, Mark packed). Only orders that are not already there, and never
 * a cancelled one, which has to be brought back on its own page on purpose.
 */
export async function bulkOrderStage(ids: string[], to: string): Promise<{ ok: true; changed: number } | { ok: false; error: string }> {
  const me = await requireAdmin();
  if (!ORDER_STATUSES.includes(to as never) || to === "CANCELLED") return { ok: false, error: "That is not a stage these can move to." };
  const list = [...new Set(ids)].slice(0, 200);
  const scoped = await db();
  const orders = await scoped.order.findMany({
    where: { id: { in: list }, deletedAt: null, orderStatus: { notIn: [to as Stage, "CANCELLED"] } },
    select: { id: true, orderStatus: true },
  });
  if (orders.length === 0) return { ok: true, changed: 0 };
  await scoped.order.updateMany({ where: { id: { in: orders.map((o) => o.id) } }, data: { orderStatus: to as Stage } });
  for (const o of orders) await logEvent(o.id, "stage", `Moved from ${words(o.orderStatus)} to ${words(to)}, with others.`, me.email);
  revalidatePath("/admin/orders");
  return { ok: true, changed: orders.length };
}

/** A note the team leaves on an order, for the order's timeline. */
export async function addOrderNote(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id"));
  const text = String(formData.get("note") ?? "").trim();
  if (!text) return;
  const order = await (await db()).order.findFirst({ where: { id }, select: { id: true } });
  if (!order) return;
  await logEvent(id, "note", text, me.email);
  revalidatePath(`/admin/orders/${id}`);
}

// Soft delete — moves the order to the admin Bin. The order (and its line items) are kept
// intact; it just drops out of every list/revenue-profit aggregate until restored. Real
// orders are normally handled via status (e.g. CANCELLED), not deletion.
export async function moveOrderToBin(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await (await db()).order.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/bin");
  revalidatePath("/admin");
  redirect("/admin/orders");
}

export async function restoreOrder(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await (await db()).order.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/bin");
  revalidatePath("/admin");
}

// Hard delete — only reachable from within the Bin. Cascades its OrderItems.
export async function permanentlyDeleteOrder(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await (await db()).order.delete({ where: { id } });
  revalidatePath("/admin/bin");
}
