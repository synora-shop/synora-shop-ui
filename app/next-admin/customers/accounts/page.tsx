import { Page } from "@/components/next-admin/ui";
import { CustomersTable } from "@/components/next-admin/customers-table";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Customers with accounts" };

export default function AccountsPage() {
  return (
    <Page title="With accounts" crumbs={[{ label: "Customers", href: `${A}/customers` }]} sub="They signed in with their email, so their addresses and orders are saved.">
      <CustomersTable accountsOnly />
    </Page>
  );
}
