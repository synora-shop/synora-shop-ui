import webPush from "web-push";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/utils";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@synoradigitals.com";

if (PUBLIC_KEY && PRIVATE_KEY) {
  webPush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

type OrderPushData = {
  id: string;
  customerName: string;
  total: number;
  /** Whose order this is. Without it every merchant on the platform would be
   *  woken up for every other merchant's sales. */
  shopId: string;
};

/** Best-effort — never throws, so a missing/misconfigured VAPID key never blocks order placement. */
export async function sendOrderPushNotifications(order: OrderPushData) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    console.log(`[push] VAPID keys not configured, skipping push for order ${order.id}`);
    return;
  }

  // Only the devices registered against this shop. The old query asked for
  // "any admin", which on a single-store install meant the owner and now would
  // mean everyone.
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { shopId: order.shopId },
  });
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: `New order, ${formatPKR(order.total)}`,
    body: `${order.customerName} just placed an order.`,
    url: `/admin/orders/${order.id}`,
  });

  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        } else {
          console.error("[push] Failed to send push notification", err);
        }
      }
    })
  );

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }
}
