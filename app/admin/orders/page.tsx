import { Download } from "lucide-react";
import { buttonClass } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { db } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { OrderList } from "@/components/admin/order-list";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { activeCount, keepKnown, readFilter, whereIn } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
import { ORDER_SORTS, readSort, sortHref } from "@/lib/sorting";
import { SortMenu } from "@/components/admin/sort-menu";
import { orderStatusDotStyle } from "@/lib/order-status-style";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { FilterDisclosure } from "@/components/admin/filter-disclosure";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { ImportDialog } from "@/components/admin/import-dialog";
import { applyOrderImport, planOrderImport } from "@/app/admin/orders/import/actions";
import { releaseExpiredForShop } from "@/lib/payments/reservations";
import { currentShopId } from "@/lib/data/shop";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  const sp = await props.searchParams;
  const { timeZone } = await getStoreSettings();

  // Give back stock held by online payments nobody finished.
  //
  // Here as well as at checkout because this is the other screen where a stale
  // reservation misleads someone: a merchant looking at their orders should not
  // see a list of pending sales that no longer exist, nor a stock figure that
  // is quietly short. The scheduled sweep runs once a day, which is all the
  // plan allows, so the work is done where it is noticed.
  await releaseExpiredForShop(await currentShopId()).catch(() => {});
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
  const sort = readSort(sp, ORDER_SORTS);

  const orders = await (await db()).order.findMany({
    where,
    select: {
      id: true, customerName: true, shippingCity: true, createdAt: true,
      total: true, paymentMethod: true, orderStatus: true,
      items: { select: { price: true, costPrice: true, quantity: true } },
    },
    orderBy: sort.orderBy as { createdAt: "desc" },
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
    <div className="space-y-2.5">
      <ActionBar>
        <ListSearch placeholder="Search by order number, name, email or phone" />
        <FilterDisclosure activeCount={activeCount({ status })}>
          <FilterBar basePath="/admin/orders" groups={groups} filters={{ status }} />
        </FilterDisclosure>
        <SortMenu
          current={sort.value}
          options={ORDER_SORTS.map((o) => ({
            value: o.value,
            label: o.label,
            href: sortHref("/admin/orders", sp, o.value, ORDER_SORTS),
          }))}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PerPageSelect basePath="/admin/orders" searchParams={sp} total={total} />
          {/* Shopify exports orders and cannot import them, which is why a
              merchant moving between platforms loses their history. */}
          <ImportDialog
            noun="order"
            plural="orders"
            blurb="A Shopify order export, or one from here. Orders already here are skipped rather than overwritten — an order is a record of something that happened. Nothing is emailed and no stock moves."
            matchedBy="order number"
            overwriteWarning="Orders already here are left exactly as they are. Only the ones this file brings are written."
            plan={planOrderImport}
            apply={applyOrderImport}
          />
          <a href="/admin/orders/export" className={buttonClass("secondary", "sm")}>
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </ActionBar>

      <OrderList
        filtered={q.length > 0 || activeCount({ status }) > 0}
        orders={orders.map((o) => ({
          ...o,
          // Written out here rather than in the row: a client component
          // formatting a date disagrees with the server that rendered it.
          placed: formatRelativeTime(o.createdAt),
          placedExact: new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium", timeStyle: "short", timeZone,
          }).format(o.createdAt),
        }))}
      />

      <PaginationBar basePath="/admin/orders" searchParams={sp} total={total} />
    </div>
  );
}
