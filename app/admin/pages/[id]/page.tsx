import { notFound, redirect } from "next/navigation";
import { PageCrumb } from "@/components/admin/page-crumb";
import { getPageById } from "@/lib/data/pages";
import { SectionList } from "@/components/admin/section-list";
import { PageSettingsForm } from "@/components/admin/page-settings-form";
import { SectionDivider } from "@/components/ui/primitives";
import { ExternalLinkIcon } from "@/components/ui/synora-marks";

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
      <PageCrumb label={page.title} />
      {/* A bare "/" told nobody anything. This is the page's address, and it opens it. */}
      <a
        href={page.slug === "home" ? "/" : `/p/${page.slug}`}
        target="_blank"
        rel="noreferrer"
        className="mb-2.5 inline-flex items-center gap-1.5 text-xs text-ink-soft underline-offset-2 hover:text-ink hover:underline"
      >
        <span className="font-mono">{page.slug === "home" ? "/" : `/p/${page.slug}`}</span>
        <ExternalLinkIcon className="h-3 w-3" />
      </a>

      <PageSettingsForm page={page} />

      <div className="mt-6">
        <SectionDivider
          title="Sections"
          description="Use the arrows (or drag, on desktop) to reorder. Click a section to edit it."
        />
        <div className="mt-4">
          <SectionList pageId={page.id} sections={page.sections} />
        </div>
      </div>
    </div>
  );
}
