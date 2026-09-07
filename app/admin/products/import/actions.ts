"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { currentShopId, db } from "@/lib/data/shop";
import { readShopifyProducts, type ImportedProduct } from "@/lib/csv/import";
import type { ImportPlan, ImportResult } from "@/lib/csv/plan";
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Loading a Shopify product CSV.
 *
 * Two steps on purpose. The first reads the file and says what it would do;
 * nothing is written. The second does it. An import that writes on the first
 * click is one a merchant cannot check before it overwrites a catalogue they
 * spent a week on, and there is no undo for "everything, slightly wrong".
 *
 * Matching is by URL handle, which is Shopify's own rule: a handle that
 * already exists here is an update, a handle that does not is a new product.
 */

/** As many products as one file may carry. A catalogue, not a database dump. */
const MAX_PRODUCTS = 1000;
/** As much text as one upload may be, before it is even parsed. 8MB. */
const MAX_BYTES = 8 * 1024 * 1024;

function read(csv: string): { error: string } | { reading: ReturnType<typeof readShopifyProducts> } {
  if (csv.length > MAX_BYTES) {
    return { error: "That file is larger than 8MB. Split it and import the parts." };
  }
  const reading = readShopifyProducts(csv);
  if (reading.products.length > MAX_PRODUCTS) {
    return {
      error: `That file has ${reading.products.length} products. Import at most ${MAX_PRODUCTS} at a time.`,
    };
  }
  return { reading };
}

/** What the file says, and what it would do to this shop. Writes nothing. */
export async function planProductImport(csv: string): Promise<ImportPlan | { error: string }> {
  await requireRole("STAFF");

  const result = read(csv);
  if ("error" in result) return { error: result.error };
  const { reading } = result;

  const client = await db();
  const slugs = reading.products.map((p) => p.slug);
  // Binned products count too: a handle sitting in the Bin still owns its slug,
  // so "creating" over it would hit the unique index instead.
  const existing = await client.product.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const known = new Set(existing.map((p) => p.slug));

  const rows: ImportPlan["rows"] = reading.products.map((p) => {
    const variants = p.variants.filter((v) => v.option1 !== "").length;
    return {
      key: p.slug,
      title: p.title,
      action: known.has(p.slug) ? "update" : "create",
      detail: `${variants} variant${variants === 1 ? "" : "s"} · ${p.images.length} picture${p.images.length === 1 ? "" : "s"}`,
    };
  });

  return {
    rows,
    creating: rows.filter((r) => r.action === "create").length,
    updating: rows.filter((r) => r.action === "update").length,
    problems: reading.problems,
    unknownColumns: reading.unknownColumns,
  };
}

/**
 * Writes the file.
 *
 * Per product rather than in one transaction: a catalogue of a thousand is a
 * long transaction against a database in another continent, and a merchant
 * would rather have nine hundred products and a list of what failed than
 * nothing at all and a timeout. Each product is atomic in itself.
 */
export async function applyProductImport(csv: string): Promise<ImportResult | { error: string }> {
  await requireRole("STAFF");

  const result = read(csv);
  if ("error" in result) return { error: result.error };
  const { reading } = result;
  if (reading.products.length === 0) return { error: "Nothing in that file to import." };

  const client = await db();
  const shopId = await currentShopId();
  let created = 0;
  let updated = 0;
  const failed: ImportResult["failed"] = [];

  // Collections are resolved once rather than per product: a hundred products
  // in one collection would otherwise be a hundred identical queries.
  const categoryNames = [
    ...new Set(reading.products.map((p) => p.categoryName).filter((n): n is string => !!n)),
  ];
  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const found = await client.category.findFirst({ where: { name }, select: { id: true } });
    if (found) {
      categories.set(name, found.id);
      continue;
    }
    const made = await client.category.create({
      data: { shopId, name, slug: slugify(name) },
      select: { id: true },
    });
    categories.set(name, made.id);
  }

  for (const product of reading.products) {
    try {
      const wrote = await writeOne(client, shopId, product, categories);
      if (wrote === "created") created++;
      else updated++;
    } catch (error) {
      failed.push({
        key: product.slug,
        message: error instanceof Error ? error.message : "Could not be saved.",
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  return { created, updated, failed };
}

type Client = Awaited<ReturnType<typeof db>>;

async function writeOne(
  client: Client,
  shopId: string,
  product: ImportedProduct,
  categories: Map<string, string>
): Promise<"created" | "updated"> {
  const existing = await client.product.findFirst({
    where: { slug: product.slug },
    select: { id: true },
  });

  const data = {
    title: product.title,
    description: product.description,
    vendor: product.vendor,
    tags: product.tags,
    status: product.status,
    isActive: product.isActive,
    basePrice: Math.round(product.basePrice),
    salePrice: product.salePrice === null ? null : Math.round(product.salePrice),
    costPrice: Math.round(product.costPrice),
    images: product.images,
    option1Name: product.option1Name,
    option2Name: product.option2Name,
    option3Name: product.option3Name,
    csvExtras: product.csvExtras as Prisma.InputJsonValue,
    // An import brings a product back out of the Bin rather than writing to a
    // row nobody can see. A merchant re-importing a catalogue means it.
    deletedAt: null,
  };

  const id = existing
    ? (await client.product.update({ where: { id: existing.id }, data, select: { id: true } })).id
    : (await client.product.create({ data: { ...data, shopId, slug: product.slug }, select: { id: true } }))
        .id;

  // The collection, if the file named one. Left alone when it did not: an
  // empty Type column should not un-file a product.
  if (product.categoryName) {
    const categoryId = categories.get(product.categoryName);
    if (categoryId) {
      await client.product.update({
        where: { id },
        data: { categories: { set: [{ id: categoryId }] } },
      });
    }
  }

  // Variants are replaced rather than merged. The file is the statement of
  // what exists, so a variant it does not mention has been removed.
  const wanted = product.variants.filter((v) => v.option1 !== "" || v.sku !== "");
  await client.productVariant.deleteMany({ where: { productId: id } });
  if (wanted.length > 0) {
    await client.productVariant.createMany({
      data: wanted.map((v) => ({
        shopId,
        productId: id,
        size: v.option1,
        color: v.option2,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        // A blank SKU would collide with every other blank one under the
        // shop-wide unique index, so one is made from the handle instead.
        sku:
          v.sku ||
          `${product.slug}-${[v.option1, v.option2, v.option3].filter(Boolean).join("-") || "default"}`,
        barcode: v.barcode,
        stock: v.stock,
        priceOverride: v.priceOverride === null ? null : Math.round(v.priceOverride),
        weightGrams: v.weightGrams,
        imageUrl: v.imageUrl,
        csvExtras: v.csvExtras as Prisma.InputJsonValue,
      })),
    });
  }

  return existing ? "updated" : "created";
}

/** A handle for a collection the file named but this shop does not have yet. */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "collection"
  );
}
