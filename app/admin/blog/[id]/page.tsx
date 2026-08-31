import Link from "next/link";
import { FormSaveButton } from "@/components/admin/form-save-button";
import { DestructiveButton } from "@/components/admin/destructive-button";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/data/articles";
import {
  deleteArticle,
  publishArticle,
  unpublishArticle,
  updateArticle,
} from "@/app/admin/blog/actions";

export const dynamic = "force-dynamic";

export default async function EditArticlePage(props: PageProps<"/admin/blog/[id]">) {
  const { id } = await props.params;
  const article = await getArticle(id);
  if (!article) notFound();

  const live = article.status === "PUBLISHED";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/blog" className="text-xs text-ink-soft hover:text-ink">
        Blog
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate font-serif text-3xl font-semibold">
          {article.title}
        </h1>

        {live ? (
          <>
            <a
              href={`/blog/${article.slug}`}
              target="_blank"
              rel="noopener"
              className="text-sm text-ink-soft hover:text-ink"
            >
              View
            </a>
            <form action={unpublishArticle.bind(null, article.id)}>
              <FormSaveButton
                idleLabel="Unpublish"
                savingLabel="Hiding…"
                savedLabel="Hidden"
                className="border border-border bg-transparent px-4 py-1.5 text-ink hover:bg-subtle"
              />
            </form>
          </>
        ) : (
          <form action={publishArticle.bind(null, article.id)}>
            <FormSaveButton
              idleLabel="Publish"
              savingLabel="Publishing…"
              savedLabel="Published"
              className="px-5 py-1.5"
            />
          </form>
        )}
      </div>

      <p className="mt-1 text-sm text-ink-soft">
        {live ? "This post is live." : "This post is a draft. Only you can see it."}
      </p>

      <form action={updateArticle.bind(null, article.id)} className="mt-8 space-y-5">
        <div>
          <label className="text-xs font-medium text-ink-soft" htmlFor="title">
            Title
          </label>
          <input id="title" name="title" required defaultValue={article.title} className="input mt-1" />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft" htmlFor="slug">
            Address
          </label>
          <input id="slug" name="slug" defaultValue={article.slug} className="input mt-1" />
          <p className="mt-1 text-xs text-ink-faint">
            /blog/{article.slug}
            {live && ". Changing this breaks any link already shared to this post."}
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft" htmlFor="excerpt">
            Summary
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={2}
            defaultValue={article.excerpt ?? ""}
            className="input mt-1"
          />
          <p className="mt-1 text-xs text-ink-faint">Shown in the list of posts, not on the post itself.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft" htmlFor="body">
            Post
          </label>
          <textarea
            id="body"
            name="body"
            rows={18}
            defaultValue={article.body}
            className="input mt-1 font-mono text-sm leading-relaxed"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-ink-soft" htmlFor="authorName">
              Author
            </label>
            <input
              id="authorName"
              name="authorName"
              defaultValue={article.authorName ?? ""}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft" htmlFor="tags">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              defaultValue={article.tags.join(", ")}
              placeholder="recipes, news"
              className="input mt-1"
            />
            <p className="mt-1 text-xs text-ink-faint">Separated by commas.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft" htmlFor="coverImage">
            Cover image
          </label>
          <input
            id="coverImage"
            name="coverImage"
            defaultValue={article.coverImage ?? ""}
            placeholder="https://..."
            className="input mt-1"
          />
        </div>

        <details className="rounded-lg border border-border p-4">
          <summary className="cursor-pointer text-sm font-medium">Search engines</summary>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-ink-soft" htmlFor="seoTitle">
                Title
              </label>
              <input
                id="seoTitle"
                name="seoTitle"
                defaultValue={article.seoTitle ?? ""}
                className="input mt-1"
              />
              <p className="mt-1 text-xs text-ink-faint">Leave empty to use the post title.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft" htmlFor="seoDescription">
                Description
              </label>
              <textarea
                id="seoDescription"
                name="seoDescription"
                rows={2}
                defaultValue={article.seoDescription ?? ""}
                className="input mt-1"
              />
              <p className="mt-1 text-xs text-ink-faint">Leave empty to use the summary.</p>
            </div>
          </div>
        </details>

        <div className="flex items-center gap-3 border-t border-border pt-5">
          <FormSaveButton />
        </div>
      </form>

      <div className="mt-10 border-t border-border pt-5">
        <DestructiveButton
          action={deleteArticle.bind(null, article.id)}
          title="Delete this post?"
          description={
            live
              ? "It is live, so anyone reading it will get a Not Found page. This cannot be undone."
              : "This cannot be undone."
          }
        >
          Delete this post
        </DestructiveButton>
      </div>
    </div>
  );
}
