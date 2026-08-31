"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SELECTED_SHOP_COOKIE, selectedShopCookieOptions } from "@/lib/selected-shop";

/**
 * Opens a store's dashboard.
 *
 * Membership is checked here as well as by the admin itself. Not because the
 * admin's check is unreliable — it is the one that actually protects anything —
 * but because setting a cookie that points at a store you cannot open, and then
 * being bounced, is a worse experience than being told now.
 */
export async function openStore(shopId: string): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/merchant/login?callbackUrl=/merchant/stores");

  const membership = await prisma.membership.findUnique({
    where: { userId_shopId: { userId, shopId } },
    select: { shopId: true },
  });
  // Back to the list with a note rather than a returned error: this is used as
  // a form action, which cannot hand a value back, and the list is the only
  // place the message would be shown anyway.
  if (!membership) redirect("/merchant/stores?error=access");

  (await cookies()).set(SELECTED_SHOP_COOKIE, shopId, selectedShopCookieOptions);
  redirect("/admin");
}

/** Forgets the current store, for "work on a different one". */
export async function leaveStore() {
  (await cookies()).delete(SELECTED_SHOP_COOKIE);
  redirect("/merchant/stores");
}
