import { PageHeader } from "@/components/ui/primitives";
import { notFound, redirect } from "next/navigation";
import { PageCrumb } from "@/components/admin/page-crumb";
import { getPageById } from "@/lib/data/pages";
import { SectionList } from "@/components/admin/section-list";
import { PageSettingsForm } from "@/components/admin/page-settings-form";
import { SectionDivider } from "@/components/ui/primitives";
import { ExternalLinkIcon } from "@/components/ui/synora-marks";
import { pageAddress } from "@/lib/page-address";

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
      <PageHeader
        title={page.title}
        crumbs={[{ label: "Pages", href: "/admin/pages" }]}
        meta={
          // A bare "/" told nobody anything. This is the page's address, and it opens it.
          <a href={pageAddress(page.slug, page.systemKey)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] text-[#0a0a0a]/55 underline-offset-2 hover:text-[#0a0a0a] hover:underline">
            <span className="font-mono">{pageAddress(page.slug, page.systemKey)}</span>
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        }
      />

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
