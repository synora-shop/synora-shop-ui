import { cn } from "@/lib/utils";
import { db } from "@/lib/data/shop";
import { OrderList } from "@/components/admin/order-list";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { activeCount, keepKnown, readFilter, whereIn } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
import { orderStatusDotStyle } from "@/lib/order-status-style";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { FilterDisclosure } from "@/components/admin/filter-disclosure";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const status = keepKnown(readFilter(sp, "status"), STATUSES);

  // An order is looked for by its number, or by whoever placed it. Those are
  // the only three things a merchant has to hand when the phone rings.
  const q = readFilter(sp, "q")[0] ?? "";
  const where = {
    deletedAt: null,
    orderStatus: whereIn(status as never[]),
    ...(q
      ? {
          OR: [
            { id: { contains: q, mode: "insensitive" as const } },
            { customerName: { contains: q, mode: "insensitive" as const } },
            { customerEmail: { contains: q, mode: "insensitive" as const } },
            { customerPhone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const total = await (await db()).order.count({ where });
  const { skip, take } = readPaging(sp, total);

  const orders = await (await db()).order.findMany({
    where,
    include: { items: { select: { price: true, costPrice: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  const groups: FilterGroup[] = [
    {
      key: "status",
      label: "Status",
      options: STATUSES.map((s) => ({
        value: s,
        label: s,
        mark: <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", orderStatusDotStyle(s))} />,
      })),
    },
  ];

  return (
    <div className="space-y-4">
      <ActionBar>
        <ListSearch placeholder="Search by order number, name, email or phone" />
        <FilterDisclosure activeCount={activeCount({ status })}>
          <FilterBar basePath="/admin/orders" groups={groups} filters={{ status }} />
        </FilterDisclosure>
        <div className="ml-auto">
          <PerPageSelect basePath="/admin/orders" searchParams={sp} total={total} />
        </div>
      </ActionBar>

      <OrderList orders={orders} />

      <PaginationBar basePath="/admin/orders" searchParams={sp} total={total} />
    </div>
  );
}
