"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { normaliseTime } from "@/lib/opening-hours";

export async function saveOpeningHours(formData: FormData) {
  await requireRole("STAFF");

  const client = await db();
  const shopId = await currentShopId();

  // Seven rows, written together. A day at a time would let a merchant leave
  // the week half-saved, and there are only ever seven.
  for (let day = 0; day < 7; day++) {
    const closed = formData.get(`closed-${day}`) === "on";
    const data = {
      closed,
      // Cleared when the day is closed, so a later reopening does not silently
      // restore hours nobody has looked at since.
      opensAt: closed ? null : normaliseTime(String(formData.get(`opensAt-${day}`) ?? "")),
      closesAt: closed ? null : normaliseTime(String(formData.get(`closesAt-${day}`) ?? "")),
      reopensAt: closed ? null : normaliseTime(String(formData.get(`reopensAt-${day}`) ?? "")),
      reclosesAt: closed ? null : normaliseTime(String(formData.get(`reclosesAt-${day}`) ?? "")),
    };

    await client.openingHours.upsert({
      where: { shopId_day: { shopId, day } },
      update: data,
      create: { shopId, day, ...data },
    });
  }

  revalidatePath("/admin/hours");
  revalidatePath("/");
}
