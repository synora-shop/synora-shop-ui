import Link from "next/link";
import { FormSaveButton } from "@/components/admin/form-save-button";
import { getAllArticles } from "@/lib/data/articles";
import { createArticle } from "@/app/admin/blog/actions";

export const dynamic = "force-dynamic";

function when(article: { status: string; publishedAt: Date | null; updatedAt: Date }): string {
  const date = article.status === "PUBLISHED" ? article.publishedAt : article.updatedAt;
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminBlogPage() {
  const articles = await getAllArticles();

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Blog</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Write posts and publish them when they are ready. Drafts are only visible here.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-lg border border-border bg-white">
          {articles.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-soft">
              No posts yet. Write your first one on the right.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {articles.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/admin/blog/${article.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-subtle"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{article.title}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        /blog/{article.slug}
                        {article.tags.length > 0 && ` · ${article.tags.join(", ")}`}
                      </span>
                    </span>

                    <span className="flex-shrink-0 text-xs text-ink-faint">{when(article)}</span>

                    <span
                      className={
                        article.status === "PUBLISHED"
                          ? "flex-shrink-0 rounded-pill bg-emerald-bg px-2 py-0.5 text-xs font-medium text-emerald"
                          : "flex-shrink-0 rounded-pill bg-subtle px-2 py-0.5 text-xs font-medium text-ink-soft"
                      }
                    >
                      {article.status === "PUBLISHED" ? "Live" : "Draft"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          action={createArticle}
          className="h-fit space-y-3 rounded-lg border border-border bg-white p-5"
        >
          <h2 className="font-serif text-lg font-semibold">New post</h2>
          <input name="title" required placeholder="Title" className="input" />
          <p className="text-xs text-ink-soft">
            You can write the post and change its address on the next screen. Nothing is
            published until you say so.
          </p>
          <FormSaveButton idleLabel="Start writing" savingLabel="Creating…" savedLabel="Created" />
        </form>
      </div>
    </div>
  );
}
