import { Download, Plus, Upload } from "lucide-react";
import { Btn, Metrics, Page, pkr } from "@/components/next-admin/ui";
import { Act } from "@/components/next-admin/act";
import { OrdersBoard } from "@/components/next-admin/orders-board";
import { A } from "@/components/next-admin/nav";
import { ORDERS } from "@/lib/new-admin/sample";

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <Page
      title="Orders"
      sub="Every order, where it is on its way, and what it needs from you next."
      actions={<><Act msg="Choose a Shopify or Synora order file"><Download /> Import</Act><Act msg="10 orders exported as a spreadsheet"><Upload /> Export</Act><Btn kind="primary" href={`${A}/orders/drafts`}><Plus /> Create order</Btn></>}
    >
      <Metrics
        items={[
          { label: "Orders today", value: "2", delta: "+1 on yesterday" },
          { label: "Waiting on you", value: "4", delta: "Confirm or pack", down: true },
          { label: "Cash to collect", value: pkr(16350) },
          { label: "Cancelled this month", value: "1", delta: "2% of orders" },
        ]}
      />
      <OrdersBoard orders={ORDERS} />
    </Page>
  );
}
