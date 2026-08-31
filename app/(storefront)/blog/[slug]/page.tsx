import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { formatDate } from "@/components/storefront/sections/article-list";
import { getPublishedArticle } from "@/lib/data/articles";
import { guardStorefront } from "@/lib/maintenance";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: "Post" };

  // The post's own title and summary are right far more often than not, so the
  // overrides only apply where someone has actually set one.
  const description = article.seoDescription?.trim() || article.excerpt?.trim() || undefined;
  return {
    title: article.seoTitle?.trim() || article.title,
    description,
    openGraph: {
      type: "article",
      title: article.title,
      description,
      publishedTime: article.publishedAt?.toISOString(),
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage(props: PageProps<"/blog/[slug]">) {
  await guardStorefront();

  const { slug } = await props.params;
  // Drafts are excluded by the query rather than checked here: a draft
  // reachable by guessing its address is a draft that is published.
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-2xl">
        <Link href="/blog" className="text-xs text-ink-soft hover:text-ink">
          Blog
        </Link>

        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight">{article.title}</h1>

        <p className="mt-3 text-sm text-ink-faint">
          {[article.authorName, formatDate(article.publishedAt?.toISOString() ?? null)]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {article.coverImage && (
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[var(--radius)] bg-subtle">
            <Image
              src={article.coverImage}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 42rem"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* The body is the merchant's own writing, rendered as text with its
            line breaks kept. Not as HTML: it is stored as typed, and treating
            it as markup would let a staff account put script on the shop's own
            domain. Rich formatting is a later feature with an editor behind it. */}
        <div className="mt-10 whitespace-pre-line text-base leading-relaxed text-ink">
          {article.body}
        </div>

        {article.tags.length > 0 && (
          <p className="mt-12 border-t border-border pt-5 text-xs text-ink-faint">
            {article.tags.join(" · ")}
          </p>
        )}
      </article>
    </Container>
  );
}
