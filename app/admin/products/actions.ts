"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { Prisma } from "@/lib/generated/prisma/client";
import { validateUrl } from "@/lib/url-validation";
import {
  isEnquiryOnly,
  parseCustomFields,
  parseTiers,
  type BulkPricing,
  type BulkTier,
  type CustomField,
  type ProductKind,
} from "@/lib/product-kind";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

export type VariantInput = {
  size: string;
  color: string;
  colorHex: string;
  sku: string;
  stock: number;
};

export type ProductInput = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  details: string;
  images: string[];
  basePrice: number;
  salePrice: number | null;
  costPrice: number;
  categoryIds: string[]; // a product can belong to several categories at once
  isFeatured: boolean;
  isActive: boolean;
  variants: VariantInput[];
  // How the product is sold, and the settings that only apply to that choice.
  kind: ProductKind;
  bulkPricing: BulkPricing;
  minOrderQuantity: number | null;
  bulkPriceMin: number | null;
  bulkPriceMax: number | null;
  tiers: BulkTier[];
  customFields: CustomField[];
  enquiryUrl: string;
  // "publish" tries to go live; "draft" always saves as a draft regardless of completeness.
  intent: "draft" | "publish";
};

export type SaveProductResult =
  | { id: string; status: "DRAFT" | "PUBLISHED"; downgradedToDraft?: string }
  | { error: string };

