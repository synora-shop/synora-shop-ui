import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, Users } from "lucide-react";
import { shopSession } from "@/lib/auth-guard";
import { listCustomers } from "@/lib/data/customers";

import { formatRelativeTime } from "@/lib/format-relative-time";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { Figures, StatePill } from "@/components/admin/kit";
import { SortHeading } from "@/components/admin/sort-heading";
import { AddCustomer } from "@/components/admin/add-customer";
import { startOfMonth } from "@/lib/abandoned";
import { ActionBar } from "@/components/admin/action-bar";
import { ListSearch } from "@/components/admin/list-search";
import { PerPageSelect } from "@/components/admin/per-page-select";
import { PaginationBar } from "@/components/admin/pagination-bar";
import { readPaging } from "@/lib/paging";
import { CUSTOMER_SORTS, compareCustomers } from "@/lib/sorting";
import { formatMoney } from "@/lib/money";
import { getCurrency } from "@/lib/data/settings";
import { ImportDialog } from "@/components/admin/import-dialog";
import { applyCustomerImport, planCustomerImport } from "@/app/admin/customers/import/actions";

export const dynamic = "force-dynamic";

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  // Prices in the store's own currency rather than in rupees, which every
  // screen printed regardless of what Settings said.
  const currency = await getCurrency();
  const money = (n: number) => formatMoney(n, currency);
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/customers");

  const sp = await props.searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;

  const all = await listCustomers(search);

  // Sorted here, not by the database: lifetime spend is the sum of a customer's
  // orders, a number no column holds. Every customer has to be read and
  // totalled before they can be put in order — see lib/sorting.ts.
  const sortValue =
    CUSTOMER_SORTS.find((o) => o.value === (typeof sp.sort === "string" ? sp.sort : ""))?.value ??
    CUSTOMER_SORTS[0].value;
  all.sort(compareCustomers(sortValue));

  // Sliced here rather than in the query, because the order is by lifetime
  // spend — a number the database does not hold, since it is the sum of an
  // order list. Every customer has to be read to sort them, and the totals
  // above the list are across all of them, not across this page.
  // The design's tabs (new admin, 15 October): everyone, the ones who came
  // back, the shop's own biggest city, the ones gone quiet, and the ones with
  // accounts. Applied after sorting, so every tab keeps the column order.
  const cityCounts = all.reduce<Record<string, number>>((m, c) => (c.city ? { ...m, [c.city]: (m[c.city] ?? 0) + 1 } : m), {});
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const quietSince = daysAgo(60);
  const VIEWS = [
    { key: "all", label: "All", keep: () => true },
    { key: "returning", label: "Returning", keep: (c: (typeof all)[number]) => c.orderCount > 1 },
    ...(topCity ? [{ key: "city", label: `From ${topCity}`, keep: (c: (typeof all)[number]) => c.city === topCity }] : []),
    { key: "quiet", label: "Not ordered in 60 days", keep: (c: (typeof all)[number]) => !c.lastOrderAt || c.lastOrderAt < quietSince },
    { key: "accounts", label: "With accounts", keep: (c: (typeof all)[number]) => c.hasAccount },
  ];
  const view = VIEWS.find((v) => v.key === sp.view) ?? VIEWS[0];
  const shown = all.filter(view.keep);
  const viewHref = (key: string) => {
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (typeof sp.sort === "string") qs.set("sort", sp.sort);
    if (key !== "all") qs.set("view", key);
    const query = qs.toString();
    return query ? `/admin/customers?${query}` : "/admin/customers";
  };

  const { skip, take } = readPaging(sp, shown.length);
  const customers = take === undefined ? shown : shown.slice(skip, skip + take);

  const totals = all.reduce(
    (acc, c) => ({
      spend: acc.spend + c.totalSpent,
      orders: acc.orders + c.orderCount,
      repeat: acc.repeat + (c.orderCount > 1 ? 1 : 0),
    }),
    { spend: 0, orders: 0, repeat: 0 }
  );

  const withAccounts = all.filter((c) => c.hasAccount).length;
  const thisMonth = startOfMonth();
  const lastMonth = startOfMonth(new Date(thisMonth.getTime() - 86_400_000));
  const newThisMonth = all.filter((c) => c.createdAt >= thisMonth).length;
  const newLastMonth = all.filter((c) => c.createdAt >= lastMonth && c.createdAt < thisMonth).length;
  const heading = (label: string, asc: string, desc: string, align?: "right") => (
    <SortHeading label={label} asc={asc} desc={desc} current={sortValue} basePath="/admin/customers" searchParams={sp} options={CUSTOMER_SORTS} align={align} />
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Customers"
        description="Everyone who has bought from you or created an account, and what they're worth."
        actions={
          <>
            {/* A list this personal should be a merchant's to take with them,
                and theirs to bring in. Both, or neither. */}
            <ImportDialog
              noun="customer"
              plural="customers"
              blurb="A Shopify customer CSV, or one exported from here. People are matched by email address: an address you already have is updated, one you do not is added."
              matchedBy="email address"
              overwriteWarning="Overwriting changes a person's name, phone and address. It never touches their password or their orders."
              plan={planCustomerImport}
              apply={applyCustomerImport}
            />
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a download, not a page: <Link> would prefetch the CSV and hand the browser a file it never asked for */}
            <a href="/admin/customers/export" className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3.5 text-[13.5px] font-semibold text-[#0a0a0a] ring-1 ring-[#0a0a0a]/12 hover:bg-[#f5f5f5]">
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            <AddCustomer />
          </>
        }
      />

      {all.length > 0 && (
        <Figures
          items={[
            { label: "Customers", value: all.length.toLocaleString("en-PK") },
            { label: "With accounts", value: withAccounts.toLocaleString("en-PK") },
            { label: "Came back to buy again", value: `${Math.round((totals.repeat / all.length) * 100)}%`, delta: `${totals.repeat} of ${all.length}` },
            {
              label: "New this month",
              value: newThisMonth.toLocaleString("en-PK"),
              delta: `${newThisMonth - newLastMonth >= 0 ? "+" : ""}${newThisMonth - newLastMonth} on last month`,
              down: newThisMonth < newLastMonth,
            },
          ]}
        />
      )}

      <ActionBar>
        <nav aria-label="Views" className="flex gap-1 overflow-x-auto">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={viewHref(v.key)}
              aria-current={v.key === view.key ? "true" : undefined}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold ${v.key === view.key ? "bg-[#0a0a0a] text-white" : "text-[#0a0a0a]/55 hover:bg-[#0a0a0a]/[0.05] hover:text-[#0a0a0a]"}`}
            >
              {v.label}
            </Link>
          ))}
        </nav>
        <ListSearch placeholder="Search by name, email or phone" />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <PerPageSelect basePath="/admin/customers" searchParams={sp} total={shown.length} />
        </div>
      </ActionBar>

      {customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? `No customers match "${search}"` : "No customers yet"}
          description={
            search
              ? "Try a different name, email or phone number."
              : "Anyone who checks out appears here automatically, they don't need to create an account first."
          }
        />
      ) : (
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0a0a0a]/[0.07]">
          <div role="row" className={`hidden items-center gap-4 bg-[#0a0a0a] px-4 py-1.5 lg:grid ${CUSTOMER_GRID}`}>
            {heading("Customer", "name", "name-desc")}
            {heading("Email", "email", "email-desc")}
            {heading("City", "city", "city-desc")}
            <span role="columnheader" className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-white/55">Account</span>
            {heading("Orders", "orders-low", "orders", "right")}
            {heading("Spent", "spend-low", "spend", "right")}
          </div>
          <div className="divide-y divide-[#0a0a0a]/[0.06]">
            {customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-[#fafafa] lg:grid ${CUSTOMER_GRID}`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c8e7ff] text-[12px] font-semibold text-[#0a0a0a]">{initialsOf(customer.name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-medium text-[#0a0a0a]">{customer.name}</span>
                    {customer.orderCount > 1 && <span className="block text-[12px] font-semibold text-[#1d7a52]">Comes back</span>}
                  </span>
                </span>
                <span className="min-w-0 basis-full truncate text-[13px] text-[#0a0a0a]/60 lg:basis-auto">
                  {customer.email}
                  {customer.phone ? <span className="block text-[12px] text-[#0a0a0a]/45">{customer.phone}</span> : null}
                </span>
                <span className="text-[13.5px] text-[#0a0a0a]/70">{customer.city || <span className="text-[#0a0a0a]/35">Not known</span>}</span>
                <span>{customer.hasAccount ? <StatePill tone="good">Signed up</StatePill> : <StatePill tone="off">Guest</StatePill>}</span>
                <span className="text-[14px] tabular-nums text-[#0a0a0a] lg:text-right" title={customer.lastOrderAt ? `Last ordered ${formatRelativeTime(customer.lastOrderAt)}` : "Never ordered"}>{customer.orderCount} <span className="text-[#0a0a0a]/45 lg:hidden">orders</span></span>
                <span className="text-[14px] font-semibold tabular-nums text-[#0a0a0a] lg:text-right">{money(customer.totalSpent)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <PaginationBar basePath="/admin/customers" searchParams={sp} total={shown.length} />
    </div>
  );
}

const CUSTOMER_GRID = "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_7rem_7rem_4.5rem_7.5rem]";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** A moment some days back, kept out of the render body. */
function daysAgo(days: number): Date {
  return new Date(new Date().getTime() - days * 86_400_000);
}
