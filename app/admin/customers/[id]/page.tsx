import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { shopSession } from "@/lib/auth-guard";
import { getCustomer } from "@/lib/data/customers";
import { formatPKR } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { orderStatusStyle } from "@/lib/order-status-style";
import { Badge, Card, PageHeader, Stat } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerPage(props: PageProps<"/admin/customers/[id]">) {
  const me = await shopSession();
  if (!me) redirect("/merchant/login?callbackUrl=/admin/customers");

  const { id } = await props.params;
  const customer = await getCustomer(id);
  // getCustomer reads through the scoped client, so another shop's customer id
  // simply isn't found rather than being refused — which is the same answer.
  if (!customer) notFound();

  const counted = customer.orders.filter((o) => o.orderStatus !== "CANCELLED");
  const totalSpent = counted.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        All customers
      </Link>

      <PageHeader
        title={customer.name}
        description={
          customer.hasAccount
            ? "Has an account on your store."
            : "Checked out as a guest, no account, no password."
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={counted.length} />
        <Stat label="Spent" value={formatPKR(totalSpent)} />
        <Stat
          label="Average order"
          value={counted.length > 0 ? formatPKR(Math.round(totalSpent / counted.length)) : ","}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-6">
          <Card className="p-4">
            <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint">
              Contact
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                <dd className="min-w-0 break-words">
                  {/* Mailing a customer is the most common next action after
                      looking one up, so it is a link rather than text to copy. */}
                  <a href={`mailto:${customer.email}`} className="text-brand-600 hover:underline">
                    {customer.email}
                  </a>
                </dd>
              </div>
              {customer.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                  <dd>
                    <a href={`tel:${customer.phone}`} className="text-brand-600 hover:underline">
                      {customer.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-3 text-[11px] text-ink-faint">
              First seen {formatRelativeTime(customer.createdAt)}
            </p>
          </Card>

          {customer.addresses.length > 0 && (
            <Card className="p-4">
              <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Saved addresses
              </h2>
              <ul className="mt-3 space-y-3 text-sm">
                {customer.addresses.map((address) => (
                  <li key={address.id} className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-faint" />
                    <span className="leading-snug text-ink-soft">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                      <br />
                      {address.city}, {address.province}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Order history ({customer.orders.length})
          </h2>
          {customer.orders.length === 0 ? (
            <Card className="p-6 text-center text-sm text-ink-soft">
              They have an account but haven&rsquo;t ordered yet.
            </Card>
          ) : (
            <Card className="divide-y divide-border">
              {customer.orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-subtle"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <span className="font-mono">{order.id}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          orderStatusStyle(order.orderStatus)
                        )}
                      >
                        {order.orderStatus.toLowerCase()}
                      </span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-soft">
                      {order.items.map((i) => `${i.title} ×${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm tabular-nums text-ink">
                      {formatPKR(order.total)}
                    </p>
                    <p className="text-[11px] text-ink-faint">
                      {formatRelativeTime(order.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
