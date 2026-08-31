"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { audit } from "@/lib/audit";
import { currentShopId } from "@/lib/data/shop";
import { deleteMetafield, saveMetafield } from "@/lib/data/metafields";
import { isOwnerType, type OwnerType } from "@/lib/metafields";

export type Result = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Creating or editing a custom field.
 *
 * STAFF rather than ADMIN: a metafield holds content — a care label, a size
 * chart — and content is what staff are for. It cannot take a store offline or
 * move its traffic, which is the line the ADMIN actions sit on.
 */
export async function upsertMetafield(input: {
  ownerType: string;
  ownerId: string;
  namespace: string;
  key: string;
  type: string;
  value: string;
}): Promise<Result> {
  const me = await requireRole("STAFF");

  if (!isOwnerType(input.ownerType)) {
    return { ok: false, error: "That isn't something fields can go on." };
  }
  const ownerType: OwnerType = input.ownerType;

  const saved = await saveMetafield({ ...input, ownerType });
  if (!saved.ok) return { ok: false, error: saved.error };

  await audit({
    shopId: await currentShopId(),
    action: "metafield.save",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Metafield",
    detail: { ownerType, ownerId: input.ownerId, name: `${input.namespace}.${input.key}` },
  });

  revalidatePath("/admin/metafields");
  // A theme reads these while rendering, so the storefront is stale until the
  // whole tree is revalidated — not just the screen the edit was made on.
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function removeMetafield(id: string): Promise<Result> {
  const me = await requireRole("STAFF");

  const removed = await deleteMetafield(id);
  if (!removed.ok) return { ok: false, error: removed.error };

  await audit({
    shopId: await currentShopId(),
    action: "metafield.delete",
    userId: me.userId,
    actorEmail: me.email,
    entity: "Metafield",
    entityId: id,
  });

  revalidatePath("/admin/metafields");
  revalidatePath("/", "layout");
  return { ok: true, message: "Removed." };
}
