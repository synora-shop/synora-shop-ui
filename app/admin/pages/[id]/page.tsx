import { notFound, redirect } from "next/navigation";
import { getPageById } from "@/lib/data/pages";
import { SectionList } from "@/components/admin/section-list";
import { PageSettingsForm } from "@/components/admin/page-settings-form";

export const dynamic = "force-dynamic";

export default async function EditPagePage(props: PageProps<"/admin/pages/[id]">) {
  const { id } = await props.params;
  const page = await getPageById(id);
  if (!page) notFound();
  // Collection pages have no Sections to edit and are managed entirely from Categories
  // (rename/delete there) — this route is only ever reached by guessing the URL, since the
  // Pages list already excludes them.
  if (page.categoryId) redirect("/admin/categories");

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold">{page.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">{page.slug === "home" ? "/" : `/p/${page.slug}`}</p>

      <PageSettingsForm page={page} />

      <div className="mt-8">
        <h2 className="font-serif text-lg font-semibold">Sections</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Use the arrows (or drag, on desktop) to reorder. Click a section to edit it.
        </p>
        <div className="mt-4">
          <SectionList pageId={page.id} sections={page.sections} />
        </div>
      </div>
    </div>
  );
}
