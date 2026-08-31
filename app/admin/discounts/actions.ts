"use server";

import { revalidatePath } from "next/cache";
import { db, currentShopId } from "@/lib/data/shop";
import { requireRole } from "@/lib/auth-guard";
import { audit } from "@/lib/audit";
import { describeUniqueConstraint, isUniqueConstraintError } from "@/lib/prisma-errors";
import { codeProblem, normaliseCode, rulesProblem, type DiscountType } from "@/lib/discounts";

export type Result = { ok: true; message?: string } | { ok: false; error: string };

export type DiscountInput = {
  code: string;
  type: DiscountType;
  value: number;
  minSubtotal: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
};

/** Empty strings from a form mean "no limit", which is not the same as zero. */
function toDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validate(input: DiscountInput): string | null {
  const code = codeProblem(input.code);
  if (code) return code;
  return rulesProblem({
    type: input.type,
    value: input.value,
    minSubtotal: input.minSubtotal,
    usageLimit: input.usageLimit,
    perCustomerLimit: input.perCustomerLimit,
    startsAt: toDate(input.startsAt),
    endsAt: toDate(input.endsAt),
  });
}

export async function createDiscount(input: DiscountInput): Promise<Result> {
  const me = await requireRole("ADMIN");

  const problem = validate(input);
  if (problem) return { ok: false, error: problem };

  try {
    const discount = await (await db()).discount.create({
      data: {
        shopId: await currentShopId(),
        code: normaliseCode(input.code),
        type: input.type,
        // Free shipping has no amount; storing whatever was in the form would
        // put a stale number in front of the merchant when they edit it.
        value: input.type === "FREE_SHIPPING" ? 0 : input.value,
        minSubtotal: input.minSubtotal,
        usageLimit: input.usageLimit,
        perCustomerLimit: input.perCustomerLimit,
        startsAt: toDate(input.startsAt),
        endsAt: toDate(input.endsAt),
      },
    });

    await audit({
      shopId: me.shop.id,
      action: "discount.create",
      userId: me.userId,
      actorEmail: me.email,
      entity: "Discount",
      entityId: discount.id,
      detail: { code: discount.code, type: discount.type, value: discount.value },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { ok: false, error: describeUniqueConstraint(error, "That code already exists.") };
    }
    throw error;
  }

  revalidatePath("/admin/discounts");
  return { ok: true, message: `${normaliseCode(input.code)} is ready to use.` };
}

export async function setDiscountActive(id: string, isActive: boolean): Promise<Result> {
  const me = await requireRole("ADMIN");

  const { count } = await (await db()).discount.updateMany({
    where: { id },
    data: { isActive },
  });
  if (count === 0) return { ok: false, error: "That discount no longer exists." };

  await audit({
    shopId: me.shop.id,
    action: isActive ? "discount.enable" : "discount.disable",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Discount",
    entityId: id,
  });

  revalidatePath("/admin/discounts");
  return { ok: true, message: isActive ? "Code switched on." : "Code switched off." };
}

/**
 * Removes a discount.
 *
 * Orders that used it keep their `discountCode` and `discountAmount`, which are
 * copied rather than joined — an old order has to keep adding up after the
 * code behind it is gone.
 */
export async function deleteDiscount(id: string): Promise<Result> {
  const me = await requireRole("ADMIN");

  const { count } = await (await db()).discount.deleteMany({ where: { id } });
  if (count === 0) return { ok: false, error: "That discount no longer exists." };

  await audit({
    shopId: me.shop.id,
    action: "discount.delete",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Discount",
    entityId: id,
  });

  revalidatePath("/admin/discounts");
  return { ok: true, message: "Discount deleted." };
}
