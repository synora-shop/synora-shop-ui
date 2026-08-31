"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId } from "@/lib/data/shop";
import { prisma } from "@/lib/prisma";
import { isBusinessType, storedBusinessType } from "@/lib/themes/business-type";

/**
 * The welcome flow writes to the Shop row itself.
 *
 * Shop is a platform-level model rather than a tenant one, so these use the
 * plain client with an explicit id, the way every other shop-level write does.
 * requireRole has already proved membership of this shop.
 */

/** Records the answer and moves on. Every step may be skipped. */
export async function chooseBusinessType(value: string) {
  await requireRole("ADMIN");

  if (isBusinessType(value)) {
    await prisma.shop.update({
      where: { id: await currentShopId() },
      data: { businessType: storedBusinessType(value) },
    });
    // The sidebar and the theme picker both change with this.
    revalidatePath("/admin", "layout");
  }

  redirect("/admin/welcome/name");
}

export async function nameStore(formData: FormData) {
  await requireRole("ADMIN");

  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (name) {
    await prisma.shop.update({
      where: { id: await currentShopId() },
      data: { name },
    });
    revalidatePath("/admin", "layout");
  }

  redirect("/admin/welcome/look");
}

/**
 * Ends the flow, whether it was completed or skipped.
 *
 * Stamped either way and deliberately: a merchant who skipped has still been
 * asked, and asking again on their next visit would be the product nagging
 * rather than helping.
 */
export async function finishWelcome() {
  await requireRole("ADMIN");

  await prisma.shop.update({
    where: { id: await currentShopId() },
    data: { onboardedAt: new Date() },
  });

  revalidatePath("/admin", "layout");
  redirect("/admin");
}
