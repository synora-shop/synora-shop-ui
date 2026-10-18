import { Plus } from "lucide-react";
import { Btn, Page, T } from "@/components/next-admin/ui";
import { Copy } from "@/components/next-admin/act";
import { Table } from "@/components/next-admin/table";
import { A } from "@/components/next-admin/nav";

export const metadata = { title: "Custom fields" };

/** Extra details a theme can print. Each shows the exact line that prints it, copied in one click. */
const FIELDS = [
  { on: "Products", name: "Fabric", type: "Text", key: "fabric", filled: "11 of 12" },
  { on: "Products", name: "Care instructions", type: "Text", key: "care", filled: "9 of 12" },
  { on: "Products", name: "Dupatta length", type: "Number (metres)", key: "dupatta_length", filled: "6 of 12" },
  { on: "Variants", name: "Chest size", type: "Number (inches)", key: "chest", filled: "28 of 40" },
  { on: "Customers", name: "Preferred delivery time", type: "Choice", key: "delivery_time", filled: "31 of 214" },
  { on: "Orders", name: "Gift message", type: "Text", key: "gift_message", filled: "on 6 orders" },
];

export default function FieldsPage() {
  return (
    <Page title="Custom fields" crumbs={[{ label: "Content", href: `${A}/content` }]} sub="Extra details on products, orders and customers, for your theme to show." actions={<Btn kind="primary"><Plus /> Add a field</Btn>}>
      <Table
        minWidth={760}
        views={["All", "Products", "Variants", "Customers", "Orders"]}
        cols={[{ key: "name", label: "Field" }, { key: "on", label: "On" }, { key: "type", label: "Kind" }, { key: "filled", label: "Filled in" }, { key: "path", label: "Prints with", sort: false }]}
        rows={FIELDS.map((f) => ({
          id: f.on + f.key,
          views: [f.on],
          by: { name: f.name, on: f.on, type: f.type, filled: f.filled },
          cells: {
            name: <b className="font-medium">{f.name}</b>,
            on: f.on,
            type: <span className={T.muted}>{f.type}</span>,
            filled: <span className={T.muted}>{f.filled}</span>,
            path: <Copy text={`{{ ${f.on === "Variants" ? "variant" : f.on.toLowerCase().replace(/s$/, "")}.metafields.custom.${f.key} }}`} />,
          },
        }))}
      />
    </Page>
  );
}
