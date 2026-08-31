"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId } from "@/lib/data/shop";
import { prisma } from "@/lib/prisma";
import { isBusinessType, storedBusinessType } from "@/lib/themes/business-type";

/**
 * Changes what kind of business this shop is.
 *
 * Nothing is deleted and nothing is migrated. The rows that describe a
 * storefront are partitioned by business type, so the previous one is not
 * overwritten, it simply stops being the one on screen. Switching back brings
 * it all straight back: the same pages, the same design, the same colours.
 *
 * Products, posts, orders and customers are shared rather than partitioned, so
 * a shop that switches keeps its catalogue either way.
 */
export async function changeBusinessType(value: string) {
  await requireRole("ADMIN");
  if (!isBusinessType(value)) return;

  await prisma.shop.update({
    where: { id: await currentShopId() },
    data: { businessType: storedBusinessType(value) },
  });

  // The sidebar, the theme picker and the storefront all read this.
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}
