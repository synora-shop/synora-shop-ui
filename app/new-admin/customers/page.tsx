import { Download, Plus, Upload } from "lucide-react";
import { Button, PageHeader, StatStrip } from "@/components/new-admin/ui";
import { CustomersTable } from "@/components/new-admin/customers-table";

export const metadata = { title: "Customers" };

export default function CustomersPage() {
  return (
    <>
      <PageHeader icon="customers" tone="sky" title="Customers" sub="Everyone who has bought from you, guests and those with accounts." actions={<><Button><Download className="h-4 w-4" /> <span>Import<span className="max-sm:hidden"> CSV</span></span></Button><Button><Upload className="h-4 w-4" /> <span>Export<span className="max-sm:hidden"> CSV</span></span></Button><Button primary><Plus className="h-4 w-4" /> Add customer</Button></>} />
      <StatStrip stats={[{ label: "Customers", value: "214" }, { label: "With accounts", value: "86" }, { label: "Came back to buy again", value: "31%" }, { label: "New this month", value: "38", delta: "+12" }]} />
      <CustomersTable />
    </>
  );
}
