import { Download, Plus } from "lucide-react";
import { Button, PageHeader, StatStrip, pkr } from "@/components/new-admin/ui";
import { OrdersTable } from "@/components/new-admin/orders-table";
import { ORDERS } from "@/lib/new-admin/sample";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <>
      <PageHeader icon="orders" tone="iris" title="Orders" sub="Every order, how it was paid, and what is left to send." actions={<><Button><Download className="h-4 w-4" /> Export</Button><Button primary><Plus className="h-4 w-4" /> Create order</Button></>} />
      <StatStrip
        stats={[
          { label: "Orders today", value: "2", delta: "+1 on yesterday" },
          { label: "To fulfil", value: "4" },
          { label: "Cash to collect", value: pkr(16350) },
          { label: "Returns this month", value: "1", delta: "2% of orders" },
        ]}
      />
      <OrdersTable orders={ORDERS} views={["All", "Unfulfilled", "Cash on delivery", "Unpaid", "Returns"]} placeholder="Search by order number, customer or city" />
    </>
  );
}
