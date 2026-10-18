import { Download, Plus, Upload } from "lucide-react";
import { Metrics, Page } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { CustomersTable } from "@/components/next-admin/customers-table";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <Page title="Customers" sub="Everyone who has bought from you, guests and those with accounts." actions={<><Act msg="Choose a customer file"><Download /> Import</Act><Act msg="214 customers exported"><Upload /> Export</Act><Act kind="primary" msg="A new customer form would open"><Plus /> Add customer</Act></>}>
      <Metrics items={[{ label: "Customers", value: "214" }, { label: "With accounts", value: "86" }, { label: "Came back to buy again", value: "31%" }, { label: "New this month", value: "38", delta: "+12" }]} />
      <CustomersTable />
    </Page>
  );
}
