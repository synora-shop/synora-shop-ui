import { Download, Plus } from "lucide-react";
import { Button, PageHeader, StatStrip, pkr } from "@/components/new-admin/ui";
import { OrdersBoard } from "@/components/new-admin/orders-board";
import { ORDERS } from "@/lib/new-admin/sample";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <>
      <PageHeader icon="orders" tone="iris" title="Orders" sub="Every order, where it is on its way, and what it needs from you next." actions={<><Button><Download className="h-4 w-4" /> Export</Button><Button primary href="/new-admin/orders/drafts"><Plus className="h-4 w-4" /> Create order</Button></>} />
      <StatStrip
        stats={[
          { label: "Orders today", value: "2", delta: "+1 on yesterday" },
          { label: "Waiting on you", value: "4", delta: "Confirm or pack" },
          { label: "Cash to collect", value: pkr(16350) },
          { label: "Cancelled this month", value: "1", delta: "2% of orders" },
        ]}
      />
      <OrdersBoard orders={ORDERS} />
    </>
  );
}
