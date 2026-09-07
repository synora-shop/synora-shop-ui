"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SECTION_DATA } from "@/lib/section-types";
import { addressProblem, toSlug } from "@/lib/page-address";
import { policyPage } from "@/lib/policy-pages";
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


export async function createPage(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = toSlug(rawSlug || title);
  if (addressProblem(slug)) return;

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

/**
 * Adds one of the three policy pages, from a draft the merchant then edits.
 *
 * Unpublished on purpose. A blank privacy policy on a live storefront is worse
 * than no page at all — it reads as a promise nobody made — so it sits as a
 * draft until somebody has been through it and pressed Published.
 */
export async function addPolicyPage(key: string): Promise<{ ok: true } | { error: string }> {
  await requireAdmin();

  const policy = policyPage(key);
  if (!policy) return { error: "That is not a policy page this platform knows." };

  const client = await db();
  const sid = await currentShopId();

  const already = await client.page.findFirst({ where: { systemKey: policy.key }, select: { id: true } });
  if (already) return { error: `You already have a ${policy.title.toLowerCase()} page.` };

  // Its address may be taken by a page the merchant made themselves.
  const taken = await client.page.findFirst({ where: { slug: policy.slug }, select: { id: true } });
  const slug = taken ? `${policy.slug}-policy` : policy.slug;

  await client.page.create({
    data: {
      shopId: sid,
      slug,
      title: policy.title,
      systemKey: policy.key,
      isPublished: false,
      sections: {
        create: [
          {
            shopId: sid,
            type: "TEXT_BLOCK",
            order: 0,
            data: { heading: policy.heading, body: policy.body },
          },
        ],
      },
    },
  });

  revalidatePath("/admin/pages");
  return { ok: true };
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

/**
 * A page's name, its address, and what a search engine is told about it.
 *
 * The address was not editable at all, and the documentation has listed
 * editable addresses as agreed-and-unbuilt since it was written. Three things
 * had to be true before it could work:
 *
 *   1. A system page is found by its key now, not by its slug, so moving it
 *      does not hide it from the route that renders it.
 *   2. The old address forwards to the new one. `/p/[slug]` already looks for
 *      a redirect when it finds no page, so writing one is the whole job.
 *   3. Every menu that links to the page follows it. A menu item carries both
 *      the page and a written-out href, and only the first of those moves on
 *      its own.
 *
 * The home page is the exception, and not by policy: its address is the site's
 * own front door, so there is no part after the slash to change.
 */
export async function updatePageMeta(
  formData: FormData
): Promise<{ ok: true; slug: string } | { error: string }> {
  await requireAdmin();
  const pageId = String(formData.get("pageId"));
  const client = await db();

  const page = await client.page.findUnique({
    where: { id: pageId },
    select: { id: true, slug: true, title: true, systemKey: true, businessType: true },
  });
  if (!page) return { error: "That page no longer exists." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A page needs a name." };

  const asked = String(formData.get("slug") ?? "").trim();
  // The home page has no address to change, so anything typed is ignored
  // rather than refused — there is no field for it on screen either.
  const wanted = page.systemKey === "home" ? page.slug : toSlug(asked || title);

  if (page.systemKey !== "home") {
    const problem = addressProblem(wanted);
    if (problem) return { error: problem };

    if (wanted !== page.slug) {
      const clash = await client.page.findFirst({
        where: { slug: wanted, businessType: page.businessType, id: { not: page.id } },
        select: { title: true },
      });
      if (clash) return { error: `“${clash.title}” is already at that address.` };
    }
  }

  const moved = wanted !== page.slug;

  await client.page.update({
    where: { id: pageId },
    data: {
      title,
      slug: wanted,
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
      isPublished: formData.get("isPublished") === "on",
    },
  });

  if (moved) {
    const from = `/p/${page.slug}`;
    const to = `/p/${wanted}`;

    // Every link anyone has to the old address — a bookmark, another site, a
    // search result — keeps working. Listed under Links & redirects, where it
    // can be re-pointed or removed.
    await client.redirect
      .upsert({
        where: { shopId_fromPath: { shopId: await currentShopId(), fromPath: from } },
        update: { toPath: to, isActive: true },
        create: {
          shopId: await currentShopId(),
          fromPath: from,
          toPath: to,
          note: `"${page.title}" moved to ${to}`,
        },
      })
      .catch(() => {});

    // A redirect pointing *at* the address we just moved off would now send
    // visitors to a page that is not there. Re-point it at the new one.
    await client.redirect
      .updateMany({ where: { toPath: from }, data: { toPath: to } })
      .catch(() => {});

    // The menu carries a written-out address beside the page it links to, and
    // only the link moves on its own.
    await client.menuItem
      .updateMany({ where: { pageId: page.id }, data: { href: to } })
      .catch(() => {});

    revalidatePath(from);
    revalidatePath(to);
    revalidatePath("/admin/redirects");
    revalidatePath("/admin/menus");
  }

  await revalidatePageRoutes(pageId);
  return { ok: true, slug: wanted };
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
