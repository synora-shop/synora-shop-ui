import { Download, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { db } from "@/lib/data/shop";
import { getStoreSettings } from "@/lib/data/settings";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { OrderList } from "@/components/admin/order-list";

import { PlainHeading, SortHeading } from "@/components/admin/sort-heading";
import { FilterBar, type FilterGroup } from "@/components/admin/filter-bar";
import { activeCount, keepKnown, readFilter, whereIn } from "@/lib/filters";
import { readPaging } from "@/lib/paging";
import { ORDER_SORTS, readSort } from "@/lib/sorting";
import { orderStatusDotStyle, statusLabel } from "@/lib/order-status-style";
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

  const [total, stageRows] = await Promise.all([
    (await db()).order.count({ where }),
    // The pipeline across the top counts every order at each stage, whatever
    // the search: it is where the shop stands, not what this list shows.
    (await db()).order.groupBy({ by: ["orderStatus"], where: { deletedAt: null }, _count: true }),
  ]);
  const stageCount = Object.fromEntries(stageRows.map((r) => [r.orderStatus, r._count])) as Record<string, number>;
  const { skip, take } = readPaging(sp, total);
  const sort = readSort(sp, ORDER_SORTS);

  const orders = await (await db()).order.findMany({
    where,
    select: {
      id: true, customerName: true, shippingCity: true, createdAt: true,
      total: true, paymentMethod: true, paymentStatus: true, orderStatus: true, notes: true,
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

  const stageHref = (st: string) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    const raw = sp.sort;
    if (typeof raw === "string") qs.set("sort", raw);
    if (!(status.length === 1 && status[0] === st)) qs.set("status", st);
    const query = qs.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  };
  const heading = (label: string, asc: string, desc: string, align?: "right") => (
    <SortHeading label={label} asc={asc} desc={desc} current={sort.value} basePath="/admin/orders" searchParams={sp} options={ORDER_SORTS} align={align} />
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orders"
        description="Every order, where it is on its way, and what it needs from you next."
        actions={
          <>
            <ImportDialog
              noun="order"
              plural="orders"
              blurb="A Shopify order export, or one from here. Orders already here are skipped rather than overwritten — an order is a record of something that happened. Nothing is emailed and no stock moves."
              matchedBy="order number"
              overwriteWarning="Orders already here are left exactly as they are. Only the ones this file brings are written."
              plan={planOrderImport}
              apply={applyOrderImport}
            />
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a download, not a page: <Link> would prefetch the CSV and hand the browser a file it never asked for */}
            <a href="/admin/orders/export" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3.5 text-[13.5px] font-semibold text-[#0a0a0a] ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            <Link href="/admin/orders/drafts/new" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0a0a0a] px-3.5 text-[13.5px] font-semibold text-white">
              <Plus className="h-4 w-4" />
              Create order
            </Link>
          </>
        }
      />

      {/* The pipeline: every stage, counted, and each one a filter. */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STATUSES.map((st, i) => {
          const on = status.length === 1 && status[0] === st;
          const n = stageCount[st] ?? 0;
          return (
            <Link
              key={st}
              href={stageHref(st)}
              aria-current={on ? "true" : undefined}
              className={cn(
                "relative overflow-hidden rounded-2xl px-4 py-3 transition-shadow",
                on ? "bg-[#0a0a0a] text-white" : "bg-white text-[#0a0a0a] ring-1 ring-[#0a0a0a]/[0.07] hover:ring-[#0a0a0a]/20"
              )}
            >
              <span className={cn("block text-[12px] font-medium", on ? "text-white/60" : "text-[#0a0a0a]/50")}>{i < 5 ? `${i + 1}. ` : ""}{statusLabel(st)}</span>
              <span className="mt-0.5 block text-[22px] font-semibold tabular-nums">{n}</span>
              {st === "PENDING" && n > 0 && !on && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#f2a33a]" />}
              <span aria-hidden className={cn("absolute inset-x-4 bottom-0 h-[3px] rounded-t-full", STAGE_BAR[st])} />
            </Link>
          );
        })}
      </div>

      <ActionBar>
        <ListSearch placeholder="Search by order number, name, email or phone" />
        <FilterDisclosure activeCount={activeCount({ status })}>
          <FilterBar basePath="/admin/orders" groups={groups} filters={{ status }} />
        </FilterDisclosure>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PerPageSelect basePath="/admin/orders" searchParams={sp} total={total} />
        </div>
      </ActionBar>

      <OrderList
        filtered={q.length > 0 || activeCount({ status }) > 0}
        head={
          <>
            {heading("Order", "id", "id-desc")}
            {heading("Customer", "customer", "customer-desc")}
            {heading("Placed", "oldest", "newest")}
            <PlainHeading>Payment</PlainHeading>
            {heading("Total", "total", "total-desc", "right")}
            {heading("Stage", "status", "status-desc")}
          </>
        }
        orders={orders.map((o) => ({
          ...o,
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

const STAGE_BAR: Record<string, string> = {
  PENDING: "bg-[#f2a33a]", CONFIRMED: "bg-[#6666ff]", PACKED: "bg-[#b7b9ff]",
  SHIPPED: "bg-[#8cc8f5]", DELIVERED: "bg-[#6fd6a8]", CANCELLED: "bg-[#0a0a0a]/15",
};
