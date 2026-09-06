"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { CACHE_KINDS } from "@/lib/cache-tags";
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

  const shopId = await currentShopId();
  await prisma.shop.update({
    where: { id: shopId },
    data: { businessType: storedBusinessType(value) },
  });

  // Everything cached about how this shop presents itself is partitioned by
  // business type, so all of it is wrong the moment the type changes. Without
  // this the storefront keeps wearing the old kind of shop for as long as the
  // cache holds — up to five minutes of a merchant watching for the switch to
  // take effect and seeing nothing happen. A type change is rare; dropping the
  // whole of one shop's presentation cache costs nothing.
  for (const kind of CACHE_KINDS) invalidateShop(shopId, kind);

  // The sidebar, the theme picker and the storefront all read this.
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}
