"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { canonicalUrl, db, shopNotificationEmail } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { sendCheckoutReminderEmail } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { resolveStoreDefaults } from "@/lib/store-defaults";
import { reminderText, whatsappNumber, type DraftLineView } from "@/lib/abandoned";

/**
 * Remind someone who stopped at checkout (new admin, 15 October).
 *
 * With an email address, the reminder is emailed from the shop, with the
 * shop's own address to reply to. With only a phone number, the merchant gets
 * a WhatsApp message written out and ready to send. Either way the draft
 * remembers it was reminded, which is what "Came back after a reminder"
 * counts.
 */
export async function remindCheckout(
  id: string
): Promise<{ ok: true; sent: "email" | "whatsapp"; whatsappUrl?: string } | { ok: false; error: string }> {
  await requireRole("STAFF");
  const scoped = await db();
  const draft = await scoped.checkoutDraft.findFirst({ where: { id } });
  if (!draft) return { ok: false, error: "That checkout is no longer there." };
  if (draft.recoveredOrderId) return { ok: false, error: "They have already placed the order." };
  // updatedAt is when the customer last touched the checkout, which is what
  // "abandoned" is measured from; the merchant reminding them is not that,
  // so the writes below keep it as it was.

  const settings = await getStoreSettings();
  const shopName = settings.storeName || "our store";
  const currency = resolveStoreDefaults(settings).currency;
  const lines = (draft.lines as DraftLineView[]) ?? [];
  const items = lines.map((l) => `${l.title}${l.qty > 1 ? ` ×${l.qty}` : ""}, ${formatMoney(l.price * l.qty, currency)}`);
  const storeUrl = await canonicalUrl(draft.shopId);

  if (draft.email) {
    try {
      await sendCheckoutReminderEmail(draft.email, {
        shopName,
        name: draft.name,
        items,
        storeUrl,
        replyTo: (await shopNotificationEmail(draft.shopId)) ?? undefined,
      });
    } catch (error) {
      console.error("[abandoned] reminder email failed", error);
      return { ok: false, error: "The email could not be sent. Try again in a minute." };
    }
    await scoped.checkoutDraft.update({ where: { id }, data: { remindedAt: new Date(), updatedAt: draft.updatedAt } });
    revalidatePath("/admin/orders/abandoned");
    return { ok: true, sent: "email" };
  }

  const number = whatsappNumber(draft.phone);
  if (!number) return { ok: false, error: "There is no email or phone number to remind them on." };
  await scoped.checkoutDraft.update({ where: { id }, data: { remindedAt: new Date(), updatedAt: draft.updatedAt } });
  revalidatePath("/admin/orders/abandoned");
  return {
    ok: true,
    sent: "whatsapp",
    whatsappUrl: `https://wa.me/${number}?text=${encodeURIComponent(reminderText(shopName, draft.name, lines, storeUrl))}`,
  };
}