export async function saveProduct(input: ProductInput): Promise<SaveProductResult> {
  await requireAdmin();

  // Draft is the safety net for half-configured products — only a title is ever required,
  // so nothing entered in the form is lost by saving early or navigating away.
  if (!input.title.trim()) {
    return { error: "A title is required, even to save as a draft." };
  }

  let status: "DRAFT" | "PUBLISHED" = "DRAFT";
  let downgradedToDraft: string | undefined;

  // Enquiry-only products are never added to a cart, so they need neither a
  // price nor stocked variants to be complete. Holding them to the standard
  // product's checklist would make a perfectly finished bulk listing
  // unpublishable for want of a size chart it will never use.
  const enquiryOnly = isEnquiryOnly(input.kind);

  if (input.intent === "publish") {
    if (input.categoryIds.length === 0) downgradedToDraft = "Add a category to publish.";
    else if (!enquiryOnly && input.variants.length === 0)
      downgradedToDraft = "Add at least one size/color variant to publish.";
    else if (input.images.filter(Boolean).length === 0)
      downgradedToDraft = "Add at least one image to publish.";
    else if (enquiryOnly && input.enquiryUrl.trim()) {
      const check = validateUrl(input.enquiryUrl, { allowEmpty: true, allowInternal: true });
      if (!check.ok) downgradedToDraft = `The enquiry link isn't usable: ${check.error}`;
    }

    status = downgradedToDraft ? "DRAFT" : "PUBLISHED";
  }

  if (input.categoryIds.length === 0) {
    return { error: "Add at least one category first (Categories page) before creating products." };
  }

  const slug = input.slug.trim() ? slugify(input.slug) : slugify(input.title);

  // A discount always keeps the product's Sale-category membership in sync — the admin
  // never has to remember to add/remove it by hand (and can't fight it in the form, see
  // product-form.tsx's disabled Sale checkbox while a discount is active).
  const onSale = input.salePrice != null && input.salePrice < input.basePrice;
  const saleCategory = await (await db()).category.findFirst({ where: { slug: "sale" } });
  const categoryIdSet = new Set(input.categoryIds);
  if (saleCategory) {
    if (onSale) categoryIdSet.add(saleCategory.id);
    else categoryIdSet.delete(saleCategory.id);
  }
  const finalCategoryIds = Array.from(categoryIdSet);

  const urlCheck = validateUrl(input.enquiryUrl ?? "", { allowEmpty: true, allowInternal: true });
  if (!urlCheck.ok) return { error: `The enquiry link isn't usable: ${urlCheck.error}` };
  const enquiryUrl = enquiryOnly && urlCheck.href ? urlCheck.href : null;

  try {
    const baseData = {
      title: input.title.trim(),
      slug,
      description: input.description,
      details: input.details || null,
      images: input.images.filter(Boolean),
      basePrice: input.basePrice,
      salePrice: input.salePrice,
      costPrice: input.costPrice,
      isFeatured: input.isFeatured,
      isActive: input.isActive,
      status,
      kind: input.kind,
      // The bulk/custom columns are always written, so switching a product back
      // to standard clears the settings that no longer apply rather than
      // leaving them to reappear if it is switched again later.
      bulkPricing: input.kind === "BULK" ? input.bulkPricing : "HIDDEN",
      minOrderQuantity: input.kind === "BULK" ? input.minOrderQuantity : null,
      bulkPriceMin: input.kind === "BULK" && input.bulkPricing === "RANGE" ? input.bulkPriceMin : null,
      bulkPriceMax: input.kind === "BULK" && input.bulkPricing === "RANGE" ? input.bulkPriceMax : null,
      bulkTiers:
        input.kind === "BULK" && input.bulkPricing === "TIERED" ? parseTiers(input.tiers) : Prisma.DbNull,
      customFields: input.kind === "CUSTOM" ? parseCustomFields(input.customFields) : Prisma.DbNull,
      // Re-validated here, not just in the form: this is the value that ends up
      // in an href on a public page.
      enquiryUrl: enquiryUrl,
    };

    const product = input.id
      ? await (await db()).product.update({
          where: { id: input.id },
          data: { ...baseData, categories: { set: finalCategoryIds.map((id) => ({ id })) } },
        })
      : await (await db()).product.create({
          data: {
            ...baseData,
            shopId: await currentShopId(),
            categories: { connect: finalCategoryIds.map((id) => ({ id })) },
          },
        });

    // Replace variants wholesale — simplest consistent approach for a small admin-managed catalog.
    await (await db()).productVariant.deleteMany({ where: { productId: product.id } });
    if (input.variants.length > 0) {
      const sid = await currentShopId();
      await (await db()).productVariant.createMany({
        data: input.variants.map((v) => ({
          shopId: sid,
          productId: product.id,
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || null,
          sku: v.sku,
          stock: v.stock,
        })),
      });
    }

    revalidatePath("/admin/products");
    revalidatePath(`/product/${slug}`);
    revalidatePath("/shop");
    return { id: product.id, status, downgradedToDraft };
  } catch (err) {
    // By code, not by the text of the message: matching on Prisma's prose
    // breaks silently the day it is reworded, and the merchant gets a raw
    // database error where an explanation used to be.
    if (isUniqueConstraintError(err)) {
      return {
        error: describeUniqueConstraint(err, "That web address or SKU is already in use."),
      };
    }
    return { error: err instanceof Error ? err.message : "Failed to save product" };
  }
}

// Soft delete — moves the product to the admin Bin. Nothing is removed; it just disappears
// from every normal admin/storefront view until restored or permanently deleted.
export async function moveProductToBin(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await (await db()).product.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/products");
  revalidatePath("/admin/bin");
  revalidatePath("/shop");
}

export async function restoreProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await (await db()).product.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/admin/products");
  revalidatePath("/admin/bin");
  revalidatePath("/shop");
}

// Hard delete — only reachable from within the Bin. Frees the DB row; images stored on
// Vercel Blob are best-effort removed too (local /products/* paths are static files
// committed to the repo, so those bytes stay until a follow-up commit removes them).
export async function permanentlyDeleteProduct(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));

  const product = await (await db()).product.findUnique({ where: { id }, select: { images: true } });
  await (await db()).product.delete({ where: { id } });

  const blobImages = product?.images.filter((url) => url.includes(".public.blob.vercel-storage.com")) ?? [];
  if (blobImages.length > 0) {
    await Promise.allSettled(blobImages.map((url) => del(url)));
  }

  revalidatePath("/admin/bin");
}

// Image upload moved to lib/actions/media.ts (uploadImage) — shared across
// every admin image field, not just products.
