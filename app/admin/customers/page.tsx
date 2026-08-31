import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { shopSession } from "@/lib/auth-guard";
import { listCustomers } from "@/lib/data/customers";
import { formatPKR } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/customers");

  const sp = await props.searchParams;
  const search = typeof sp.q === "string" ? sp.q : undefined;

  const customers = await listCustomers(search);

  const totals = customers.reduce(
    (acc, c) => ({
      spend: acc.spend + c.totalSpent,
      orders: acc.orders + c.orderCount,
      repeat: acc.repeat + (c.orderCount > 1 ? 1 : 0),
    }),
    { spend: 0, orders: 0, repeat: 0 }
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone who has bought from you or created an account, and what they're worth."
      />

      {customers.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Customers" value={customers.length} icon={Users} />
          <Stat
            label="Repeat buyers"
            value={totals.repeat}
            hint={
              customers.length > 0
                ? `${Math.round((totals.repeat / customers.length) * 100)}% of customers`
                : undefined
            }
          />
          <Stat label="Lifetime revenue" value={formatPKR(totals.spend)} />
        </div>
      )}

      {/* A plain GET form: the search survives a reload and is shareable, which
          a piece of client state would not be. */}
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search by name, email or phone"
          aria-label="Search customers"
          className="input max-w-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium transition-colors hover:bg-subtle"
        >
          Search
        </button>
        {search && (
          <Link
            href="/admin/customers"
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-subtle hover:text-ink"
          >
            Clear
          </Link>
        )}
      </form>

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
        <Card className="divide-y divide-border">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/admin/customers/${customer.id}`}
              className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-subtle"
            >
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink">
                  <span className="truncate">{customer.name}</span>
                  {customer.orderCount > 1 && <Badge tone="good">repeat</Badge>}
                  {!customer.hasAccount && <Badge>guest</Badge>}
                </p>
                <p className="mt-0.5 truncate text-xs text-ink-soft">
                  {customer.email}
                  {customer.phone ? ` · ${customer.phone}` : ""}
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-6 text-right">
                <div>
                  <p className="font-mono text-sm tabular-nums text-ink">
                    {formatPKR(customer.totalSpent)}
                  </p>
                  <p className="text-[11px] text-ink-faint">
                    {customer.orderCount} {customer.orderCount === 1 ? "order" : "orders"}
                  </p>
                </div>
                <p className="hidden w-24 text-[11px] text-ink-faint sm:block">
                  {customer.lastOrderAt
                    ? formatRelativeTime(customer.lastOrderAt)
                    : "never ordered"}
                </p>
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
