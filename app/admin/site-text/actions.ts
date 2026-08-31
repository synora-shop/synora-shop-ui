"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { invalidateShop } from "@/lib/data/cached";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  await requireRole("STAFF");
}

// getSiteText() is cached per shop, so the storefront does need telling —
// invalidateShop is what makes an edit show up there. The pages are still
// dynamically rendered; it is the data underneath them that is cached.
export async function updateSiteText(key: string, value: string, group: string) {
  await requireAdmin();
  await (await db()).siteText.upsert({
    where: { shopId_key: { shopId: await currentShopId(), key } },
    create: { shopId: await currentShopId(), key, value, group },
    update: { value },
  });
  invalidateShop(await currentShopId(), "site-text");
  revalidatePath("/admin/site-text");
}

export async function resetSiteText(key: string) {
  await requireAdmin();
  await (await db())
    .siteText.delete({ where: { shopId_key: { shopId: await currentShopId(), key } } })
    // Resetting a key that was never overridden is the ordinary case, and
    // Prisma reports it as P2025. Anything else is a real failure and must not
    // be swallowed into a success message.
    .catch((error: unknown) => {
      const code = (error as { code?: string })?.code;
      if (code !== "P2025") throw error;
    });
  invalidateShop(await currentShopId(), "site-text");
  revalidatePath("/admin/site-text");
}
