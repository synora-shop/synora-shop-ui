import { currentShopId, db } from "@/lib/data/shop";
import {
  isMetafieldType,
  nameProblem,
  valueProblem,
  type MetafieldType,
  type OwnerType,
} from "@/lib/metafields";

/**
 * Reading and writing metafields.
 *
 * The only writer, on purpose. A metafield's owner is a type and an id rather
 * than a foreign key — see the model comment for why — which means the database
 * cannot refuse a row pointing at a product that does not exist. Something has
 * to, so it is this file, and keeping every write here is what makes that
 * promise checkable rather than hopeful.
 */

export type SaveResult = { ok: true } | { ok: false; error: string };

/** Whether an owner row actually exists in this shop. */
async function ownerExists(ownerType: OwnerType, ownerId: string): Promise<boolean> {
  // Shop-level fields have no row of their own; the scoped client already
  // guarantees we are talking about this shop.
  if (ownerType === "shop") return ownerId === "";

  const client = await db();
  switch (ownerType) {
    case "product":
      return (await client.product.count({ where: { id: ownerId } })) > 0;
    case "collection":
      return (await client.category.count({ where: { id: ownerId } })) > 0;
    case "page":
      return (await client.page.count({ where: { id: ownerId } })) > 0;
  }
}

/** Every metafield on one owner, in the shape a theme indexes into. */
export async function listMetafields(ownerType: OwnerType, ownerId: string) {
  const client = await db();
  return client.metafield.findMany({
    where: { ownerType, ownerId },
    orderBy: [{ namespace: "asc" }, { key: "asc" }],
    select: { id: true, namespace: true, key: true, type: true, value: true, updatedAt: true },
  });
}

/**
 * Creates or updates one metafield.
 *
 * Validation is not a formality here. The name halves become Liquid property
 * lookups, so a key with a dot in it would be unreachable from the theme that
 * needs it — a field that exists, is stored, and can never be read.
 */
export async function saveMetafield(input: {
  ownerType: OwnerType;
  ownerId: string;
  namespace: string;
  key: string;
  type: string;
  value: string;
}): Promise<SaveResult> {
  const namespace = input.namespace.trim();
  const key = input.key.trim();

  const named = nameProblem(namespace, key);
  if (named) return { ok: false, error: named };

  if (!isMetafieldType(input.type)) return { ok: false, error: "That isn't a field type we handle." };
  const type: MetafieldType = input.type;

  const bad = valueProblem(type, input.value);
  if (bad) return { ok: false, error: bad };

  const ownerId = input.ownerType === "shop" ? "" : input.ownerId;
  if (!(await ownerExists(input.ownerType, ownerId))) {
    return { ok: false, error: "That item no longer exists." };
  }

  const shopId = await currentShopId();
  const client = await db();
  await client.metafield.upsert({
    where: {
      shopId_ownerType_ownerId_namespace_key: {
        shopId,
        ownerType: input.ownerType,
        ownerId,
        namespace,
        key,
      },
    },
    update: { type, value: input.value },
    create: { shopId, ownerType: input.ownerType, ownerId, namespace, key, type, value: input.value },
  });

  return { ok: true };
}

export async function deleteMetafield(id: string): Promise<SaveResult> {
  const client = await db();
  // deleteMany rather than delete: the scoped client turns "not this shop's"
  // into "no rows", which is the answer we want, where delete would throw.
  const { count } = await client.metafield.deleteMany({ where: { id } });
  return count > 0 ? { ok: true } : { ok: false, error: "That field has already been removed." };
}
