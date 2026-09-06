import { Inbox } from "lucide-react";
import { db } from "@/lib/data/shop";
import type { EnquiryStatus } from "@/lib/generated/prisma/client";
import { PageHeader, EmptyState } from "@/components/ui/primitives";
import { EnquiryList } from "@/components/admin/enquiry-list";
import { parseCustomFields } from "@/lib/product-kind";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { activeCount, keepKnown, readFilter, whereIn } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
import { ENQUIRY_SORTS, readSort, sortHref } from "@/lib/sorting";
import { SortMenu } from "@/components/admin/sort-menu";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { FilterDisclosure } from "@/components/admin/filter-disclosure";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "QUOTED", label: "Quoted" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

/** What an untouched inbox shows: the ones still needing an answer. */
const OPEN: EnquiryStatus[] = ["NEW", "IN_PROGRESS", "QUOTED"];

export default async function EnquiriesPage(props: PageProps<"/admin/enquiries">) {
  const sp = await props.searchParams;
  const status = keepKnown(readFilter(sp, "status"), STATUSES.map((s) => s.value)) as EnquiryStatus[];

  // Nothing chosen keeps the old default — an inbox that opens on Won and Lost
  // buries the ones that still need an answer. Choosing any status replaces
  // that default outright, so what is on screen always matches the chips.
  const q = readFilter(sp, "q")[0] ?? "";
  const where = {
    ...(status.length > 0 ? { status: whereIn(status) } : { status: { in: OPEN } }),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { productTitle: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // The list used to stop at a hard `take: 100`, which is a cliff rather than a
  // page: the hundred and first enquiry simply was not in the admin.
  const total = await (await db()).enquiry.count({ where });
  const { skip, take } = readPaging(sp, total);
  const sort = readSort(sp, ENQUIRY_SORTS);

  const [enquiries, counts] = await Promise.all([
    (await db()).enquiry.findMany({
      where,
      orderBy: sort.orderBy as { createdAt: "desc" },
      skip,
      take,
      include: { product: { select: { slug: true, customFields: true } } },
    }),
    (await db()).enquiry.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (value: string) => counts.find((c) => c.status === value)?._count ?? 0;

  const groups: FilterGroup[] = [
    {
      key: "status",
      label: "Status",
      options: STATUSES.map((s) => ({
        value: s.value,
        label: `${s.label} (${countFor(s.value)})`,
      })),
    },
  ];

  // The field definitions live on the product, so labels are resolved here
  // rather than storing them on every enquiry. An enquiry whose product was
  // deleted keeps its answers and simply shows them by key.
  const rows = enquiries.map((e) => ({
    id: e.id,
    productTitle: e.productTitle,
    productSlug: e.product?.slug ?? null,
    name: e.name,
    email: e.email,
    phone: e.phone,
    company: e.company,
    quantity: e.quantity,
    message: e.message,
    notes: e.notes,
    status: e.status,
    createdAt: e.createdAt.toISOString(),
    details: (e.details ?? {}) as Record<string, string>,
    fields: parseCustomFields(e.product?.customFields),
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Enquiries"
        description="Questions about bulk and made-to-order products. These aren't orders, nothing has been paid for yet."
      />

      <ActionBar>
        <ListSearch placeholder="Search enquiries" />
        <FilterDisclosure activeCount={activeCount({ status })}>
          <FilterBar basePath="/admin/enquiries" groups={groups} filters={{ status }} />
          {status.length === 0 && (
            <p className="mt-2 text-xs text-ink-faint">
              Showing enquiries that still need an answer. Pick any status above to change that.
            </p>
          )}
        </FilterDisclosure>
        <SortMenu
          current={sort.value}
          options={ENQUIRY_SORTS.map((o) => ({
            value: o.value,
            label: o.label,
            href: sortHref("/admin/enquiries", sp, o.value, ENQUIRY_SORTS),
          }))}
        />
        <div className="ml-auto">
          <PerPageSelect basePath="/admin/enquiries" searchParams={sp} total={total} />
        </div>
      </ActionBar>

      {rows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status.length === 0 ? "No open enquiries" : "Nothing here"}
          description={
            status.length === 0
              ? "When someone asks about a bulk or made-to-order product, it lands here."
              : "No enquiries match these filters."
          }
        />
      ) : (
        <>
          <EnquiryList enquiries={rows} />
          <PaginationBar basePath="/admin/enquiries" searchParams={sp} total={total} />
        </>
      )}
    </div>
  );
}
