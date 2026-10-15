import { prisma } from "@/lib/prisma";
import { canonicalUrl, shopNotificationEmail } from "@/lib/data/shop";
import { sendCheckoutReminderEmail } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import type { DraftLineView } from "@/lib/abandoned";

/**
 * The automatic checkout reminder (Settings > Checkout and delivery, "Remind
 * people who leave at checkout"): one email, about an hour after someone
 * stops, to anyone who gave an email address. Never twice, never after they
 * ordered, never for a checkout more than three days old.
 *
 * Run from two places, because the plan's scheduler only runs once a day: a
 * shop's own storefront traffic (after a started checkout is saved, at most
 * every ten minutes per shop and server) and the daily cron as the backstop.
 *
 * Outside any request's shop, so every query names its shop itself.
 */
const HOUR = 60 * 60_000;
const OLDEST = 72 * HOUR;

const lastSwept = new Map<string, number>();

/** For a storefront request: sweep this shop, unless it was swept moments ago. */
export async function remindDueCheckoutsSoon(shopId: string): Promise<void> {
  const now = Date.now();
  if (now - (lastSwept.get(shopId) ?? 0) < 10 * 60_000) return;
  lastSwept.set(shopId, now);
  await remindDueCheckouts(shopId);
}

/** Send what is due. With no shop, every shop that has the reminder on. Returns how many were sent. */
export async function remindDueCheckouts(onlyShopId?: string): Promise<number> {
  const shops = await prisma.storeSettings.findMany({
    where: { checkoutReminder: true, ...(onlyShopId ? { shopId: onlyShopId } : {}) },
    select: { shopId: true, storeName: true, currency: true, countryCode: true, timeZone: true, unitSystem: true, weightUnit: true },
  });
  let sent = 0;
  const now = Date.now();
  for (const shop of shops) {
    const due = await prisma.checkoutDraft.findMany({
      where: {
        shopId: shop.shopId,
        email: { not: "" },
        remindedAt: null,
        recoveredOrderId: null,
        updatedAt: { lte: new Date(now - HOUR), gte: new Date(now - OLDEST) },
      },
      orderBy: { updatedAt: "asc" },
      take: 50,
    });
    if (due.length === 0) continue;

    const currency = resolveStoreDefaults(shop).currency;
    const shopName = shop.storeName || "our store";
    const storeUrl = await canonicalUrl(shop.shopId);
    const replyTo = (await shopNotificationEmail(shop.shopId)) ?? undefined;

    for (const draft of due) {
      if (!draft.email) continue;
      // Claimed before sending, so two sweeps at once cannot both send it.
      // updatedAt is kept: it is when the customer last touched the checkout.
      const claimed = await prisma.checkoutDraft.updateMany({
        where: { id: draft.id, shopId: shop.shopId, remindedAt: null, recoveredOrderId: null },
        data: { remindedAt: new Date(), updatedAt: draft.updatedAt },
      });
      if (claimed.count === 0) continue;
      const lines = (draft.lines as DraftLineView[]) ?? [];
      try {
        await sendCheckoutReminderEmail(draft.email, {
          shopName,
          name: draft.name,
          items: lines.map((l) => `${l.title}${l.qty > 1 ? ` ×${l.qty}` : ""}, ${formatMoney(l.price * l.qty, currency)}`),
          storeUrl,
          replyTo,
        });
        sent++;
      } catch (error) {
        console.error("[abandoned] automatic reminder failed", error);
        // Released, so the next sweep tries again.
        await prisma.checkoutDraft.updateMany({
          where: { id: draft.id, shopId: shop.shopId },
          data: { remindedAt: null, updatedAt: draft.updatedAt },
        });
      }
    }
  }
  return sent;
}
