"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SECTION_DATA } from "@/lib/section-types";
import type { SectionType } from "@/lib/generated/prisma/client";

async function requireAdmin() {
  await requireRole("STAFF");
}

// Every write here can affect the homepage (or another Page) — revalidate
// both the admin editor and the live route.
async function revalidatePageRoutes(pageId: string) {
  revalidatePath("/admin/pages");
  revalidatePath(`/admin/pages/${pageId}`);
  const page = await (await db()).page.findUnique({ where: { id: pageId }, select: { slug: true } });
  if (!page?.slug) return;
  if (page.slug === "home") revalidatePath("/");
  else revalidatePath(`/p/${page.slug}`);
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RESERVED_SLUGS = new Set(["home", "about", "faq", "shop", "cart", "checkout", "contact", "account"]);

export async function createPage(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || title);
  if (!slug || RESERVED_SLUGS.has(slug)) return;

  const sid = await currentShopId();
  await (await db()).page
    .create({
      data: {
        shopId: sid,
        slug,
        title,
        sections: {
          create: [{ shopId: sid, type: "TEXT_BLOCK", order: 0, data: { heading: title, body: "" } }],
        },
      },
    })
    .catch(() => {}); // e.g. slug already in use — swallow, matches deleteCategory's FK-failure handling

  revalidatePath("/admin/pages");
  revalidatePath("/admin/pages");
}

export async function deletePage(formData: FormData) {
  await requireAdmin();
  const pageId = String(formData.get("pageId"));
  const page = await (await db()).page.findUnique({ where: { id: pageId } });
  // System pages (Home/About/FAQ) can't be deleted; collection pages are only ever deleted
  // by deleting their Category (which cascades here) — see prisma/schema.prisma's Page comment.
  if (!page || page.isSystem || page.categoryId) return;
  await (await db()).page.delete({ where: { id: pageId } });

  // A deleted page's address may already be bookmarked, linked from elsewhere,
  // or indexed by a search engine. Rather than leaving it to 404, point it at
  // the home page — the redirect is listed under Links & redirects, where it
  // can be re-pointed somewhere better or removed entirely.
  await (await db()).redirect
    .upsert({
      where: { shopId_fromPath: { shopId: await currentShopId(), fromPath: `/p/${page.slug}` } },
      update: { toPath: "/", isActive: true },
      create: {
        shopId: await currentShopId(),
        fromPath: `/p/${page.slug}`,
        toPath: "/",
        note: `"${page.title}" page was deleted`,
      },
    })
    .catch(() => {}); // never let redirect bookkeeping fail the delete itself

  revalidatePath("/admin/pages");
  revalidatePath(`/p/${page.slug}`);
  revalidatePath("/admin/redirects");
}

export async function updatePageMeta(formData: FormData) {
  await requireAdmin();
  const pageId = String(formData.get("pageId"));
  await (await db()).page.update({
    where: { id: pageId },
    data: {
      title: String(formData.get("title") ?? ""),
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
      isPublished: formData.get("isPublished") === "on",
    },
  });
  await revalidatePageRoutes(pageId);
}

export async function addSection(pageId: string, type: SectionType) {
  await requireAdmin();
  const last = await (await db()).section.findFirst({ where: { pageId }, orderBy: { order: "desc" } });
  await (await db()).section.create({
    data: {
      shopId: await currentShopId(),
      pageId,
      type,
      order: (last?.order ?? -1) + 1,
      data: (DEFAULT_SECTION_DATA[type] ?? {}) as object,
    },
  });
  await revalidatePageRoutes(pageId);
}

export async function deleteSection(sectionId: string) {
  await requireAdmin();
  const section = await (await db()).section.delete({ where: { id: sectionId } });
  await revalidatePageRoutes(section.pageId);
}

export async function toggleSectionVisibility(sectionId: string) {
  await requireAdmin();
  const section = await (await db()).section.findUniqueOrThrow({ where: { id: sectionId } });
  await (await db()).section.update({ where: { id: sectionId }, data: { isVisible: !section.isVisible } });
  await revalidatePageRoutes(section.pageId);
}

export async function reorderSections(pageId: string, orderedIds: string[]) {
  await requireAdmin();
  const t = await db();
  await prisma.$transaction(
    orderedIds.map((id, index) => t.section.update({ where: { id }, data: { order: index } }))
  );
  await revalidatePageRoutes(pageId);
}

export async function updateSectionData(sectionId: string, data: object) {
  await requireAdmin();
  const section = await (await db()).section.update({ where: { id: sectionId }, data: { data } });
  await revalidatePageRoutes(section.pageId);
}
