import "server-only";
import { prisma } from "@/lib/prisma";
import { sendOrderEmails } from "@/lib/email";
import { sendOrderPushNotifications } from "@/lib/push";
import { shopNotificationEmail } from "@/lib/data/shop";

/**
 * Tell the merchant and the customer that a gateway order has been paid for.
 *
 * Split out from checkout because the two kinds of order become real at
 * different moments. A cash-on-delivery order is an event the instant it is
 * placed. A card order placed is only an intention: announcing it before the
 * money is verified is how a merchant packs a parcel for a card that declined.
 *
 * Called from exactly one place — the transaction inside `verifyPayment` that
 * wins the confirmation claim — so it runs once per order however many
 * callbacks arrive.
 */
export async function announcePaidOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shop: { select: { name: true } } },
  });
  if (!order) return;

  await sendOrderEmails({
    id: order.id,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: order.items,
    subtotal: order.subtotal,
    shippingFee: order.shippingFee,
    total: order.total,
    paymentMethod: order.paymentMethod,
    shopName: order.shop.name,
    notifyEmail: await shopNotificationEmail(order.shopId),
  });

  await sendOrderPushNotifications({
    id: order.id,
    customerName: order.customerName,
    total: order.total,
    shopId: order.shopId,
  });
}
