import { getAllPages } from "@/lib/data/pages";
import { buttonClass } from "@/components/ui/primitives";
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
      <p className="text-sm text-ink-soft">
        Add, hide, and reorder the sections that make up each page, like the homepage layout.
        Collection pages are managed from Categories instead.
      </p>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
        <PageList pages={pages.map((p) => ({ ...p, sections: p._count.sections }))} />

        <form action={createPage} className="h-fit space-y-3 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">Add a page</h2>
          <input name="title" required placeholder="Title (e.g. Shipping Policy)" className="input" />
          <input name="slug" placeholder="URL slug (auto-generated if left blank)" className="input" />
          <p className="text-xs text-ink-soft">Add it to the header or footer menu from the Menus page.</p>
          <button
            type="submit"
            className={buttonClass("primary", "md")}
          >
            Add Page
          </button>
        </form>
      </div>
    </div>
  );
}
