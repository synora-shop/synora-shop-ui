"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/data/shop";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  await requireRole("STAFF");
}

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const PAYMENT_STATUSES = ["PENDING", "AWAITING_VERIFICATION", "CONFIRMED", "FAILED"] as const;

export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const orderStatus = String(formData.get("orderStatus"));
  if (!ORDER_STATUSES.includes(orderStatus as never)) return;

  await (await db()).order.update({ where: { id }, data: { orderStatus: orderStatus as never } });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function updatePaymentStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const paymentStatus = String(formData.get("paymentStatus"));
  if (!PAYMENT_STATUSES.includes(paymentStatus as never)) return;

  await (await db()).order.update({ where: { id }, data: { paymentStatus: paymentStatus as never } });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
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
