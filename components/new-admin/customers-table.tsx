import { ListBar, Pill, pkr } from "@/components/new-admin/ui";
import { DataTable } from "@/components/new-admin/sort";
import { CUSTOMERS } from "@/lib/new-admin/sample";

export function CustomersTable({ accountsOnly = false }: { accountsOnly?: boolean }) {
  const rows = accountsOnly ? CUSTOMERS.filter((c) => c.account) : CUSTOMERS;
  return (
    <DataTable
      minWidth={680}
      toolbar={<div className="-m-3"><ListBar views={accountsOnly ? ["With accounts"] : ["All", "Returning", "From Lahore", "Not ordered in 60 days"]} placeholder="Search by name, email or city" /></div>}
      cols={[
        { key: "name", label: "Customer" },
        { key: "email", label: "Email" },
        { key: "city", label: "City" },
        { key: "account", label: "Account" },
        { key: "orders", label: "Orders", align: "right", numeric: true },
        { key: "spent", label: "Spent", align: "right", numeric: true },
      ]}
      rows={rows.map((c) => ({
        id: c.email,
        by: { name: c.name, email: c.email, city: c.city, account: c.account ? "Signed up" : "Guest", orders: c.orders, spent: c.spent },
        cells: {
          name: (
            <span className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#c8e7ff] text-[12px] font-semibold text-[#0a0a0a]">{c.name.split(" ").map((w) => w[0]).join("")}</span>
              <span className="font-medium">{c.name}</span>
            </span>
          ),
          email: <span className="text-[#0a0a0a]/60">{c.email}</span>,
          city: <span className="text-[#0a0a0a]/70">{c.city}</span>,
          account: c.account ? <Pill tone="good">Signed up</Pill> : <Pill tone="off">Guest</Pill>,
          orders: c.orders,
          spent: <b className="font-semibold">{pkr(c.spent)}</b>,
        },
      }))}
    />
  );
}
