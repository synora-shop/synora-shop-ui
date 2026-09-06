import { db } from "@/lib/data/shop";
import { readFilter } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
import { MEDIA_SORTS, readSort, sortHref } from "@/lib/sorting";
import { SortMenu } from "@/components/admin/sort-menu";
import { ViewToggle, readView } from "@/components/admin/view-toggle";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { MediaLibrary } from "@/components/admin/media-library";
import { PageHeader } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

/**
 * Data — every picture this shop has uploaded.
 *
 * The files were always there; nothing was ever written down about them, so a
 * photo could only be found again by opening whatever it was attached to, and
 * a photo attached to nothing could not be found at all. It was in storage,
 * being paid for, and invisible.
 *
 * Only uploads made from now on appear. Older ones cannot be recovered into
 * this list: there is no record anywhere of which shop they belong to, which is
 * exactly the gap this table closes. They keep working where they are used.
 */
export default async function DataPage(props: PageProps<"/admin/data">) {
  const sp = await props.searchParams;
  const q = readFilter(sp, "q")[0] ?? "";

  const prisma = await db();
  const where = q
    ? { OR: [{ filename: { contains: q, mode: "insensitive" as const } }, { folder: { contains: q, mode: "insensitive" as const } }] }
    : {};

  const total = await prisma.mediaAsset.count({ where });
  const { skip, take } = readPaging(sp, total);
  const sort = readSort(sp, MEDIA_SORTS);
  // Pictures start as tiles. A library of filenames tells a merchant nothing —
  // the only reliable way to find "the one with the blue background" is to see
  // it — but the row view is there for when the name is what matters.
  const view = readView(sp, "grid");

  const assets = await prisma.mediaAsset.findMany({
    where,
    orderBy: sort.orderBy as { createdAt: "desc" },
    skip,
    take,
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Data"
        description="Every picture you have uploaded, in one place. Use one again without uploading it twice."
      />

      <ActionBar>
        <ListSearch placeholder="Search files" />
        <SortMenu
          current={sort.value}
          options={MEDIA_SORTS.map((o) => ({
            value: o.value,
            label: o.label,
            href: sortHref("/admin/data", sp, o.value, MEDIA_SORTS),
          }))}
        />
        <ViewToggle basePath="/admin/data" searchParams={sp} current={view} fallback="grid" />
        <div className="ml-auto flex items-center gap-2">
          <PerPageSelect basePath="/admin/data" searchParams={sp} total={total} />
        </div>
      </ActionBar>

      <MediaLibrary
        assets={assets.map((a) => ({
          id: a.id,
          url: a.url,
          filename: a.filename,
          format: a.format,
          size: a.size,
          folder: a.folder,
          uploadedAt: a.createdAt.toISOString(),
        }))}
        searching={q.length > 0}
        view={view}
      />

      <PaginationBar basePath="/admin/data" searchParams={sp} total={total} />
    </div>
  );
}
