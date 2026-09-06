import { db } from "@/lib/data/shop";
import { readFilter } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
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

  const assets = await prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: "desc" },
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
      />

      <PaginationBar basePath="/admin/data" searchParams={sp} total={total} />
    </div>
  );
}
