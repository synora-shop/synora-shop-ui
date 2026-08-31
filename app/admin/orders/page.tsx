import { cn } from "@/lib/utils";
import { db } from "@/lib/data/shop";
import { OrderList } from "@/components/admin/order-list";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { keepKnown, readFilter, whereIn } from "@/lib/filters";
import { orderStatusDotStyle } from "@/lib/order-status-style";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const status = keepKnown(readFilter(sp, "status"), STATUSES);

  const orders = await (await db()).order.findMany({
    where: { deletedAt: null, orderStatus: whereIn(status as never[]) },
    include: { items: { select: { price: true, costPrice: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
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
    <div>
      <h1 className="font-serif text-3xl font-semibold">Orders</h1>

      <FilterBar basePath="/admin/orders" groups={groups} filters={{ status }} />

      <OrderList orders={orders} />
    </div>
  );
}
