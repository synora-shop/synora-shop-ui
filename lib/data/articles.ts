import { cache } from "react";
import { db } from "@/lib/data/shop";

/**
 * Blog posts.
 *
 * One blog per shop, so nothing here takes a blog handle. Grouping is tags,
 * which is what almost every shop with several "blogs" was really doing.
 */

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  tags: string[];
  updatedAt: Date;
};

const SUMMARY = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  authorName: true,
  status: true,
  publishedAt: true,
  tags: true,
  updatedAt: true,
} as const;

/** Every post, drafts included. For the admin. */
export const getAllArticles = cache(async (): Promise<ArticleSummary[]> => {
  return (await db()).article.findMany({
    // Newest work first, whether or not it is published: the post a merchant
    // wants is almost always the one they were last writing.
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    select: SUMMARY,
  });
});

/** Published posts, newest first. For the storefront. */
export const getPublishedArticles = cache(
  async (limit = 24): Promise<ArticleSummary[]> => {
    return (await db()).article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: SUMMARY,
    });
  }
);

/** One post for the admin editor, drafts included. */
export const getArticle = cache(async (id: string) => {
  return (await db()).article.findUnique({ where: { id } });
});

/**
 * One published post by its slug, for the storefront.
 *
 * Drafts are excluded here rather than checked by the caller: a draft reachable
 * by guessing its address is a draft that is published, whatever the admin says.
 */
export const getPublishedArticle = cache(async (slug: string) => {
  const article = await (await db()).article.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  return article;
});

/** Every tag in use, for filtering. Counted so an empty one never shows. */
export const getArticleTags = cache(async (): Promise<string[]> => {
  const rows = await (await db()).article.findMany({
    where: { status: "PUBLISHED" },
    select: { tags: true },
  });
  return [...new Set(rows.flatMap((row) => row.tags))].sort();
});
