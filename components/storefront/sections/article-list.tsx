import Image from "next/image";
import Link from "next/link";
import { ImagePlaceholder } from "@/components/storefront/image-placeholder";

/** One post, as the storefront needs it. */
export type ArticleCard = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  authorName: string | null;
  publishedAt: string | null;
};

/**
 * The latest posts.
 *
 * A blog's front page and the strip a shop puts under its products are the same
 * section with a different count, so this is one component rather than two.
 */
export function ArticleList({
  heading,
  columns = 3,
  limit = 6,
  showExcerpt = true,
  articles = [],
}: {
  heading?: string;
  columns?: number;
  limit?: number;
  showExcerpt?: boolean;
  articles?: ArticleCard[];
}) {
  const posts = articles.slice(0, limit);

  // Nothing published yet. Saying so beats an empty band the merchant cannot
  // explain, and it disappears the moment they write something.
  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl text-center">
        {heading && <h2 className="font-serif text-3xl font-semibold">{heading}</h2>}
        <p className="mt-3 text-sm text-ink-soft">No posts yet.</p>
      </div>
    );
  }

  return (
    <div>
      {heading && (
        <h2 className="text-center font-serif text-3xl font-semibold">{heading}</h2>
      )}

      <div
        className="mt-10 grid gap-8"
        style={{
          // Inline rather than a Tailwind class: the column count is a merchant
          // setting, and a dynamic class name is exactly what Tailwind cannot
          // see at build time.
          gridTemplateColumns: `repeat(${Math.min(Math.max(columns, 1), 4)}, minmax(0, 1fr))`,
        }}
      >
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius)] bg-subtle">
              {post.coverImage ? (
                <Image
                  src={post.coverImage}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <ImagePlaceholder
                  kind="article"
                  className="absolute inset-0 h-full w-full"
                />
              )}
            </div>

            <h3 className="mt-4 font-medium text-ink group-hover:text-brand-600">{post.title}</h3>

            {showExcerpt && post.excerpt && (
              <p className="mt-1.5 line-clamp-3 text-sm text-ink-soft">{post.excerpt}</p>
            )}

            <p className="mt-2 text-xs text-ink-faint">
              {[post.authorName, formatDate(post.publishedAt)].filter(Boolean).join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * A date a reader can take in at a glance.
 *
 * Fixed to en-GB rather than the visitor's locale: this renders on the server
 * and is cached, so a locale-dependent string would be whichever visitor warmed
 * the cache.
 */
export function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
