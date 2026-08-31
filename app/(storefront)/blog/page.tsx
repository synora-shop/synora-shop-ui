import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ArticleList } from "@/components/storefront/sections/article-list";
import { getPublishedArticles } from "@/lib/data/articles";
import { guardStorefront } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Blog" };
}

export default async function BlogIndexPage() {
  await guardStorefront();

  const articles = await getPublishedArticles();

  return (
    <Container className="py-16">
      <ArticleList
        heading="Blog"
        columns={3}
        limit={articles.length}
        showExcerpt
        // Serialised the same way the section context does it, so the page and
        // a blog-posts section on the home page render from identical shapes.
        articles={articles.map((article) => ({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          authorName: article.authorName,
          publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
        }))}
      />
    </Container>
  );
}
