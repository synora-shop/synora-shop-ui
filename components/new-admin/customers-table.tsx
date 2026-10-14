import { ListBar, Pill, pkr, td, th } from "@/components/new-admin/ui";
import { CUSTOMERS } from "@/lib/new-admin/sample";

export function CustomersTable({ accountsOnly = false }: { accountsOnly?: boolean }) {
  const rows = accountsOnly ? CUSTOMERS.filter((c) => c.account) : CUSTOMERS;
  return (
    <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#0d0d50]/[0.07]">
      <ListBar views={accountsOnly ? ["With accounts"] : ["All", "Returning", "From Lahore", "Not ordered in 60 days"]} placeholder="Search by name, email or city" />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead className="bg-[#fafafc]"><tr><th className={th}>Customer</th><th className={th}>City</th><th className={th}>Account</th><th className={`${th} text-right`}>Orders</th><th className={`${th} text-right`}>Spent</th></tr></thead>
          <tbody className="divide-y divide-[#0d0d50]/[0.06]">
            {rows.map((c) => (
              <tr key={c.email} className="hover:bg-[#fafafc]">
                <td className={td}>
                  <span className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ecebff] text-[12px] font-semibold text-[#4b4bea]">{c.name.split(" ").map((w) => w[0]).join("")}</span>
                    <span><span className="block font-medium">{c.name}</span><span className="text-[12.5px] text-[#0d0d50]/50">{c.email}</span></span>
                  </span>
                </td>
                <td className={`${td} text-[#0d0d50]/70`}>{c.city}</td>
                <td className={td}>{c.account ? <Pill tone="good">Signed up</Pill> : <Pill tone="off">Guest</Pill>}</td>
                <td className={`${td} text-right tabular-nums`}>{c.orders}</td>
                <td className={`${td} text-right font-semibold tabular-nums`}>{pkr(c.spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
