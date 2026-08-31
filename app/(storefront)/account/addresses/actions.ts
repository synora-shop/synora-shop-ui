"use server";

import { revalidatePath } from "next/cache";
import { currentCustomer } from "@/lib/data/customer";
import { db, currentShopId } from "@/lib/data/shop";

export async function addAddress(formData: FormData) {
  const me = await currentCustomer();
  if (!me) return;

  await (await db()).address.create({
    data: {
      shopId: await currentShopId(),
      customerId: me.id,
      label: String(formData.get("label") || "Home"),
      line1: String(formData.get("line1")),
      line2: String(formData.get("line2") || ""),
      city: String(formData.get("city")),
      province: String(formData.get("province")),
      postalCode: String(formData.get("postalCode") || ""),
      phone: String(formData.get("phone")),
    },
  });
  revalidatePath("/account/addresses");
}

export async function deleteAddress(formData: FormData) {
  const me = await currentCustomer();
  if (!me) return;

  const id = String(formData.get("id"));
  await (await db()).address.deleteMany({ where: { id, customerId: me.id } });
  revalidatePath("/account/addresses");
}
