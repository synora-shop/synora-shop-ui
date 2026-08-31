"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { safeAssetUrl } from "@/lib/icon-validation";
import { describeUniqueConstraint, isUniqueConstraintError } from "@/lib/prisma-errors";

async function requireAdmin() {
  await requireRole("STAFF");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Every category gets a matching "collection page" the moment it's created — that page is
// what the menu editor's page picker offers for Header/Footer (see menu-editor.tsx). Its
// title is never read directly (resolveDestination() in lib/data/menus.ts always prefers
// the live category name), so a later rename needs no follow-up here at all.
export async function createCategory(name: string, image: string | null): Promise<{ error?: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name can't be empty." };

  const slug = slugify(trimmed);
  const sid = await currentShopId();
  try {
    await (await db()).category.create({
      data: {
        shopId: sid,
        name: trimmed,
        slug,
        image,
        pages: {
          create: [{ shopId: sid, slug, title: trimmed, isSystem: false, isPublished: true }],
        },
      },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: describeUniqueConstraint(err, "That name is already in use.") };
    }
    return { error: err instanceof Error ? err.message : "Failed to create category" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/menus");
  revalidatePath("/shop");
  return {};
}

// Renaming only ever touches `name` — `slug` (and therefore every /collections/<slug> URL,
// and every product's membership, which is linked by id not by name) stays exactly the same.
export async function renameCategory(id: string, name: string): Promise<{ error?: string }> {
  await requireAdmin();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name can't be empty." };

  await (await db()).category.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  return {};
}

// A category can only be deleted once it's empty — it's otherwise just hidden from nothing
// (products still show it), so an accidental delete would silently strand real products
// with a "missing" category. Once it IS empty, the delete is permanent (no Bin): an empty
// category was already inert, there's nothing worth recovering.
export async function deleteCategory(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  const category = await (await db()).category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) return { error: "Category not found." };
  if (category._count.products > 0) {
    return {
      error: `Can't delete "${category.name}", ${category._count.products} product(s) are still assigned to it. Remove them from this category first.`,
    };
  }

  await (await db()).category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  return {};
}

export type CollectionDetails = {
  description: string;
  image: string;
  seoTitle: string;
  seoDescription: string;
};

/**
 * Saves the presentational and SEO fields for a collection.
 *
 * Separate from renameCategory because renaming changes what the collection
 * *is* — and would change its slug and every link to it — while these only
 * change how it reads. Keeping them apart means editing a description can
 * never accidentally move a live URL.
 *
 * Blank values are stored as null rather than empty strings, so "unset" has one
 * representation and the storefront's `||` fallbacks behave predictably.
 */
export async function updateCollectionDetails(
  id: string,
  details: CollectionDetails
): Promise<{ error?: string }> {
  await requireAdmin();

  const description = details.description.trim();
  const seoTitle = details.seoTitle.trim();
  const seoDescription = details.seoDescription.trim();

  if (description.length > 2000) {
    return { error: "That description is very long, keep it under 2000 characters." };
  }
  // Search engines truncate past roughly these lengths. Refusing isn't the job;
  // saying so is, and the form shows a live count against the same numbers.
  if (seoTitle.length > 120) return { error: "Keep the SEO title under 120 characters." };
  if (seoDescription.length > 320) {
    return { error: "Keep the SEO description under 320 characters." };
  }

  const image = details.image.trim();
  if (image && !safeAssetUrl(image)) {
    return { error: "That image address can't be used safely." };
  }

  await (await db()).category.update({
    where: { id },
    data: {
      description: description || null,
      image: image || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  return {};
}
