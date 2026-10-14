import { PageHeader } from "@/components/new-admin/ui";
import { CustomersTable } from "@/components/new-admin/customers-table";

export const metadata = { title: "Customers with accounts" };

export default function AccountsPage() {
  return (
    <>
      <PageHeader icon="customers" tone="sky" title="Customers with accounts" sub="They signed in with their email, so their addresses and orders are saved." />
      <CustomersTable accountsOnly />
    </>
  );
}
