import { getAllPages } from "@/lib/data/pages";
import { createPage } from "@/app/admin/pages/actions";
import { PageList } from "@/components/admin/page-list";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  // Collection pages (auto-created per Category) live here too, but they have no Sections
  // to edit and are deleted only by deleting their Category — manage them from Categories,
  // not this list.
  const pages = (await getAllPages()).filter((p) => !p.categoryId);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">Pages</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Add, hide, and reorder the sections that make up each page, like the homepage layout.
        Collection pages are managed from Categories instead.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <PageList pages={pages} />

        <form action={createPage} className="h-fit space-y-3 rounded-lg border border-border bg-white p-5">
          <h2 className="font-serif text-lg font-semibold">Add Page</h2>
          <input name="title" required placeholder="Title (e.g. Shipping Policy)" className="input" />
          <input name="slug" placeholder="URL slug (auto-generated if left blank)" className="input" />
          <p className="text-xs text-ink-soft">Add it to the header or footer menu from the Menus page.</p>
          <button
            type="submit"
            className="rounded-full bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Add Page
          </button>
        </form>
      </div>
    </div>
  );
}
