import Link from "next/link";
import { Status, T, pkr } from "@/components/next-admin/ui";
import { Table } from "@/components/next-admin/table";
import { A } from "@/components/next-admin/nav";
import { CUSTOMERS, slugOf } from "@/lib/new-admin/sample";

/** Customers (third design): one line each, sortable, with the usual views. */
export function CustomersTable({ accountsOnly = false }: { accountsOnly?: boolean }) {
  const rows = accountsOnly ? CUSTOMERS.filter((c) => c.account) : CUSTOMERS;
  return (
    <Table
      minWidth={680}
      views={accountsOnly ? undefined : ["All", "Returning", "From Lahore", "With accounts"]}
      search="Search by name, email or city"
      cols={[
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "city", label: "City" },
        { key: "account", label: "Account" },
        { key: "since", label: "Since" },
        { key: "orders", label: "Orders", right: true },
        { key: "spent", label: "Spent", right: true },
      ]}
      rows={rows.map((c) => ({
        id: c.email,
        views: [...(c.orders > 1 ? ["Returning"] : []), ...(c.city === "Lahore" ? ["From Lahore"] : []), ...(c.account ? ["With accounts"] : [])],
        by: { name: c.name, email: c.email, city: c.city, account: c.account ? "Signed up" : "Guest", since: c.since, orders: c.orders, spent: c.spent },
        cells: {
          name: (
            <Link href={`${A}/customers/${slugOf(c.name)}`} className="font-medium hover:underline">
              {c.name}{c.orders > 2 && <span className="ml-1.5 text-[11.5px] font-semibold text-[#4b4bea]">Regular</span>}
            </Link>
          ),
          email: <span className={T.muted}>{c.email}</span>,
          city: c.city,
          account: c.account ? <Status tone="good">Signed up</Status> : <Status tone="off">Guest</Status>,
          since: <span className={T.muted}>{c.since}</span>,
          orders: <span className="tabular-nums">{c.orders}</span>,
          spent: <b className="font-semibold tabular-nums">{pkr(c.spent)}</b>,
        },
      }))}
    />
  );
}
