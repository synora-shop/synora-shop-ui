"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { db, currentShopId } from "@/lib/data/shop";

async function requireAdmin() {
  await requireRole("STAFF");
}

/** Every write can change the blog and the post itself. */
function revalidateBlog(slug?: string) {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
  // The home page too: a blog-posts section on it shows the latest.
  revalidatePath("/");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/**
 * A slug nothing else is using.
 *
 * Two posts called "Opening soon" is ordinary rather than a mistake, so the
 * second gets `opening-soon-2` instead of an error a merchant has to solve.
 */
async function uniqueSlug(base: string, exceptId?: string): Promise<string> {
  const client = await db();
  const root = base || "post";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const clash = await client.article.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === exceptId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/** Splits "one, two , three" into tags, dropping blanks and duplicates. */
function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 40))
    ),
  ].slice(0, 12);
}

export async function createArticle(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const article = await (await db()).article.create({
    data: {
      // The scoped client stamps this too; the types still ask for it.
      shopId: await currentShopId(),
      title,
      slug: await uniqueSlug(slugify(String(formData.get("slug") ?? "") || title)),
      // Created empty and as a draft. A post is written over time, and one
      // that went live the moment it was named would be the wrong default.
      body: "",
      status: "DRAFT",
    },
    select: { id: true },
  });

  revalidateBlog();
  redirect(`/admin/blog/${article.id}`);
}

export async function updateArticle(id: string, formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const client = await db();
  const existing = await client.article.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!existing) return;

  const wanted = slugify(String(formData.get("slug") ?? "").trim());
  // Only re-derive when the merchant actually changed it. Silently renaming a
  // published post breaks every link anyone has shared to it.
  const slug =
    wanted && wanted !== existing.slug ? await uniqueSlug(wanted, id) : existing.slug;

  await client.article.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: String(formData.get("excerpt") ?? "").trim() || null,
      body: String(formData.get("body") ?? ""),
      coverImage: String(formData.get("coverImage") ?? "").trim() || null,
      authorName: String(formData.get("authorName") ?? "").trim() || null,
      tags: parseTags(String(formData.get("tags") ?? "")),
      seoTitle: String(formData.get("seoTitle") ?? "").trim() || null,
      seoDescription: String(formData.get("seoDescription") ?? "").trim() || null,
    },
  });

  revalidateBlog(slug);
  if (slug !== existing.slug) revalidateBlog(existing.slug);
}

export async function publishArticle(id: string) {
  await requireAdmin();

  const client = await db();
  const article = await client.article.findUnique({
    where: { id },
    select: { slug: true, publishedAt: true },
  });
  if (!article) return;

  await client.article.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      // Kept once set, so re-publishing an edited post does not move it back to
      // the top of the blog as though it were new.
      publishedAt: article.publishedAt ?? new Date(),
    },
  });

  revalidateBlog(article.slug);
}

export async function unpublishArticle(id: string) {
  await requireAdmin();

  const client = await db();
  const article = await client.article.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!article) return;

  // publishedAt is deliberately left alone: it records when this post first
  // went out, which is still true while it is hidden.
  await client.article.update({ where: { id }, data: { status: "DRAFT" } });
  revalidateBlog(article.slug);
}

export async function deleteArticle(id: string) {
  await requireAdmin();

  const client = await db();
  const article = await client.article.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!article) return;

  await client.article.delete({ where: { id } });
  revalidateBlog(article.slug);
  redirect("/admin/blog");
}
